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

function ChartIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 2 5-6" />
    </svg>
  );
}

function ArrowUpIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
    </svg>
  );
}

export default function RankingProgression({
  userId,
  sport,
  currentPoints,
}: RankingProgressionProps) {
  const [period, setPeriod] = useState<Period>("3m");
  const [history, setHistory] = useState<RankingHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPointId, setSelectedPointId] =
    useState<string | null>(null);

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
        query = query.gte(
          "created_at",
          periodStart.toISOString()
        );
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

      setHistory(
        (data ?? []) as RankingHistoryRow[]
      );
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
      history.find(
        (point) => point.id === selectedPointId
      ) ??
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

    const values = history.map(
      (point) => point.new_points
    );

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const range = Math.max(
      maxValue - minValue,
      40
    );

    const chartMin =
      minValue - range * 0.15;

    const chartMax =
      maxValue + range * 0.15;

    const xStep =
      history.length === 1
        ? 0
        : (width - paddingX * 2) /
          (history.length - 1);

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
        normalized *
          (height - paddingY * 2);

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
        return `${
          index === 0 ? "M" : "L"
        } ${point.x} ${point.y}`;
      })
      .join(" ");
  }, [chartPoints]);

  const areaPath = useMemo(() => {
    if (chartPoints.length < 2) {
      return "";
    }

    const first = chartPoints[0];
    const last =
      chartPoints[chartPoints.length - 1];

    return `${linePath} L ${last.x} 260 L ${first.x} 260 Z`;
  }, [chartPoints, linePath]);

  const progressionPositive = progression > 0;
  const progressionNegative = progression < 0;

  return (
    <section className="glass-strong mt-5 overflow-hidden rounded-[28px] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Progression</p>

          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Évolution du classement
          </h2>

          <p className="mt-2 max-w-md text-sm leading-5 text-muted">
            Suis l&apos;évolution de tes points dans le
            temps.
          </p>
        </div>

        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent/15 bg-accent/10 text-accent shadow-[0_0_22px_var(--accent-glow)]">
          <ChartIcon className="h-5 w-5" />
        </div>
      </div>

      {/* Period selector */}
      <div className="mt-5 rounded-2xl border border-white/6 bg-[#0f1219]/70 p-1.5">
        <div className="grid grid-cols-3 gap-1">
          {(Object.keys(periodLabels) as Period[]).map(
            (periodOption) => {
              const active =
                period === periodOption;

              return (
                <button
                  key={periodOption}
                  type="button"
                  onClick={() =>
                    setPeriod(periodOption)
                  }
                  className={`min-h-10 rounded-xl px-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                    active
                      ? "bg-accent text-[#0b0d13] shadow-[0_6px_20px_var(--accent-glow)]"
                      : "text-muted hover:bg-white/5 hover:text-foreground"
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
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/6 bg-white/2.5 p-4">
          <p className="eyebrow">Points actuels</p>

          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatPoints(currentPoints)}
            </p>

            <span className="pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              pts
            </span>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            progressionPositive
              ? "border-accent/15 bg-accent/4.5"
              : progressionNegative
                ? "border-danger/15 bg-danger/4.5"
                : "border-white/6 bg-white/2.5"
          }`}
        >
          <p className="eyebrow">Évolution</p>

          <div className="mt-2 flex items-center gap-2">
            {progressionPositive && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <ArrowUpIcon className="h-3.5 w-3.5" />
              </span>
            )}

            {progressionNegative && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
                <ArrowDownIcon className="h-3.5 w-3.5" />
              </span>
            )}

            <p
              className={`font-display text-2xl font-semibold tracking-tight sm:text-3xl ${
                progressionPositive
                  ? "text-accent"
                  : progressionNegative
                    ? "text-danger"
                    : "text-foreground"
              }`}
            >
              {progression > 0 ? "+" : ""}
              {formatPoints(progression)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-white/6 bg-[#0f1219]/75">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center px-5">
            <div className="w-full max-w-xs text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-accent/10 bg-accent/5">
                <div className="h-5 w-5 animate-pulse rounded-full bg-accent/20" />
              </div>

              <p className="mt-3 text-sm font-medium text-muted">
                Chargement de la progression...
              </p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
              <ChartIcon className="h-5 w-5" />
            </div>

            <p className="mt-4 font-semibold">
              Pas encore assez de données
            </p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
              Joue un match pour commencer à suivre
              ton évolution sur cette période.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-white/5 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Historique</p>

                  <p className="mt-1 text-xs text-muted">
                    {history.length}{" "}
                    {history.length > 1
                      ? "évolutions"
                      : "évolution"}
                  </p>
                </div>

                {selectedPoint && (
                  <div className="text-right">
                    <p className="font-display text-sm font-semibold">
                      {formatPoints(
                        selectedPoint.new_points
                      )}{" "}
                      pts
                    </p>

                    <p
                      className={`mt-0.5 text-[11px] font-semibold ${
                        selectedPoint.points_change > 0
                          ? "text-accent"
                          : selectedPoint.points_change <
                              0
                            ? "text-danger"
                            : "text-muted"
                      }`}
                    >
                      {selectedPoint.points_change > 0
                        ? "+"
                        : ""}
                      {formatPoints(
                        selectedPoint.points_change
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

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
                  strokeOpacity="0.05"
                  strokeDasharray="4 6"
                />

                <line
                  x1="12"
                  y1="24"
                  x2="708"
                  y2="24"
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  strokeDasharray="4 6"
                />

                {areaPath && (
                  <path
                    d={areaPath}
                    fill="currentColor"
                    fillOpacity="0.035"
                    className="text-accent"
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
                      {active && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="12"
                          className="fill-accent"
                          fillOpacity="0.12"
                        />
                      )}

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={active ? 6.5 : 4.5}
                        className={
                          active
                            ? "fill-accent"
                            : "fill-[#171922] stroke-accent"
                        }
                        strokeWidth={
                          active ? 0 : 2.5
                        }
                        onClick={() =>
                          setSelectedPointId(
                            point.id
                          )
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      />

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="15"
                        fill="transparent"
                        onClick={() =>
                          setSelectedPointId(
                            point.id
                          )
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected point */}
            {selectedPoint && (
              <div className="border-t border-white/5 bg-white/2.5 px-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow">
                      {formatDate(
                        selectedPoint.created_at
                      )}
                    </p>

                    <p className="mt-1 font-display text-sm font-semibold">
                      {formatPoints(
                        selectedPoint.new_points
                      )}{" "}
                      pts
                    </p>

                    <p className="mt-0.5 text-[11px] text-muted">
                      après le match
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="eyebrow">
                      Variation
                    </p>

                    <p
                      className={`mt-1 font-display text-sm font-semibold ${
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

                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatPoints(
                        selectedPoint.old_points
                      )}{" "}
                      →{" "}
                      {formatPoints(
                        selectedPoint.new_points
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-white/2.5 px-4 py-3">
        <p className="text-xs leading-5 text-muted">
          Les points affichés correspondent à ton
          historique de classement pour le sport
          sélectionné.
        </p>
      </div>
    </section>
  );
}