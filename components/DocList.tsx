"use client";

import { Document } from "@/types";

interface DocListProps {
  docs: Document[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatTime(words: number): string {
  const mins = Math.ceil(words / 150);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function progressPct(doc: Document): number {
  if (doc.text.length === 0) return 0;
  return Math.min(100, Math.round((doc.progress / doc.text.length) * 100));
}

export default function DocList({ docs, activeId, onSelect, onDelete }: DocListProps) {
  if (docs.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[#6a6050] text-sm font-mono">
        No documents yet.
        <br />
        Add one to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2">
      {docs.map((doc) => {
        const pct = progressPct(doc);
        const isActive = doc.id === activeId;
        return (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`group w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
              isActive
                ? "bg-[#1c1a16] border border-[#2c2820]"
                : "hover:bg-[#141210] border border-transparent"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`text-sm font-serif leading-tight truncate ${
                  isActive ? "text-[#d4a847]" : "text-[#ddd5c2]"
                }`}
              >
                {doc.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[#6a6050] hover:text-red-400 transition-opacity text-xs mt-0.5 shrink-0"
                title="Delete"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-[#6a6050]">
              <span>{doc.wordCount.toLocaleString()} words</span>
              <span>·</span>
              <span>{formatTime(doc.wordCount)}</span>
            </div>
            <div className="mt-2 h-1 bg-[#1c1a16] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4a847] rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
