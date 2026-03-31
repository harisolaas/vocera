export interface Document {
  id: string;
  title: string;
  text: string;
  progress: number; // char offset
  wordCount: number;
  addedAt: number;
}

export interface Voice {
  id: string;
  name: string;
  category: string;
}

export interface Chunk {
  index: number;
  text: string;
  start: number; // char offset in original text
  end: number;
}

export interface Settings {
  apiKey: string;
  voiceId: string;
}
