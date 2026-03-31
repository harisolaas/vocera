"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings } from "@/types";
import { DEFAULT_VOICES } from "@/lib/voices";

const STORAGE_KEY = "vocera-settings";

const defaultSettings: Settings = {
  apiKey: "",
  voiceId: DEFAULT_VOICES[0].id,
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

export type KeyStatus = "idle" | "valid" | "no-key";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>("idle");

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setLoaded(true);
    setKeyStatus(s.apiKey ? "valid" : "no-key");
  }, []);

  useEffect(() => {
    if (loaded) saveSettings(settings);
  }, [settings, loaded]);

  const setApiKey = useCallback((apiKey: string) => {
    if (!apiKey) {
      setSettings((prev) => ({ ...prev, apiKey: "" }));
      setKeyStatus("no-key");
      return;
    }
    setSettings((prev) => ({ ...prev, apiKey }));
    setKeyStatus("valid");
  }, []);

  const setVoiceId = useCallback((voiceId: string) => {
    setSettings((prev) => ({ ...prev, voiceId }));
  }, []);

  return { settings, loaded, keyStatus, setApiKey, setVoiceId };
}
