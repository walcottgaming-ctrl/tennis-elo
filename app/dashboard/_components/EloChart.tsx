"use client";

import { motion } from "motion/react";

type EloPoint = {
  label: string;
  elo: number;
};

type EloChartProps = {
  points: EloPoint[];
  modeLabel?: string;
  weeklyChange?: number;
};

export default function EloChart({
  points,
  modeLabel = "Performance",
  weeklyChange = 0,
}: EloChartProps) {
  if (!points || points.length === 0) {
    return (
      <section className="glass relative overflow-hidden rounded-[28px] p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">PERFORMANCE</p>

              <h2 className="font-display text-2xl font-bold text-white">
                Progression
              </h2>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="text-xs font-medium text-muted">
                {modeLabel}
              </span>
            </div>
          </div>

          <div className="flex min-h-55 items-center justify-center rounded-2xl border border-white/5 bg-white/2">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 19L10 13L14 17L21 9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-white">
                Pas encore assez de données
              </p>

              <p className="mt-1 text-xs text-muted">
                Joue quelques matchs pour voir ta progression.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const width = 900;
  const height = 300;

  const paddingLeft = 24;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 36;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = points.map((point) => point.elo);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const valueRange = Math.max(maxValue - minValue, 1);

  const firstValue = values[0];
  const currentValue = values[values.length - 1];

  const totalChange = currentValue - firstValue;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("fr-FR").format(Math.round(value));

  const formatChange = (value: number) => {
    if (value > 0) {
      return `+${formatNumber(value)}`;
    }

    if (value < 0) {
      return formatNumber(value);
    }

    return "0";
  };

  const getX = (index: number) => {
    if (points.length === 1) {
      return paddingLeft + chartWidth / 2;
    }

    return (
      paddingLeft + (index / (points.length - 1)) * chartWidth
    );
  };

  const getY = (value: number) => {
    const normalized = (value - minValue) / valueRange;

    return (
      paddingTop +
      chartHeight -
      normalized * chartHeight
    );
  };

  const linePoints = points
    .map((point, index) => `${getX(index)},${getY(point.elo)}`)
    .join(" ");

  const areaPoints = [
    `${getX(0)},${paddingTop + chartHeight}`,
    ...points.map(
      (point, index) => `${getX(index)},${getY(point.elo)}`
    ),
    `${getX(points.length - 1)},${paddingTop + chartHeight}`,
  ].join(" ");

  const firstPoint = {
    x: getX(0),
    y: getY(firstValue),
  };

  const currentPoint = {
    x: getX(points.length - 1),
    y: getY(currentValue),
  };

  const middleValue = (minValue + maxValue) / 2;
  const middleY = getY(middleValue);

  const changeIsPositive = totalChange > 0;
  const changeIsNegative = totalChange < 0;

  const weeklyIsPositive = weeklyChange > 0;
  const weeklyIsNegative = weeklyChange < 0;

  return (
    <section className="glass relative overflow-hidden rounded-[28px] p-6">
      {/* Ambient light */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow mb-2">PERFORMANCE</p>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-white">
                Progression
              </h2>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="text-xs font-medium text-muted">
                  {modeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Current points */}
          <motion.div
            key={currentValue}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-left sm:text-right"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Points actuels
            </p>

            <p className="mt-1 font-display text-3xl font-bold tracking-tight text-white">
              {formatNumber(currentValue)}
            </p>
          </motion.div>
        </div>

        {/* Main stats */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Starting points */}
          <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Départ
            </p>

            <p className="mt-2 font-display text-xl font-bold text-white">
              {formatNumber(firstValue)}
            </p>
          </div>

          {/* Total evolution */}
          <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Évolution
            </p>

            <p
              className={`mt-2 font-display text-xl font-bold ${
                changeIsPositive
                  ? "text-success"
                  : changeIsNegative
                    ? "text-danger"
                    : "text-white"
              }`}
            >
              {formatChange(totalChange)}
            </p>
          </div>

          {/* Weekly evolution */}
          <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Cette semaine
            </p>

            <p
              className={`mt-2 font-display text-xl font-bold ${
                weeklyIsPositive
                  ? "text-success"
                  : weeklyIsNegative
                    ? "text-danger"
                    : "text-white"
              }`}
            >
              {formatChange(weeklyChange)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <motion.div
          className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
        >
          <div className="overflow-x-auto">
            <div className="min-w-155">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-auto w-full"
                role="img"
                aria-label={`Progression des points en ${modeLabel}`}
              >
                <defs>
                  <linearGradient
                    id="progression-area-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.18"
                    />

                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="0"
                    />
                  </linearGradient>

                  <linearGradient
                    id="progression-line-gradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.45"
                    />

                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="1"
                    />
                  </linearGradient>
                </defs>

                {/* Horizontal guide */}
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={middleY}
                  y2={middleY}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 8"
                />

                {/* Bottom line */}
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={paddingTop + chartHeight}
                  y2={paddingTop + chartHeight}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                />

                {/* Area */}
                <motion.polygon
                  points={areaPoints}
                  fill="url(#progression-area-gradient)"
                  className="text-accent"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.15,
                  }}
                />

                {/* Main line */}
                <motion.polyline
                  points={linePoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                  pathLength={1}
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 1.2,
                    ease: "easeOut",
                  }}
                />

                {/* Data points */}
                {points.map((point, index) => {
                  const x = getX(index);
                  const y = getY(point.elo);
                  const isCurrent = index === points.length - 1;

                  return (
                    <motion.g
                      key={`${point.label}-${index}`}
                      initial={{
                        opacity: 0,
                        scale: 0,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.25,
                        delay: 0.45 + index * 0.04,
                      }}
                      style={{
                        transformOrigin: `${x}px ${y}px`,
                      }}
                    >
                      {!isCurrent && (
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          className="fill-accent"
                        />
                      )}

                      {isCurrent && (
                        <>
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="14"
                            className="fill-accent"
                            initial={{
                              opacity: 0.08,
                              scale: 0.8,
                            }}
                            animate={{
                              opacity: [0.05, 0.16, 0.05],
                              scale: [0.8, 1.15, 0.8],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />

                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            className="fill-accent"
                          />

                          <circle
                            cx={x}
                            cy={y}
                            r="3"
                            className="fill-background"
                          />
                        </>
                      )}
                    </motion.g>
                  );
                })}

                {/* Start label */}
                <text
                  x={firstPoint.x}
                  y={height - 12}
                  textAnchor="start"
                  className="fill-current text-[11px] text-muted"
                >
                  Départ
                </text>

                {/* Current label */}
                <text
                  x={currentPoint.x}
                  y={height - 12}
                  textAnchor="end"
                  className="fill-current text-[11px] text-muted"
                >
                  Maintenant
                </text>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(255,255,255,0.35)]" />

            <span className="text-xs text-muted">
              {points.length}{" "}
              {points.length > 1 ? "matchs suivis" : "match suivi"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted">
            <span>
              Min.{" "}
              <strong className="font-semibold text-white">
                {formatNumber(minValue)}
              </strong>
            </span>

            <span>
              Max.{" "}
              <strong className="font-semibold text-white">
                {formatNumber(maxValue)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}