"use client";

import { useState, useEffect, useCallback } from "react";
import { Document } from "@/types";

const STORAGE_KEY = "vocera-docs";

function loadDocs(): Document[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(docs: Document[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function useDocuments() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDocs(loadDocs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveDocs(docs);
  }, [docs, loaded]);

  const addDocument = useCallback((title: string, text: string) => {
    const doc: Document = {
      id: crypto.randomUUID(),
      title,
      text,
      progress: 0,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      addedAt: Date.now(),
    };
    setDocs((prev) => [doc, ...prev]);
    return doc.id;
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, progress } : d))
    );
  }, []);

  return { docs, loaded, addDocument, deleteDocument, updateProgress };
}
