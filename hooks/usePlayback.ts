"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Chunk } from "@/types";
import { splitIntoChunks } from "@/lib/chunks";

interface UsePlaybackOpts {
  apiKey: string;
  voiceId: string;
  documentId: string | null;
  documentText: string;
  documentProgress: number;
  onProgressSave: (id: string, progress: number) => void;
}

export function usePlayback({
  apiKey,
  voiceId,
  documentId,
  documentText,
  documentProgress,
  onProgressSave,
}: UsePlaybackOpts) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlCache = useRef<Map<number, string>>(new Map());
  const fetchingSet = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunkIdxRef = useRef(0);
  const isPlayingRef = useRef(false);
  const apiKeyRef = useRef(apiKey);
  const voiceIdRef = useRef(voiceId);
  const docIdRef = useRef(documentId);
  const chunksRef = useRef<Chunk[]>([]);

  // Keep refs in sync
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { voiceIdRef.current = voiceId; }, [voiceId]);
  useEffect(() => { docIdRef.current = documentId; }, [documentId]);

  // Rebuild chunks when document text changes
  useEffect(() => {
    if (!documentText) {
      setChunks([]);
      chunksRef.current = [];
      return;
    }
    const newChunks = splitIntoChunks(documentText);
    setChunks(newChunks);
    chunksRef.current = newChunks;

    // Restore position from progress
    if (documentProgress > 0 && newChunks.length > 0) {
      const idx = newChunks.findIndex((c) => c.start >= documentProgress);
      const restored = idx >= 0 ? idx : newChunks.length - 1;
      setChunkIdx(restored);
      chunkIdxRef.current = restored;
    } else {
      setChunkIdx(0);
      chunkIdxRef.current = 0;
    }

    // Clear cache when document changes
    urlCache.current.forEach((url) => URL.revokeObjectURL(url));
    urlCache.current.clear();
    fetchingSet.current.clear();
  }, [documentText, documentProgress]);

  const synthesize = useCallback(async (idx: number): Promise<string | null> => {
    const cached = urlCache.current.get(idx);
    if (cached) return cached;

    const chunk = chunksRef.current[idx];
    if (!chunk) return null;

    if (fetchingSet.current.has(idx)) {
      // Wait for in-flight fetch
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          const url = urlCache.current.get(idx);
          if (url) {
            clearInterval(interval);
            resolve(url);
          }
          if (!fetchingSet.current.has(idx) && !urlCache.current.has(idx)) {
            clearInterval(interval);
            resolve(null);
          }
        }, 100);
      });
    }

    fetchingSet.current.add(idx);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-el-key": apiKeyRef.current,
        },
        body: JSON.stringify({ voiceId: voiceIdRef.current, text: chunk.text }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `TTS failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlCache.current.set(idx, url);
      return url;
    } catch (e) {
      throw e;
    } finally {
      fetchingSet.current.delete(idx);
    }
  }, []);

  const prefetch = useCallback((idx: number) => {
    if (idx < 0 || idx >= chunksRef.current.length) return;
    if (urlCache.current.has(idx) || fetchingSet.current.has(idx)) return;
    synthesize(idx).catch(() => {});
  }, [synthesize]);

  const playChunk = useCallback(async (idx: number) => {
    if (idx >= chunksRef.current.length) {
      // Reached end
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    setChunkIdx(idx);
    chunkIdxRef.current = idx;
    setIsBuffering(true);
    setError(null);

    try {
      const url = await synthesize(idx);
      if (!url) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setIsBuffering(false);
        return;
      }

      // Prefetch next chunks
      prefetch(idx + 1);
      prefetch(idx + 2);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      setIsBuffering(false);

      audio.onended = () => {
        // Save progress
        const currentDocId = docIdRef.current;
        const nextChunk = chunksRef.current[chunkIdxRef.current + 1];
        if (currentDocId && nextChunk) {
          onProgressSave(currentDocId, nextChunk.start);
        } else if (currentDocId) {
          // Finished last chunk — save end of text
          const lastChunk = chunksRef.current[chunkIdxRef.current];
          if (lastChunk) onProgressSave(currentDocId, lastChunk.end);
        }

        if (isPlayingRef.current) {
          playChunk(chunkIdxRef.current + 1);
        }
      };

      audio.onerror = () => {
        setError("Audio playback error");
        setIsPlaying(false);
        isPlayingRef.current = false;
      };

      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "TTS synthesis failed");
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsBuffering(false);
    }
  }, [synthesize, prefetch, onProgressSave]);

  const play = useCallback((fromIdx?: number) => {
    const idx = fromIdx ?? chunkIdxRef.current;
    setIsPlaying(true);
    isPlayingRef.current = true;
    playChunk(idx);
  }, [playChunk]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
      setIsPlaying(true);
      isPlayingRef.current = true;
      audioRef.current.play().catch(() => {
        // If resume fails, restart from current chunk
        playChunk(chunkIdxRef.current);
      });
      audioRef.current.onended = () => {
        const currentDocId = docIdRef.current;
        const nextChunk = chunksRef.current[chunkIdxRef.current + 1];
        if (currentDocId && nextChunk) {
          onProgressSave(currentDocId, nextChunk.start);
        }
        if (isPlayingRef.current) {
          playChunk(chunkIdxRef.current + 1);
        }
      };
    } else {
      play();
    }
  }, [play, playChunk, onProgressSave]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setChunkIdx(0);
    chunkIdxRef.current = 0;
  }, []);

  const seek = useCallback((pct: number) => {
    const totalChunks = chunksRef.current.length;
    if (totalChunks === 0) return;
    const targetIdx = Math.min(Math.floor(pct * totalChunks), totalChunks - 1);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    setChunkIdx(targetIdx);
    chunkIdxRef.current = targetIdx;

    if (isPlayingRef.current) {
      playChunk(targetIdx);
    }
  }, [playChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      urlCache.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return {
    chunks,
    chunkIdx,
    isPlaying,
    isBuffering,
    error,
    play,
    pause,
    resume,
    stop,
    seek,
    setError,
  };
}
