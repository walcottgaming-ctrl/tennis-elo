"use client";

import { useSportMode } from "@/app/context/SportModeContext";
import SportIcon from "@/app/components/SportIcon";

const modes = [
  {
    value: "tennis" as const,
    label: "Tennis",
  },
  {
    value: "padel" as const,
    label: "Padel",
  },
  {
    value: "super_tiebreak" as const,
    label: "Super Tie-Break",
  },
];

export default function SportModeSwitcher() {
  const { mode, setMode } = useSportMode();

  return (
    <div
      className="mt-4 flex items-center gap-1.5"
      aria-label="Mode de jeu"
    >
      {modes.map((item) => {
        const isActive = mode === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setMode(item.value)}
            aria-label={item.label}
            aria-pressed={isActive}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
              isActive
                ? "bg-accent/15 text-accent ring-1 ring-accent/40"
                : "text-muted opacity-50 hover:bg-surface-2 hover:text-foreground hover:opacity-100"
            }`}
          >
            <SportIcon sport={item.value} className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}