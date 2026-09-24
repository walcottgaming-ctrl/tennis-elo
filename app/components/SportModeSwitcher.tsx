"use client";

import { useSportMode } from "@/app/context/SportModeContext";
import SportIcon from "@/app/components/SportIcon";

const modes = [
  { value: "tennis" as const, label: "Tennis" },
  { value: "padel" as const, label: "Padel" },
  {
    value: "super_tiebreak" as const,
    label: "Super Tie-Break",
  },
];

export default function SportModeSwitcher() {
  const { mode, setMode } = useSportMode();

  return (
    <div
      className="inline-flex items-center rounded-full border border-white/10 bg-[#11141c]/90 p-1 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
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
            title={item.label}
            className={`relative grid h-8 w-8 place-items-center rounded-full transition-all duration-200 active:scale-95 ${
              isActive
                ? "bg-accent text-[#0b0d13] shadow-[0_0_18px_var(--accent-glow)]"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <SportIcon
              sport={item.value}
              className="h-4 w-4"
            />

            {isActive && (
              <span
                className="absolute -bottom-0.5 h-0.5 w-2 rounded-full bg-[#0b0d13]/70"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}