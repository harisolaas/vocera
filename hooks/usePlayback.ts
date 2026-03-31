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

  // Audio buffer cache: chunkIndex → ArrayBuffer of audio data
  const bufferCache = useRef<Map<number, ArrayBuffer>>(new Map());
  const fetchingSet = useRef<Set<number>>(new Set());

  // Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Stable refs for values read in async callbacks
  const chunkIdxRef = useRef(0);
  const isPlayingRef = useRef(false);
  const apiKeyRef = useRef(apiKey);
  const voiceIdRef = useRef(voiceId);
  const docIdRef = useRef(documentId);
  const chunksRef = useRef<Chunk[]>([]);
  const onProgressSaveRef = useRef(onProgressSave);

  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { voiceIdRef.current = voiceId; }, [voiceId]);
  useEffect(() => { docIdRef.current = documentId; }, [documentId]);
  useEffect(() => { onProgressSaveRef.current = onProgressSave; }, [onProgressSave]);

  // Get or create AudioContext (must be called from user gesture the first time)
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

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

    if (documentProgress > 0 && newChunks.length > 0) {
      const idx = newChunks.findIndex((c) => c.start >= documentProgress);
      const restored = idx >= 0 ? idx : newChunks.length - 1;
      setChunkIdx(restored);
      chunkIdxRef.current = restored;
    } else {
      setChunkIdx(0);
      chunkIdxRef.current = 0;
    }

    bufferCache.current.clear();
    fetchingSet.current.clear();
  }, [documentText, documentProgress]);

  // Fetch audio for a chunk as ArrayBuffer
  const synthesize = useCallback(async (idx: number): Promise<ArrayBuffer | null> => {
    const cached = bufferCache.current.get(idx);
    if (cached) return cached;

    const chunk = chunksRef.current[idx];
    if (!chunk) return null;

    if (fetchingSet.current.has(idx)) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (bufferCache.current.has(idx)) {
            clearInterval(interval);
            resolve(bufferCache.current.get(idx)!);
          } else if (!fetchingSet.current.has(idx)) {
            clearInterval(interval);
            resolve(null);
          }
        }, 100);
      });
    }

    fetchingSet.current.add(idx);
    try {
      const prevChunk = idx > 0 ? chunksRef.current[idx - 1] : null;

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-el-key": apiKeyRef.current,
        },
        body: JSON.stringify({
          voiceId: voiceIdRef.current,
          text: chunk.text,
          previousText: prevChunk?.text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `TTS failed with status ${res.status}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      bufferCache.current.set(idx, arrayBuffer);
      return arrayBuffer;
    } finally {
      fetchingSet.current.delete(idx);
    }
  }, []);

  const prefetch = useCallback((idx: number) => {
    if (idx < 0 || idx >= chunksRef.current.length) return;
    if (bufferCache.current.has(idx) || fetchingSet.current.has(idx)) return;
    synthesize(idx).catch(() => {});
  }, [synthesize]);

  // Core playback: decode and schedule a chunk via Web Audio API
  const playChunkRef = useRef<(idx: number) => Promise<void>>(async () => {});

  const playChunk = useCallback(async (idx: number) => {
    if (idx >= chunksRef.current.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    setChunkIdx(idx);
    chunkIdxRef.current = idx;
    setIsBuffering(true);
    setError(null);

    try {
      const audioData = await synthesize(idx);
      if (!audioData) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setIsBuffering(false);
        return;
      }

      // Check if we were stopped while fetching
      if (!isPlayingRef.current) {
        setIsBuffering(false);
        return;
      }

      prefetch(idx + 1);
      prefetch(idx + 2);

      const ctx = getAudioContext();

      // Stop any currently playing source
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.onended = null;
          currentSourceRef.current.stop();
        } catch {
          // ignore if already stopped
        }
        currentSourceRef.current = null;
      }

      // Decode the audio data
      const audioBuffer = await ctx.decodeAudioData(audioData.slice(0));

      // Check again if we were stopped during decoding
      if (!isPlayingRef.current) {
        setIsBuffering(false);
        return;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current!);
      currentSourceRef.current = source;

      setIsBuffering(false);

      source.onended = () => {
        currentSourceRef.current = null;

        // Save progress
        const currentDocId = docIdRef.current;
        const nextChunk = chunksRef.current[chunkIdxRef.current + 1];
        if (currentDocId && nextChunk) {
          onProgressSaveRef.current(currentDocId, nextChunk.start);
        } else if (currentDocId) {
          const lastChunk = chunksRef.current[chunkIdxRef.current];
          if (lastChunk) onProgressSaveRef.current(currentDocId, lastChunk.end);
        }

        if (isPlayingRef.current) {
          playChunkRef.current(chunkIdxRef.current + 1);
        }
      };

      source.start(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "TTS synthesis failed");
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsBuffering(false);
    }
  }, [synthesize, prefetch, getAudioContext]);

  useEffect(() => { playChunkRef.current = playChunk; }, [playChunk]);

  const play = useCallback((fromIdx?: number) => {
    const idx = fromIdx ?? chunkIdxRef.current;
    setError(null);
    setIsPlaying(true);
    isPlayingRef.current = true;
    // Ensure AudioContext is created in user gesture context
    getAudioContext();
    playChunkRef.current(idx);
  }, [getAudioContext]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (audioCtxRef.current && audioCtxRef.current.state === "running") {
      audioCtxRef.current.suspend();
    }
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
      // If there's no active source (e.g. after error), restart from current chunk
      if (!currentSourceRef.current) {
        playChunkRef.current(chunkIdxRef.current);
      }
    } else {
      // No audio context yet or no source — start fresh
      play(chunkIdxRef.current);
    }
  }, [play]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
      } catch {
        // ignore
      }
      currentSourceRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "running") {
      audioCtxRef.current.suspend();
    }
    setChunkIdx(0);
    chunkIdxRef.current = 0;
  }, []);

  const seek = useCallback((pct: number) => {
    const totalChunks = chunksRef.current.length;
    if (totalChunks === 0) return;
    const targetIdx = Math.min(Math.floor(pct * totalChunks), totalChunks - 1);

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
      } catch {
        // ignore
      }
      currentSourceRef.current = null;
    }

    setChunkIdx(targetIdx);
    chunkIdxRef.current = targetIdx;

    if (isPlayingRef.current) {
      playChunkRef.current(targetIdx);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.onended = null;
          currentSourceRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
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
