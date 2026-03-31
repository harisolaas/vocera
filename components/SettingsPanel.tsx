"use client";

import { useState } from "react";
import { Settings } from "@/types";

interface SettingsPanelProps {
  settings: Settings;
  onSetApiKey: (key: string) => void;
  onSetVoiceId: (id: string) => void;
}

export default function SettingsPanel({ settings, onSetApiKey, onSetVoiceId }: SettingsPanelProps) {
  const [keyInput, setKeyInput] = useState(settings.apiKey);

  const handleSave = () => {
    onSetApiKey(keyInput.trim());
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="font-serif text-xl text-[#ddd5c2] mb-6">Settings</h2>

      <div className="space-y-6">
        {/* API Key */}
        <div>
          <label className="block text-xs font-mono text-[#6a6050] mb-1.5">
            ElevenLabs API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="xi-..."
              className="flex-1 bg-[#141210] border border-[#2c2820] rounded-lg px-3 py-2 text-sm text-[#ddd5c2] placeholder:text-[#3a3628] focus:outline-none focus:border-[#d4a847] font-mono"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-mono text-[#0c0b09] bg-[#d4a847] hover:bg-[#c49a3f] rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
          <p className="text-xs font-mono text-[#6a6050] mt-1.5">
            Stored locally in your browser. Never sent to our servers.
          </p>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-xs font-mono text-[#6a6050] mb-3">Voice</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {settings.voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => onSetVoiceId(voice.id)}
                className={`px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  voice.id === settings.voiceId
                    ? "border-[#d4a847] bg-[rgba(212,168,71,0.2)] text-[#d4a847]"
                    : "border-[#2c2820] bg-[#141210] text-[#ddd5c2] hover:bg-[#1c1a16]"
                }`}
              >
                <div className="text-sm font-serif">{voice.name}</div>
                <div className="text-xs font-mono text-[#6a6050] mt-0.5">{voice.category}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
