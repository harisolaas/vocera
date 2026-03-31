"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Voice } from "@/types";
import { DEFAULT_VOICES, fetchVoices } from "@/lib/voices";

const STORAGE_KEY = "vocera-settings";

const defaultSettings: Settings = {
  apiKey: "",
  voiceId: DEFAULT_VOICES[0].id,
  voices: DEFAULT_VOICES,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveSettings(settings);
  }, [settings, loaded]);

  const setApiKey = useCallback((apiKey: string) => {
    setSettings((prev) => ({ ...prev, apiKey }));
    if (apiKey) {
      fetchVoices(apiKey).then((voices) => {
        setSettings((prev) => ({ ...prev, voices }));
      });
    }
  }, []);

  const setVoiceId = useCallback((voiceId: string) => {
    setSettings((prev) => ({ ...prev, voiceId }));
  }, []);

  const setVoices = useCallback((voices: Voice[]) => {
    setSettings((prev) => ({ ...prev, voices }));
  }, []);

  return { settings, loaded, setApiKey, setVoiceId, setVoices };
}
