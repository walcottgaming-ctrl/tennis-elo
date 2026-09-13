"use client";

type EloPoint = {
  label: string;
  elo: number;
};

type EloChartProps = {
  points: EloPoint[];
};

export default function EloChart({
  points,
}: EloChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-black">
          📈 Évolution de l&apos;ELO
        </h2>

        <p className="mt-3 text-gray-500">
          Pas encore assez de matchs pour afficher
          l&apos;évolution.
        </p>
      </div>
    );
  }

  const values = points.map((point) => point.elo);

  const minElo = Math.min(...values);
  const maxElo = Math.max(...values);

  const range = Math.max(maxElo - minElo, 1);

  const width = 320;
  const height = 180;
  const padding = 20;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const getX = (index: number) => {
    if (points.length === 1) {
      return width / 2;
    }

    return (
      padding +
      (index / (points.length - 1)) * chartWidth
    );
  };

  const getY = (elo: number) => {
    return (
      padding +
      ((maxElo - elo) / range) * chartHeight
    );
  };

  const linePoints = points
    .map((point, index) => {
      return `${getX(index)},${getY(point.elo)}`;
    })
    .join(" ");

  return (
    <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black">
            📈 Évolution de l&apos;ELO
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Ton évolution au fil des matchs
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">
            Actuel
          </p>

          <p className="text-2xl font-bold text-black">
            {points[points.length - 1].elo}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl bg-gray-50 p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Évolution de l'ELO"
        >
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-300"
          />

          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-300"
          />

          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-black"
          />

          {points.map((point, index) => (
            <circle
              key={`${point.label}-${index}`}
              cx={getX(index)}
              cy={getY(point.elo)}
              r="4"
              fill="currentColor"
              className="text-black"
            />
          ))}
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          {points[0].label}
        </span>

        <span>
          {points[points.length - 1].label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Plus bas
          </p>

          <p className="mt-1 text-lg font-bold text-black">
            {minElo}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Plus haut
          </p>

          <p className="mt-1 text-lg font-bold text-black">
            {maxElo}
          </p>
        </div>
      </div>
    </section>
  );
}