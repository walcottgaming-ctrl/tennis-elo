"use client";

import { motion } from "motion/react";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";

const modes = [
  {
    id: "tennis" as const,
    label: "Tennis",
  },
  {
    id: "padel" as const,
    label: "Padel",
  },
  {
    id: "super_tiebreak" as const,
    label: "STB",
  },
];

export default function SportModeSwitcher() {
  const { mode, setMode } = useSportMode();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/4 p-1">
      {modes.map((item) => {
        const isActive = mode === item.id;

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className="relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
          >
            {isActive && (
              <motion.div
                layoutId="sport-switcher-active"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                }}
              />
            )}

            <motion.span
              className="relative z-10 flex items-center gap-1.5 sm:gap-2"
              animate={{
                scale: isActive ? 1 : 0.97,
                opacity: isActive ? 1 : 0.65,
                color: isActive ? "rgb(17, 17, 17)" : undefined,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
            >
              <SportIcon
                sport={item.id}
                className="h-3.5 w-3.5 sm:h-3.75 sm:w-3.75"
              />

              <span>{item.label}</span>
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}