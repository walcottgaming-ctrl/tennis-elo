"use client";

import { useSportMode } from "@/app/context/SportModeContext";
import SportIcon from "@/app/components/SportIcon";

type DashboardPointsProps = {
  tennisPoints: number;
  padelPoints: number;
  superTiebreakPoints: number;
};

export default function DashboardPoints({
  tennisPoints,
  padelPoints,
  superTiebreakPoints,
}: DashboardPointsProps) {
  const { mode } = useSportMode();

  const points =
    mode === "tennis"
      ? tennisPoints
      : mode === "padel"
        ? padelPoints
        : superTiebreakPoints;

  const sportLabel =
    mode === "tennis"
      ? "Tennis"
      : mode === "padel"
        ? "Padel"
        : "Super Tie-Break";

  return (
    <section className="relative mt-7 overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl">
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Ton niveau
            </p>

            <div className="mt-3 flex items-end gap-2">
              <p className="text-5xl font-bold tracking-tight">
                {points.toLocaleString("fr-FR")}
              </p>

              <span className="mb-2 text-sm font-semibold text-accent">
                pts
              </span>
            </div>

            <p className="mt-1 text-sm text-muted">
              {sportLabel}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <SportIcon
              sport={mode}
              className="h-6 w-6"
            />
          </div>
        </div>
      </div>
    </section>
  );
}