"use client";

import { Chunk } from "@/types";

interface PlaybackControlsProps {
  chunks: Chunk[];
  chunkIdx: number;
  isPlaying: boolean;
  isBuffering: boolean;
  voiceName: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeek: (pct: number) => void;
}

export default function PlaybackControls({
  chunks,
  chunkIdx,
  isPlaying,
  isBuffering,
  voiceName,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeek,
}: PlaybackControlsProps) {
  const total = chunks.length;
  const pct = total > 0 ? (chunkIdx / total) * 100 : 0;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else if (chunkIdx > 0 || isBuffering) {
      onResume();
    } else {
      onPlay();
    }
  };

  return (
    <div className="border-t border-[#2c2820] bg-[#0c0b09] px-4 py-3 mb-14 sm:mb-0">
      {/* Progress track */}
      <div
        className="h-1.5 bg-[#1c1a16] rounded-full cursor-pointer mb-3 group"
        onClick={handleTrackClick}
      >
        <div
          className="h-full bg-[#d4a847] rounded-full transition-all duration-200 relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#d4a847] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Stop */}
          <button
            onClick={onStop}
            className="w-8 h-8 flex items-center justify-center text-[#6a6050] hover:text-[#ddd5c2] transition-colors"
            title="Stop"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="1" width="12" height="12" rx="1" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            disabled={isBuffering}
            className="w-12 h-12 flex items-center justify-center bg-[#d4a847] hover:bg-[#c49a3f] text-[#0c0b09] rounded-full transition-colors disabled:opacity-50"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
              </svg>
            ) : isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="3" y="2" width="4" height="14" rx="1" />
                <rect x="11" y="2" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M4 2.5L15 9L4 15.5V2.5Z" />
              </svg>
            )}
          </button>
        </div>

        {/* Segment info */}
        <div className="flex items-center gap-3 text-xs font-mono text-[#6a6050]">
          <span>
            {total > 0 ? chunkIdx + 1 : 0} / {total}
          </span>
          <span className="hidden sm:inline">{voiceName}</span>
        </div>
      </div>
    </div>
  );
}
