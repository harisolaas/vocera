"use client";

type Tab = "docs" | "add" | "reader" | "settings";

interface MobileNavProps {
  active: Tab;
  hasActiveDoc: boolean;
  onChange: (tab: Tab) => void;
}

export default function MobileNav({ active, hasActiveDoc, onChange }: MobileNavProps) {
  const tabs: { id: Tab; label: string; icon: string; disabled?: boolean }[] = [
    { id: "docs", label: "Docs", icon: "☰" },
    { id: "add", label: "Add", icon: "+" },
    { id: "reader", label: "Reader", icon: "▶", disabled: !hasActiveDoc },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0c0b09] border-t border-[#2c2820] z-50">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              tab.disabled
                ? "opacity-30 cursor-not-allowed"
                : active === tab.id
                ? "text-[#d4a847]"
                : "text-[#6a6050]"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-mono">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
