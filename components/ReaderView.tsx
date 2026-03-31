"use client";

import { useEffect, useRef } from "react";
import { Document, Chunk } from "@/types";
import PlaybackControls from "./PlaybackControls";

interface ReaderViewProps {
  doc: Document;
  chunks: Chunk[];
  chunkIdx: number;
  isPlaying: boolean;
  isBuffering: boolean;
  error: string | null;
  voiceName: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeek: (pct: number) => void;
  onDismissError: () => void;
}

export default function ReaderView({
  doc,
  chunks,
  chunkIdx,
  isPlaying,
  isBuffering,
  error,
  voiceName,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeek,
  onDismissError,
}: ReaderViewProps) {
  const activeRef = useRef<HTMLSpanElement>(null);
  const progressPct = doc.text.length > 0
    ? Math.round((doc.progress / doc.text.length) * 100)
    : 0;

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [chunkIdx]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2c2820] flex items-center justify-between">
        <div>
          <h2 className="font-serif text-base text-[#ddd5c2] truncate">{doc.title}</h2>
          <div className="text-xs font-mono text-[#6a6050] mt-0.5">
            {doc.wordCount.toLocaleString()} words · {progressPct}% read
          </div>
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 bg-red-400/10 border-b border-red-400/20 flex items-center justify-between">
          <span className="text-xs font-mono text-red-400">{error}</span>
          <button
            onClick={onDismissError}
            className="text-xs text-red-400 hover:text-red-300 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Text area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="max-w-2xl mx-auto font-serif text-base leading-relaxed">
          {chunks.length > 0 ? (
            chunks.map((chunk) => {
              const isPast = chunk.index < chunkIdx;
              const isCurrent = chunk.index === chunkIdx;
              return (
                <span
                  key={chunk.index}
                  ref={isCurrent ? activeRef : undefined}
                  className={`${
                    isCurrent
                      ? "bg-[rgba(212,168,71,0.2)] text-[#ddd5c2] rounded px-0.5"
                      : isPast
                      ? "text-[#3a3628]"
                      : "text-[#ddd5c2]"
                  }`}
                >
                  {chunk.text}{" "}
                </span>
              );
            })
          ) : (
            <p className="text-[#6a6050]">{doc.text}</p>
          )}
        </div>
      </div>

      {/* Playback controls */}
      <PlaybackControls
        chunks={chunks}
        chunkIdx={chunkIdx}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        voiceName={voiceName}
        onPlay={onPlay}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
        onSeek={onSeek}
      />
    </div>
  );
}
