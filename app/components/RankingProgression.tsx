"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/supabase/client";

type Sport = "tennis" | "padel" | "super_tiebreak";
type Period = "1m" | "3m" | "all";

type RankingHistoryRow = {
  id: string;
  old_points: number;
  new_points: number;
  points_change: number;
  created_at: string;
};

type RankingProgressionProps = {
  userId: string;
  sport: Sport;
  currentPoints: number;
};

const periodLabels: Record<Period, string> = {
  "1m": "1 mois",
  "3m": "3 mois",
  all: "Depuis le début",
};

function getPeriodStart(period: Period): Date | null {
  if (period === "all") {
    return null;
  }

  const date = new Date();

  if (period === "1m") {
    date.setMonth(date.getMonth() - 1);
  }

  if (period === "3m") {
    date.setMonth(date.getMonth() - 3);
  }

  return date;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateString));
}

function formatPoints(points: number) {
  return new Intl.NumberFormat("fr-FR").format(points);
}

export default function RankingProgression({
  userId,
  sport,
  currentPoints,
}: RankingProgressionProps) {
  const [period, setPeriod] = useState<Period>("3m");
  const [history, setHistory] = useState<RankingHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setSelectedPointId(null);

      const supabase = createClient();
      const periodStart = getPeriodStart(period);

      let query = supabase
        .from("ranking_history")
        .select(
          "id, old_points, new_points, points_change, created_at"
        )
        .eq("player_id", userId)
        .eq("sport", sport)
        .order("created_at", { ascending: true });

      if (periodStart) {
        query = query.gte("created_at", periodStart.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "Erreur lors du chargement de l'historique :",
          error
        );
        setHistory([]);
        setLoading(false);
        return;
      }

      setHistory((data ?? []) as RankingHistoryRow[]);
      setLoading(false);
    }

    loadHistory();
  }, [userId, sport, period]);

  const progression = useMemo(() => {
    if (history.length === 0) {
      return 0;
    }

    return currentPoints - history[0].old_points;
  }, [history, currentPoints]);

  const selectedPoint = useMemo(() => {
    if (!selectedPointId) {
      return history[history.length - 1] ?? null;
    }

    return (
      history.find((point) => point.id === selectedPointId) ??
      history[history.length - 1] ??
      null
    );
  }, [history, selectedPointId]);

  const chartPoints = useMemo(() => {
    if (history.length === 0) {
      return [];
    }

    const width = 720;
    const height = 260;
    const paddingX = 12;
    const paddingY = 24;

    const values = history.map((point) => point.new_points);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const range = Math.max(maxValue - minValue, 40);

    const chartMin = minValue - range * 0.15;
    const chartMax = maxValue + range * 0.15;

    const xStep =
      history.length === 1
        ? 0
        : (width - paddingX * 2) / (history.length - 1);

    return history.map((point, index) => {
      const x =
        history.length === 1
          ? width / 2
          : paddingX + index * xStep;

      const normalized =
        (point.new_points - chartMin) /
        (chartMax - chartMin);

      const y =
        height -
        paddingY -
        normalized * (height - paddingY * 2);

      return {
        ...point,
        x,
        y,
      };
    });
  }, [history]);

  const linePath = useMemo(() => {
    if (chartPoints.length === 0) {
      return "";
    }

    return chartPoints
      .map((point, index) => {
        return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
      })
      .join(" ");
  }, [chartPoints]);

  const areaPath = useMemo(() => {
    if (chartPoints.length < 2) {
      return "";
    }

    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];

    return `${linePath} L ${last.x} 260 L ${first.x} 260 Z`;
  }, [chartPoints, linePath]);

  return (
    <section className="mt-5 rounded-3xl border border-border bg-surface p-5">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Progression
        </p>

        <h2 className="mt-1 text-xl font-bold tracking-tight">
          Évolution du classement
        </h2>

        <p className="mt-2 text-sm leading-5 text-muted">
          Suis l&apos;évolution de tes points dans le temps.
        </p>
      </div>

      {/* Period */}
      <div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(periodLabels) as Period[]).map(
            (periodOption) => {
              const active = period === periodOption;

              return (
                <button
                  key={periodOption}
                  type="button"
                  onClick={() => setPeriod(periodOption)}
                  className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition-all duration-200 ${
                    active
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-surface-2 text-muted hover:text-foreground"
                  }`}
                >
                  {periodLabels[periodOption]}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Points actuels
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight">
            {formatPoints(currentPoints)}
          </p>
        </div>

        <div className="rounded-2xl bg-surface-2 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Évolution
          </p>

          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${
              progression > 0
                ? "text-accent"
                : progression < 0
                  ? "text-danger"
                  : "text-foreground"
            }`}
          >
            {progression > 0 ? "+" : ""}
            {formatPoints(progression)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface-2 p-3">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm font-medium text-muted">
              Chargement de la progression...
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl text-accent">
              ↗
            </div>

            <p className="mt-4 text-sm font-bold">
              Pas encore assez de données
            </p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
              Joue un match pour commencer à suivre
              ton évolution sur cette période.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <svg
                viewBox="0 0 720 260"
                className="h-64 min-w-140 w-full"
                role="img"
                aria-label="Évolution des points"
              >
                <line
                  x1="12"
                  y1="236"
                  x2="708"
                  y2="236"
                  stroke="currentColor"
                  strokeOpacity="0.08"
                />

                <line
                  x1="12"
                  y1="130"
                  x2="708"
                  y2="130"
                  stroke="currentColor"
                  strokeOpacity="0.06"
                  strokeDasharray="4 6"
                />

                <line
                  x1="12"
                  y1="24"
                  x2="708"
                  y2="24"
                  stroke="currentColor"
                  strokeOpacity="0.06"
                  strokeDasharray="4 6"
                />

                {areaPath && (
                  <path
                    d={areaPath}
                    fill="currentColor"
                    fillOpacity="0.04"
                  />
                )}

                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                />

                {chartPoints.map((point) => {
                  const active =
                    selectedPoint?.id === point.id;

                  return (
                    <g key={point.id}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={active ? 7 : 5}
                        className={
                          active
                            ? "fill-accent"
                            : "fill-background stroke-accent"
                        }
                        strokeWidth={active ? 0 : 3}
                        onClick={() =>
                          setSelectedPointId(point.id)
                        }
                        style={{ cursor: "pointer" }}
                      />

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="14"
                        fill="transparent"
                        onClick={() =>
                          setSelectedPointId(point.id)
                        }
                        style={{ cursor: "pointer" }}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected point */}
            {selectedPoint && (
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    {formatDate(selectedPoint.created_at)}
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {formatPoints(selectedPoint.new_points)} pts
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    Match
                  </p>

                  <p
                    className={`mt-1 text-sm font-bold ${
                      selectedPoint.points_change > 0
                        ? "text-accent"
                        : selectedPoint.points_change < 0
                          ? "text-danger"
                          : "text-muted"
                    }`}
                  >
                    {selectedPoint.points_change > 0
                      ? "+"
                      : ""}
                    {formatPoints(
                      selectedPoint.points_change
                    )}{" "}
                    pts
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-muted">
        Les points affichés correspondent à ton historique
        de classement pour le sport sélectionné.
      </p>
    </section>
  );
}