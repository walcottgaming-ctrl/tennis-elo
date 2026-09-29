"use client";

type EloPoint = {
  label: string;
  elo: number;
};

type EloChartProps = {
  points: EloPoint[];
};

function ChartIcon({
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
      <path d="M4 18V6" />
      <path d="M4 18h16" />
      <path d="m7 14 3-4 3 2 5-6" />
    </svg>
  );
}

export default function EloChart({
  points,
}: EloChartProps) {
  if (points.length === 0) {
    return (
      <section className="glass rounded-[26px] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
            <ChartIcon />
          </div>

          <div>
            <p className="eyebrow">
              Progression
            </p>

            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              Évolution de l&apos;ELO
            </h2>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/6 bg-white/2.5 px-4 py-5">
          <p className="text-sm leading-6 text-muted">
            Pas encore assez de matchs pour afficher
            l&apos;évolution.
          </p>
        </div>
      </section>
    );
  }

  const values = points.map(
    (point) => point.elo
  );

  const minElo = Math.min(...values);
  const maxElo = Math.max(...values);

  const range = Math.max(
    maxElo - minElo,
    1
  );

  const width = 320;
  const height = 180;
  const padding = 20;

  const chartWidth =
    width - padding * 2;

  const chartHeight =
    height - padding * 2;

  const getX = (index: number) => {
    if (points.length === 1) {
      return width / 2;
    }

    return (
      padding +
      (index / (points.length - 1)) *
        chartWidth
    );
  };

  const getY = (elo: number) => {
    return (
      padding +
      ((maxElo - elo) / range) *
        chartHeight
    );
  };

  const linePoints = points
    .map(
      (point, index) =>
        `${getX(index)},${getY(point.elo)}`
    )
    .join(" ");

  const currentElo =
    points[points.length - 1].elo;

  const firstElo = points[0].elo;

  const totalChange =
    currentElo - firstElo;

  return (
    <section className="glass-strong mt-4 overflow-hidden rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
              <ChartIcon />
            </div>

            <div className="min-w-0">
              <p className="eyebrow">
                Progression
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Évolution de l&apos;ELO
              </h2>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted">
            Ton évolution au fil des matchs
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="eyebrow">
            Actuel
          </p>

          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-accent">
            {currentElo.toLocaleString(
              "fr-FR"
            )}
          </p>

          {points.length > 1 && (
            <p
              className={`mt-0.5 text-xs font-semibold ${
                totalChange > 0
                  ? "text-success"
                  : totalChange < 0
                    ? "text-danger"
                    : "text-muted"
              }`}
            >
              {totalChange > 0
                ? `+${totalChange}`
                : totalChange}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[22px] border border-white/6 bg-[#0f1219]/70 p-3 sm:p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Évolution de l'ELO"
        >
          <defs>
            <linearGradient
              id="elo-line-gradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="var(--accent)"
                stopOpacity="0.45"
              />
              <stop
                offset="100%"
                stopColor="var(--accent)"
              />
            </linearGradient>

            <linearGradient
              id="elo-area-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--accent)"
                stopOpacity="0.14"
              />
              <stop
                offset="100%"
                stopColor="var(--accent)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth="1"
            className="text-white/8"
          />

          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth="1"
            className="text-white/8"
          />

          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 5"
            className="text-white/5"
          />

          {points.length > 1 && (
            <polygon
              points={`${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`}
              fill="url(#elo-area-gradient)"
            />
          )}

          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#elo-line-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map(
            (point, index) => {
              const x = getX(index);
              const y = getY(
                point.elo
              );

              const isCurrent =
                index ===
                points.length - 1;

              return (
                <g
                  key={`${point.label}-${index}`}
                >
                  {isCurrent && (
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="var(--accent)"
                      opacity="0.12"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={isCurrent ? 4.5 : 3}
                    fill="var(--accent)"
                  />
                </g>
              );
            }
          )}
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-xs font-medium text-muted">
        <span className="min-w-0 truncate">
          {points[0].label}
        </span>

        <span className="min-w-0 truncate text-right">
          {points[points.length - 1].label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-white/6 bg-white/2.5 p-4">
          <p className="eyebrow">
            Plus bas
          </p>

          <p className="mt-1 font-display text-xl font-semibold tracking-tight">
            {minElo.toLocaleString(
              "fr-FR"
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-accent/10 bg-accent/5 p-4">
          <p className="eyebrow">
            Plus haut
          </p>

          <p className="mt-1 font-display text-xl font-semibold tracking-tight text-accent">
            {maxElo.toLocaleString(
              "fr-FR"
            )}
          </p>
        </div>
      </div>
    </section>
  );
}