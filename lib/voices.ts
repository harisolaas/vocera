import { Voice } from "@/types";

export const DEFAULT_VOICES: Voice[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", category: "premade" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", category: "premade" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", category: "premade" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "premade" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", category: "premade" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", category: "premade" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", category: "premade" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", category: "premade" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", category: "premade" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", category: "premade" },
  { id: "g5CIjZEefAph4nQFvHAz", name: "Ethan", category: "premade" },
  { id: "oWAxZDx7w5VEj9dCyTzz", name: "Grace", category: "premade" },
];

export async function fetchVoices(apiKey: string): Promise<Voice[]> {
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) return DEFAULT_VOICES;
    const data = await res.json();
    return (data.voices ?? []).map((v: { voice_id: string; name: string; category: string }) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
    }));
  } catch {
    return DEFAULT_VOICES;
  }
}
