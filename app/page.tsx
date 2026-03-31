"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import AddForm from "@/components/AddForm";
import SettingsPanel from "@/components/SettingsPanel";
import ReaderView from "@/components/ReaderView";
import MobileNav from "@/components/MobileNav";
import DocList from "@/components/DocList";
import { useDocuments } from "@/hooks/useDocuments";
import { useSettings } from "@/hooks/useSettings";
import { usePlayback } from "@/hooks/usePlayback";

type View = "home" | "add" | "settings" | "reader";
type MobileTab = "docs" | "add" | "reader" | "settings";

export default function Home() {
  const { docs, loaded: docsLoaded, addDocument, deleteDocument, updateProgress } = useDocuments();
  const { settings, loaded: settingsLoaded, setApiKey, setVoiceId } = useSettings();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");
  const [mobileTab, setMobileTab] = useState<MobileTab>("docs");

  const activeDoc = docs.find((d) => d.id === activeDocId) ?? null;

  const {
    chunks,
    chunkIdx,
    isPlaying,
    isBuffering,
    error,
    play,
    pause,
    resume,
    stop,
    seek,
    setError,
  } = usePlayback({
    apiKey: settings.apiKey,
    voiceId: settings.voiceId,
    documentId: activeDocId,
    documentText: activeDoc?.text ?? "",
    documentProgress: activeDoc?.progress ?? 0,
    onProgressSave: updateProgress,
  });

  const voiceName = settings.voices.find((v) => v.id === settings.voiceId)?.name ?? "Unknown";

  const handleSelectDoc = useCallback((id: string) => {
    stop();
    setActiveDocId(id);
    setView("reader");
    setMobileTab("reader");
  }, [stop]);

  const handleDeleteDoc = useCallback((id: string) => {
    if (id === activeDocId) {
      stop();
      setActiveDocId(null);
      setView("home");
      setMobileTab("docs");
    }
    deleteDocument(id);
  }, [activeDocId, stop, deleteDocument]);

  const handleAdd = useCallback((title: string, text: string) => {
    const id = addDocument(title, text);
    setActiveDocId(id);
    setView("reader");
    setMobileTab("reader");
  }, [addDocument]);

  const handlePlay = useCallback(() => {
    if (!settings.apiKey) {
      setView("settings");
      setMobileTab("settings");
      return;
    }
    play();
  }, [settings.apiKey, play]);

  if (!docsLoaded || !settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0c0b09]">
        <span className="text-[#6a6050] font-mono text-sm">Loading…</span>
      </div>
    );
  }

  // Desktop content
  const renderDesktopContent = () => {
    switch (view) {
      case "add":
        return <AddForm onAdd={handleAdd} />;
      case "settings":
        return (
          <SettingsPanel
            settings={settings}
            onSetApiKey={setApiKey}
            onSetVoiceId={setVoiceId}
          />
        );
      case "reader":
        if (!activeDoc) return renderHome();
        return (
          <ReaderView
            doc={activeDoc}
            chunks={chunks}
            chunkIdx={chunkIdx}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            error={error}
            voiceName={voiceName}
            onPlay={handlePlay}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            onSeek={seek}
            onDismissError={() => setError(null)}
          />
        );
      default:
        return renderHome();
    }
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h2 className="font-serif text-2xl text-[#ddd5c2] mb-2">Vocera</h2>
      <p className="font-mono text-sm text-[#6a6050] max-w-sm">
        Your personal text-to-speech reader. Add a document to get started, or select one from the
        sidebar.
      </p>
    </div>
  );

  // Mobile content
  const renderMobileContent = () => {
    switch (mobileTab) {
      case "docs":
        return (
          <div className="px-2 py-4">
            <div className="flex items-center justify-between px-2 mb-4">
              <h1 className="font-serif text-lg text-[#d4a847]">Vocera</h1>
            </div>
            <DocList
              docs={docs}
              activeId={activeDocId}
              onSelect={handleSelectDoc}
              onDelete={handleDeleteDoc}
            />
          </div>
        );
      case "add":
        return <AddForm onAdd={handleAdd} />;
      case "settings":
        return (
          <SettingsPanel
            settings={settings}
            onSetApiKey={setApiKey}
            onSetVoiceId={setVoiceId}
          />
        );
      case "reader":
        if (!activeDoc) {
          return (
            <div className="flex items-center justify-center h-full text-center px-4">
              <p className="font-mono text-sm text-[#6a6050]">
                Select a document first.
              </p>
            </div>
          );
        }
        return (
          <ReaderView
            doc={activeDoc}
            chunks={chunks}
            chunkIdx={chunkIdx}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            error={error}
            voiceName={voiceName}
            onPlay={handlePlay}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            onSeek={seek}
            onDismissError={() => setError(null)}
          />
        );
    }
  };

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden sm:flex h-screen">
        <Sidebar
          docs={docs}
          activeId={activeDocId}
          onSelect={handleSelectDoc}
          onDelete={handleDeleteDoc}
          onAdd={() => setView("add")}
          onSettings={() => setView("settings")}
        />
        <main className="flex-1 flex flex-col overflow-hidden">{renderDesktopContent()}</main>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden flex flex-col h-screen pb-14">
        <main className="flex-1 overflow-y-auto">{renderMobileContent()}</main>
        <MobileNav
          active={mobileTab}
          hasActiveDoc={!!activeDoc}
          onChange={setMobileTab}
        />
      </div>
    </>
  );
}
