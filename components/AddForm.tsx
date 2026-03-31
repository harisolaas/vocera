"use client";

import { useState, useRef } from "react";
import { extractPDFText } from "@/lib/pdf";

interface AddFormProps {
  onAdd: (title: string, text: string) => void;
}

export default function AddForm({ onAdd }: AddFormProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      let content: string;
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        content = await extractPDFText(file);
      } else {
        content = await file.text();
      }
      setText(content);
      if (!title) {
        setTitle(file.name.replace(/\.\w+$/, ""));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    const finalTitle = title.trim() || "Untitled";
    onAdd(finalTitle, trimmedText);
    setTitle("");
    setText("");
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="font-serif text-xl text-[#ddd5c2] mb-6">Add Document</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-[#6a6050] mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="w-full bg-[#141210] border border-[#2c2820] rounded-lg px-3 py-2 text-sm text-[#ddd5c2] placeholder:text-[#3a3628] focus:outline-none focus:border-[#d4a847] font-serif"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-[#6a6050] mb-1.5">
            Paste text or upload a file
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
            rows={12}
            className="w-full bg-[#141210] border border-[#2c2820] rounded-lg px-3 py-3 text-sm text-[#ddd5c2] placeholder:text-[#3a3628] focus:outline-none focus:border-[#d4a847] font-serif resize-y leading-relaxed"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="px-4 py-2 text-xs font-mono text-[#ddd5c2] bg-[#1c1a16] hover:bg-[#2c2820] border border-[#2c2820] rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Reading..." : "Upload File"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <span className="text-xs font-mono text-[#6a6050]">.txt, .md, .pdf</span>
        </div>

        {error && (
          <div className="text-xs font-mono text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="w-full py-2.5 text-sm font-mono text-[#0c0b09] bg-[#d4a847] hover:bg-[#c49a3f] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Add Document
        </button>
      </div>
    </div>
  );
}
