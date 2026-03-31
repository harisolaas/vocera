import { Chunk } from "@/types";

export function splitIntoChunks(text: string): Chunk[] {
  const regex = /[^.!?…\n]+(?:[.!?…]+(?:\s|$)|\n+|$)/g;
  const chunks: Chunk[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (trimmed.length === 0) continue;
    chunks.push({
      index: chunks.length,
      text: trimmed,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return chunks;
}
