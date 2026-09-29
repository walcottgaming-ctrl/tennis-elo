"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";
import { createClient } from "@/src/supabase/client";

type Sport =
  | "tennis"
  | "padel"
  | "super_tiebreak";

type Match = {
  id: string;
  sport: Sport;
  format: "singles" | "doubles";
  created_at: string;
};

type RankingPlayer = {
  id: string;
  points_tennis: number | null;
  points_padel: number | null;
  points_super_tiebreak: number | null;
};

type RankingHistory = {
  id: string;
  match_id: string;
  player_id: string;
  sport: Sport;
  old_points: number;
  new_points: number;
  points_change: number;
  created_at: string;
};

type DashboardContentProps = {
  displayName: string;
  tennisPoints: number;
  padelPoints: number;
  superTiebreakPoints: number;
};

function ArrowRightIcon({
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
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function PlusIcon({
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
      <path d="M5 12h14" />
    </svg>
  );
}

function TrendUpIcon({
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
      <path d="M3 17l6-6 4 4 8-9" />
      <path d="M15 6h6v6" />
    </svg>
  );
}

function ChartPlaceholder({
  points,
}: {
  points: RankingHistory[];
}) {
  const chartPoints = points.slice(-12);

  if (chartPoints.length < 2) {
    return (
      <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-white/6 bg-white/2.5">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-accent/5 blur-3xl" />

        <div className="relative text-center">
          <p className="text-sm font-medium">
            Pas encore assez de données
          </p>
          <p className="mt-1 text-xs text-muted">
            Joue quelques matchs pour voir ta progression.
          </p>
        </div>
      </div>
    );
  }

  const values = chartPoints.map(
    (point) => point.new_points
  );

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const width = 720;
  const height = 220;
  const paddingX = 12;
  const paddingY = 20;

  const coordinates = chartPoints.map(
    (point, index) => {
      const x =
        paddingX +
        (index /
          Math.max(chartPoints.length - 1, 1)) *
          (width - paddingX * 2);

      const normalized =
        (point.new_points - min) / range;

      const y =
        height -
        paddingY -
        normalized *
          (height - paddingY * 2);

      return {
        x,
        y,
        point,
      };
    }
  );

  const linePath = coordinates
    .map(
      ({ x, y }, index) =>
        `${index === 0 ? "M" : "L"} ${x} ${y}`
    )
    .join(" ");

  const areaPath = `${linePath} L ${
    width - paddingX
  } ${height} L ${paddingX} ${height} Z`;

  const latest =
    coordinates[coordinates.length - 1];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/2.5 p-3 sm:p-4">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-accent/8 blur-3xl" />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative h-44 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="dashboardChartFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--accent)"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="var(--accent)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <line
          x1={paddingX}
          y1={height / 2}
          x2={width - paddingX}
          y2={height / 2}
          stroke="currentColor"
          className="text-white/5"
          strokeDasharray="5 8"
        />

        <motion.path
          d={areaPath}
          fill="url(#dashboardChartFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.15,
            ease: "easeOut",
          }}
        />

        {coordinates.map(
          ({ x, y, point }, index) => {
            const isLatest =
              index === coordinates.length - 1;

            return (
              <motion.g
                key={point.id}
                initial={{
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: 0.7 + index * 0.04,
                  duration: 0.25,
                }}
                style={{
                  transformOrigin: `${x}px ${y}px`,
                }}
              >
                {isLatest && (
                  <circle
                    cx={x}
                    cy={y}
                    r="13"
                    fill="var(--accent)"
                    opacity="0.12"
                  />
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={isLatest ? 5.5 : 3}
                  fill="var(--accent)"
                />
              </motion.g>
            );
          }
        )}
      </svg>

      <div className="relative mt-1 flex items-center justify-between px-1 text-[11px] text-muted">
        <span>
          {new Date(
            chartPoints[0].created_at
          ).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </span>

        <span>
          {new Date(
            chartPoints[chartPoints.length - 1]
              .created_at
          ).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <div className="relative mt-3 flex items-end justify-between border-t border-white/6 pt-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Plus bas
          </p>
          <p className="mt-1 font-display text-lg font-semibold">
            {min.toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Actuel
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-accent">
            {latest.point.new_points.toLocaleString(
              "fr-FR"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardContent({
  displayName,
  tennisPoints,
  padelPoints,
  superTiebreakPoints,
}: DashboardContentProps) {
  const { mode } = useSportMode();

  const [matches, setMatches] = useState<Match[]>([]);
  const [rankingPlayers, setRankingPlayers] =
    useState<RankingPlayer[]>([]);
  const [rankingHistory, setRankingHistory] =
    useState<RankingHistory[]>([]);
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(
          "Utilisateur introuvable :",
          userError
        );
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      /*
       * Récupération des matchs réellement liés
       * à l'utilisateur connecté.
       */
      const {
        data: playerMatches,
        error: playerMatchesError,
      } = await supabase
        .from("match_players")
        .select("match_id")
        .eq("player_id", user.id);

      if (playerMatchesError) {
        console.error(
          "Erreur chargement matchs joueur :",
          playerMatchesError
        );
      } else {
        const matchIds = (
          playerMatches ?? []
        ).map((item) => item.match_id);

        if (matchIds.length > 0) {
          const {
            data: matchesData,
            error: matchesError,
          } = await supabase
            .from("matches")
            .select(
              "id, sport, format, created_at"
            )
            .in("id", matchIds)
            .order("created_at", {
              ascending: false,
            })
            .limit(20);

          if (matchesError) {
            console.error(
              "Erreur chargement matchs Dashboard :",
              matchesError
            );
          } else {
            setMatches(
              (matchesData ?? []) as Match[]
            );
          }
        }
      }

      /*
       * Historique des points du joueur.
       * Cette donnée servira notamment au graphique.
       */
      const {
        data: historyData,
        error: historyError,
      } = await supabase
        .from("ranking_history")
        .select(
          "id, match_id, player_id, sport, old_points, new_points, points_change, created_at"
        )
        .eq("player_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (historyError) {
        console.error(
          "Erreur historique classement :",
          historyError
        );
      } else {
        setRankingHistory(
          (historyData ?? []) as RankingHistory[]
        );
      }

      /*
       * Classement global.
       */
      const {
        data: rankingData,
        error: rankingError,
      } = await supabase
        .from("profiles")
        .select(
          "id, points_tennis, points_padel, points_super_tiebreak"
        );

      if (rankingError) {
        console.error(
          "Erreur chargement classement Dashboard :",
          rankingError
        );
      } else {
        setRankingPlayers(
          (rankingData ?? []) as RankingPlayer[]
        );
      }

      setLoading(false);
    }

    void loadDashboardData();
  }, []);

  const sportLabel =
    mode === "super_tiebreak"
      ? "Super Tie-Break"
      : mode === "tennis"
        ? "Tennis"
        : "Padel";

  const sportPoints =
    mode === "super_tiebreak"
      ? superTiebreakPoints
      : mode === "tennis"
        ? tennisPoints
        : padelPoints;

  const newMatchHref =
    mode === "super_tiebreak"
      ? "/supertiebreak/new"
      : "/matches/new";

  const rankedPlayers = useMemo(() => {
    return [...rankingPlayers].sort(
      (a, b) => {
        const pointsA =
          mode === "tennis"
            ? a.points_tennis ?? 0
            : mode === "padel"
              ? a.points_padel ?? 0
              : a.points_super_tiebreak ?? 0;

        const pointsB =
          mode === "tennis"
            ? b.points_tennis ?? 0
            : mode === "padel"
              ? b.points_padel ?? 0
              : b.points_super_tiebreak ?? 0;

        return pointsB - pointsA;
      }
    );
  }, [rankingPlayers, mode]);

  const currentRankIndex =
    currentUserId
      ? rankedPlayers.findIndex(
          (player) =>
            player.id === currentUserId
        )
      : -1;

  const currentRank =
    currentRankIndex >= 0
      ? currentRankIndex + 1
      : null;

  const totalRankedPlayers =
    rankedPlayers.length;

  const filteredMatches = matches
    .filter((match) => match.sport === mode)
    .slice(0, 5);

  const progressionPoints = rankingHistory.filter(
    (point) => point.sport === mode
  );

  const latestChange =
    progressionPoints.length > 0
      ? progressionPoints[
          progressionPoints.length - 1
        ].points_change
      : 0;

  const [now] = useState(() => Date.now());

  const weeklyHistory = progressionPoints.filter(
    (point) =>
      new Date(point.created_at).getTime() >=
      now - 7 * 24 * 60 * 60 * 1000
  );

  const weeklyPoints = weeklyHistory.reduce(
    (total, point) =>
      total + point.points_change,
    0
  );

  const weeklyMatches = new Set(
    weeklyHistory.map(
      (point) => point.match_id
    )
  ).size;

  const progressToNextRank =
    currentRank && currentRank > 1
      ? rankedPlayers[currentRank - 2]
      : null;

  const nextRankPoints = progressToNextRank
    ? mode === "tennis"
      ? progressToNextRank.points_tennis ?? 0
      : mode === "padel"
        ? progressToNextRank.points_padel ?? 0
        : progressToNextRank.points_super_tiebreak ??
          0
    : null;

  const pointsToNextRank =
    nextRankPoints !== null
      ? Math.max(nextRankPoints - sportPoints, 0)
      : 0;

  const sportPointsList = [
    {
      label: "Tennis",
      value: tennisPoints,
      sport: "tennis" as const,
    },
    {
      label: "Padel",
      value: padelPoints,
      sport: "padel" as const,
    },
    {
      label: "Super Tie-Break",
      value: superTiebreakPoints,
      sport: "super_tiebreak" as const,
    },
  ];

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.065,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 14,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.42,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
        backgroundAttachment: "fixed",
      }}
    >
      <motion.div
        className="mx-auto max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* HEADER */}
        <motion.header
          variants={itemVariants}
          className="mb-7"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow">
                Tableau de bord
              </p>

              <h1 className="mt-2 truncate font-display text-[30px] font-semibold tracking-[-0.035em] sm:text-4xl">
                Bonjour, {displayName}
              </h1>

              <AnimatePresence mode="wait">
                <motion.p
                  key={mode}
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="mt-2 text-sm text-muted"
                >
                  Ton espace{" "}
                  {sportLabel.toLowerCase()}.
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="shrink-0">
              <SportModeSwitcher />
            </div>
          </div>
        </motion.header>

        {/* HERO */}
        <motion.section
          variants={itemVariants}
          className="glass-strong relative overflow-hidden rounded-[30px]"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    key={mode}
                    initial={{
                      scale: 0.8,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent"
                  >
                    <SportIcon
                      sport={mode}
                      className="h-4 w-4"
                    />
                  </motion.div>

                  <p className="eyebrow">
                    Classement actuel
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <motion.span
                    key={`${mode}-${sportPoints}`}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.35,
                    }}
                    className="font-display text-5xl font-semibold tracking-tighter text-accent sm:text-6xl"
                  >
                    {sportPoints.toLocaleString(
                      "fr-FR"
                    )}
                  </motion.span>

                  <span className="mb-2.5 text-sm text-muted">
                    points
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                    #{currentRank ?? "—"}
                  </span>

                  <span className="text-sm text-muted">
                    sur {totalRankedPlayers || "—"}{" "}
                    joueurs
                  </span>

                  <span className="h-1 w-1 rounded-full bg-muted-2" />

                  <span className="text-sm text-muted">
                    {sportLabel}
                  </span>
                </div>

                <div className="mt-5 max-w-md">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {pointsToNextRank > 0
                        ? `${pointsToNextRank} pts avant le #${
                            currentRank
                              ? currentRank - 1
                              : "—"
                          }`
                        : currentRank === 1
                          ? "Tu es actuellement #1"
                          : "Progression en cours"}
                    </span>

                    <span className="font-medium text-accent">
                      {latestChange > 0
                        ? `+${latestChange} récent`
                        : latestChange < 0
                          ? `${latestChange} récent`
                          : "Stable"}
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                    <motion.div
                      key={`${mode}-${sportPoints}-${currentRank}`}
                      className="h-full rounded-full bg-accent"
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width:
                          nextRankPoints &&
                          nextRankPoints > sportPoints
                            ? `${Math.max(
                                8,
                                Math.min(
                                  100,
                                  ((sportPoints -
                                    1000) /
                                    Math.max(
                                      nextRankPoints -
                                        1000,
                                      1
                                    )) *
                                    100
                                )
                              )}%`
                            : "100%",
                      }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </div>
              </div>

              <Link
                href={newMatchHref}
                className="group inline-flex min-h-12 items-center justify-between gap-4 rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_12px_34px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_16px_40px_var(--accent-glow)] active:scale-[0.985] lg:min-w-47.5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10">
                    <PlusIcon className="h-4 w-4" />
                  </span>

                  Nouveau match
                </span>

                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.section>

        {/* PERFORMANCE */}
        <motion.section
          variants={itemVariants}
          className="mt-8"
        >
          <div className="mb-4">
            <p className="eyebrow">
              Performance
            </p>

            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              Ta progression
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.55fr_0.85fr]">
            <div className="glass rounded-[26px] p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    Évolution des points
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Tes derniers résultats en{" "}
                    {sportLabel.toLowerCase()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-xl font-semibold text-accent">
                    {weeklyPoints >= 0
                      ? `+${weeklyPoints}`
                      : weeklyPoints}
                  </p>
                  <p className="text-[11px] text-muted">
                    cette semaine
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                >
                  <ChartPlaceholder
                    points={progressionPoints}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <motion.div
                whileHover={{
                  y: -2,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="glass rounded-[26px] p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                  <TrendUpIcon className="h-4 w-4" />
                </div>

                <p className="mt-5 text-xs uppercase tracking-[0.14em] text-muted">
                  Cette semaine
                </p>

                <p className="mt-1 font-display text-3xl font-semibold">
                  {weeklyPoints >= 0
                    ? `+${weeklyPoints}`
                    : weeklyPoints}
                </p>

                <p className="mt-1 text-xs text-muted">
                  {weeklyMatches}{" "}
                  {weeklyMatches > 1
                    ? "matchs"
                    : "match"}
                </p>
              </motion.div>

              <motion.div
                whileHover={{
                  y: -2,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="glass rounded-[26px] p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-muted">
                  <SportIcon
                    sport={mode}
                    className="h-4 w-4"
                  />
                </div>

                <p className="mt-5 text-xs uppercase tracking-[0.14em] text-muted">
                  Matchs récents
                </p>

                <p className="mt-1 font-display text-3xl font-semibold">
                  {filteredMatches.length}
                </p>

                <p className="mt-1 text-xs text-muted">
                  dans ce mode
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* RECENT MATCHES */}
        <motion.section
          variants={itemVariants}
          className="mt-8"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">
                Historique
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Derniers matchs
              </h2>
            </div>

            <Link
              href="/matches"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              <span>Voir tout</span>

              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-3xl border border-white/5 bg-white/2.5"
                />
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="glass rounded-[26px] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-accent">
                <SportIcon
                  sport={mode}
                  className="h-5 w-5"
                />
              </div>

              <p className="mt-4 font-semibold">
                Aucun match récent
              </p>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
                Enregistre ton premier match en{" "}
                {sportLabel.toLowerCase()} pour
                commencer ton historique.
              </p>

              <Link
                href={newMatchHref}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-[#0b0d13] transition-transform duration-200 hover:brightness-105 active:scale-[0.985]"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau match
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMatches.map(
                (match, index) => {
                  const matchSportLabel =
                    match.sport ===
                    "super_tiebreak"
                      ? "Super Tie-Break"
                      : match.sport === "tennis"
                        ? "Tennis"
                        : "Padel";

                  return (
                    <motion.div
                      key={match.id}
                      initial={{
                        opacity: 0,
                        x: -10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay: index * 0.055,
                        duration: 0.3,
                      }}
                      whileHover={{
                        x: 3,
                      }}
                      className="glass group rounded-3xl p-3.5 transition-colors duration-200 hover:border-white/12 hover:bg-white/5 sm:p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-accent transition-colors duration-200 group-hover:border-accent/20 group-hover:bg-accent/10">
                            <SportIcon
                              sport={match.sport}
                              className="h-5 w-5"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {matchSportLabel}
                            </p>

                            <p className="mt-0.5 text-sm text-muted">
                              {match.format ===
                              "singles"
                                ? "Simple"
                                : "Double"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <p className="text-xs font-medium text-muted">
                            {new Date(
                              match.created_at
                            ).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>

                          <ArrowRightIcon className="h-3.5 w-3.5 text-muted-2 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              )}
            </div>
          )}
        </motion.section>

        {/* ALL SPORTS */}
        <motion.section
          variants={itemVariants}
          className="mt-8"
        >
          <div className="mb-3">
            <p className="eyebrow">
              Tes classements
            </p>

            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              Tous tes sports
            </h2>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {sportPointsList.map(
  (item) => {
                const isActive =
                  item.sport === mode;

                return (
                  <motion.div
                    key={item.sport}
                    whileHover={{
                      y: -3,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className={`relative overflow-hidden rounded-[22px] border p-4 transition-all duration-300 ${
                      isActive
                        ? "border-accent/20 bg-accent/5 shadow-[0_12px_35px_color-mix(in_srgb,var(--accent)_6%,transparent)]"
                        : "border-white/6 bg-white/2.5"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSportGlow"
                        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/10 blur-2xl"
                      />
                    )}

                    <div className="relative flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            isActive
                              ? "bg-accent/10 text-accent"
                              : "bg-white/5 text-muted"
                          }`}
                        >
                          <SportIcon
                            sport={item.sport}
                            className="h-4 w-4"
                          />
                        </div>

                        <span className="truncate text-sm font-medium">
                          {item.label}
                        </span>
                      </div>

                      <motion.span
                        key={`${item.sport}-${item.value}`}
                        initial={{
                          opacity: 0.4,
                          y: 4,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className={`font-display text-lg font-semibold ${
                          isActive
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        {item.value.toLocaleString(
                          "fr-FR"
                        )}
                      </motion.span>
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}