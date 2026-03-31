"use client";

import { Document } from "@/types";
import DocList from "./DocList";

interface SidebarProps {
  docs: Document[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onSettings: () => void;
}

export default function Sidebar({
  docs,
  activeId,
  onSelect,
  onDelete,
  onAdd,
  onSettings,
}: SidebarProps) {
  return (
    <aside className="hidden sm:flex flex-col w-[252px] shrink-0 h-screen border-r border-[#2c2820] bg-[#0c0b09]">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2c2820]">
        <h1 className="font-serif text-lg text-[#d4a847] tracking-wide">Vocera</h1>
        <div className="flex gap-1">
          <button
            onClick={onAdd}
            className="px-2.5 py-1 text-xs font-mono text-[#ddd5c2] bg-[#1c1a16] hover:bg-[#2c2820] rounded transition-colors border border-[#2c2820]"
          >
            + Add
          </button>
          <button
            onClick={onSettings}
            className="px-2 py-1 text-xs font-mono text-[#6a6050] hover:text-[#ddd5c2] transition-colors"
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <DocList docs={docs} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
      </div>
    </aside>
  );
}
