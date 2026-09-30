"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  AnimatePresence,
  motion,
  type Variants,
} from "motion/react";

import SportIcon from "@/app/components/SportIcon";
import SportModeSwitcher from "@/app/components/SportModeSwitcher";
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
  result_type: "competitive" | "friendly";
  created_at: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

type MatchPlayer = {
  match_id: string;
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | Profile[] | null;
};

type SetRow = {
  id: string;
  match_id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
  is_match_tiebreak: boolean;
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

type MatchResult =
  | "win"
  | "loss"
  | "draw"
  | "unknown";

type MatchScope = "mine" | "all";

const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
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
      strokeWidth="2"
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

function AlertIcon({
  className = "h-5 w-5",
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
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.5 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function getProfile(
  player: MatchPlayer
): Profile | null {
  if (!player.profiles) return null;

  if (Array.isArray(player.profiles)) {
    return player.profiles[0] ?? null;
  }

  return player.profiles;
}

function getPlayerName(player: MatchPlayer) {
  if (player.guest_name?.trim()) {
    return player.guest_name.trim();
  }

  const profile = getProfile(player);

  if (!profile) {
    return "Joueur";
  }

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (profile.username) {
    return `@${profile.username}`;
  }

  return "Joueur";
}

function getPlayerInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "J";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function getSportLabel(sport: Sport) {
  switch (sport) {
    case "tennis":
      return "Tennis";
    case "padel":
      return "Padel";
    case "super_tiebreak":
      return "Super Tie-Break";
  }
}

function getFormatLabel(
  format: Match["format"]
) {
  return format === "doubles"
    ? "Double"
    : "Simple";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getWinnerTeam(
  match: Match,
  sets: SetRow[]
): number | null {
  if (!sets.length) {
    return null;
  }

  const orderedSets = [...sets].sort(
    (a, b) => a.set_number - b.set_number
  );

  if (match.sport === "super_tiebreak") {
    const lastSet =
      orderedSets[orderedSets.length - 1];

    if (
      lastSet.team_1_score ===
      lastSet.team_2_score
    ) {
      return null;
    }

    return lastSet.team_1_score >
      lastSet.team_2_score
      ? 1
      : 2;
  }

  let team1Sets = 0;
  let team2Sets = 0;

  for (const set of orderedSets) {
    if (set.is_match_tiebreak) {
      continue;
    }

    if (
      set.team_1_score >
      set.team_2_score
    ) {
      team1Sets++;
    } else if (
      set.team_2_score >
      set.team_1_score
    ) {
      team2Sets++;
    }
  }

  if (team1Sets === team2Sets) {
    return null;
  }

  return team1Sets > team2Sets ? 1 : 2;
}

function getScoreLabel(
  match: Match,
  sets: SetRow[]
) {
  if (!sets.length) {
    return "—";
  }

  const orderedSets = [...sets].sort(
    (a, b) => a.set_number - b.set_number
  );

  if (match.sport === "super_tiebreak") {
    const set =
      orderedSets[orderedSets.length - 1];

    return `${set.team_1_score} - ${set.team_2_score}`;
  }

  return orderedSets
    .map(
      (set) =>
        `${set.team_1_score}-${set.team_2_score}`
    )
    .join("   ");
}

function getResult(
  currentUserId: string | null,
  matchPlayers: MatchPlayer[],
  winnerTeam: number | null
): MatchResult {
  if (!currentUserId || !winnerTeam) {
    return "unknown";
  }

  const currentUserPlayer =
    matchPlayers.find(
      (player) =>
        player.player_id === currentUserId
    );

  if (!currentUserPlayer) {
    return "unknown";
  }

  return currentUserPlayer.team === winnerTeam
    ? "win"
    : "loss";
}

function getResultLabel(
  result: MatchResult
) {
  switch (result) {
    case "win":
      return "Victoire";
    case "loss":
      return "Défaite";
    case "draw":
      return "Égalité";
    default:
      return "Match";
  }
}

function getResultClasses(
  result: MatchResult
) {
  switch (result) {
    case "win":
      return {
        text: "text-accent",
        bg: "bg-accent/10",
        border: "border-accent/20",
      };

    case "loss":
      return {
        text: "text-danger",
        bg: "bg-danger/8",
        border: "border-danger/20",
      };

    default:
      return {
        text: "text-muted",
        bg: "bg-white/5",
        border: "border-white/10",
      };
  }
}

function getTeamPlayers(
  players: MatchPlayer[],
  team: number
) {
  return players
    .filter((player) => player.team === team)
    .sort((a, b) => {
      const aName = getPlayerName(a);
      const bName = getPlayerName(b);

      return aName.localeCompare(bName);
    });
}

function getTeamLabel(
  players: MatchPlayer[],
  team: number
) {
  const teamPlayers = getTeamPlayers(
    players,
    team
  );

  if (!teamPlayers.length) {
    return "Joueur";
  }

  return teamPlayers
    .map((player) => getPlayerName(player))
    .join(" / ");
}

function MatchCard({
  match,
  players,
  sets,
  rankingHistory,
  currentUserId,
}: {
  match: Match;
  players: MatchPlayer[];
  sets: SetRow[];
  rankingHistory: RankingHistory[];
  currentUserId: string | null;
}) {
  const winnerTeam = getWinnerTeam(
    match,
    sets
  );

  const result = getResult(
    currentUserId,
    players,
    winnerTeam
  );

  const resultClasses =
    getResultClasses(result);

  const currentUserHistory =
    currentUserId
      ? rankingHistory.find(
          (item) =>
            item.match_id === match.id &&
            item.player_id === currentUserId
        )
      : null;

  const team1Players =
    getTeamPlayers(players, 1);

  const team2Players =
    getTeamPlayers(players, 2);

  const team1Label = getTeamLabel(
    players,
    1
  );

  const team2Label = getTeamLabel(
    players,
    2
  );

  const scoreLabel = getScoreLabel(
    match,
    sets
  );

  const matchHref =
    match.sport === "super_tiebreak"
      ? `/supertiebreak/${match.id}`
      : `/matches/${match.id}`;

  const isUserInMatch =
    !!currentUserId &&
    players.some(
      (player) =>
        player.player_id === currentUserId
    );

  const isTeam1Winner =
    winnerTeam === 1;

  const isTeam2Winner =
    winnerTeam === 2;

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      <Link
        href={matchHref}
        className="group relative block overflow-hidden rounded-[25px] border border-white/8 bg-white/3.5 p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.995]"
      >
        {/* subtle top line */}
        <div
          className={`pointer-events-none absolute inset-x-6 top-0 h-px ${
            result === "win"
              ? "bg-accent/30"
              : "bg-white/8"
          }`}
          aria-hidden="true"
        />

        <div className="relative">
          {/* TOP META */}

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/8 text-accent">
                <SportIcon
                  sport={match.sport}
                  className="h-4 w-4"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[11px] font-bold">
                    {getSportLabel(match.sport)}
                  </span>

                  <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-white/20" />

                  <span className="truncate text-[10px] text-muted">
                    {getFormatLabel(
                      match.format
                    )}
                  </span>
                </div>

                <p className="mt-0.5 text-[9px] text-muted-2">
                  {formatDate(match.created_at)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {match.result_type ===
                "competitive" && (
                <span className="rounded-full border border-accent/15 bg-accent/6 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-accent">
                  Compétitif
                </span>
              )}

              <div className="grid h-8 w-8 place-items-center rounded-full border border-white/6 text-muted transition-all group-hover:border-white/10 group-hover:text-foreground">
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>

          {/* PLAYERS + SCORE */}

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0 space-y-3">
              {/* TEAM 1 */}

              <div
                className={`flex min-w-0 items-center gap-2.5 ${
                  isTeam1Winner
                    ? "text-foreground"
                    : ""
                }`}
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[9px] font-bold ${
                    isTeam1Winner
                      ? "border-accent/20 bg-accent/10 text-accent"
                      : "border-white/7 bg-white/5 text-muted"
                  }`}
                >
                  {team1Players.length === 1
                    ? getPlayerInitials(
                        getPlayerName(
                          team1Players[0]
                        )
                      )
                    : "1"}
                </div>

                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isTeam1Winner
                        ? "text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {team1Label}
                  </p>
                </div>
              </div>

              {/* TEAM 2 */}

              <div
                className={`flex min-w-0 items-center gap-2.5 ${
                  isTeam2Winner
                    ? "text-foreground"
                    : ""
                }`}
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[9px] font-bold ${
                    isTeam2Winner
                      ? "border-accent/20 bg-accent/10 text-accent"
                      : "border-white/7 bg-white/5 text-muted"
                  }`}
                >
                  {team2Players.length === 1
                    ? getPlayerInitials(
                        getPlayerName(
                          team2Players[0]
                        )
                      )
                    : "2"}
                </div>

                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isTeam2Winner
                        ? "text-foreground"
                        : "text-muted"
                    }`}
                  >
                    {team2Label}
                  </p>
                </div>
              </div>
            </div>

            {/* SCORE */}

            <div className="shrink-0 text-right">
              <p className="font-display text-xl font-bold tracking-[-0.04em] text-foreground sm:text-2xl">
                {scoreLabel}
              </p>

              {winnerTeam && (
                <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                  Équipe {winnerTeam}
                </p>
              )}
            </div>
          </div>

          {/* FOOTER */}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-3.5">
            <div className="flex min-w-0 items-center gap-2">
              {isUserInMatch && (
                <span
                  className={`rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${resultClasses.border} ${resultClasses.bg} ${resultClasses.text}`}
                >
                  {getResultLabel(result)}
                </span>
              )}

              {!isUserInMatch && winnerTeam && (
                <span className="text-[9px] font-medium text-muted">
                  Équipe {winnerTeam} gagnante
                </span>
              )}

              {!winnerTeam && (
                <span className="text-[9px] font-medium text-muted">
                  Résultat non déterminé
                </span>
              )}
            </div>

            {currentUserHistory &&
              isUserInMatch && (
                <span
                  className={`shrink-0 font-display text-sm font-bold ${
                    currentUserHistory.points_change >=
                    0
                      ? "text-accent"
                      : "text-danger"
                  }`}
                >
                  {currentUserHistory.points_change >=
                  0
                    ? "+"
                    : ""}
                  {currentUserHistory.points_change}
                  <span className="ml-1 text-[8px] font-semibold uppercase tracking-wider">
                    pts
                  </span>
                </span>
              )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function MatchesPage() {
  const { mode } = useSportMode();

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [matchPlayers, setMatchPlayers] =
    useState<MatchPlayer[]>([]);

  const [sets, setSets] =
    useState<SetRow[]>([]);

  const [rankingHistory, setRankingHistory] =
    useState<RankingHistory[]>([]);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [matchScope, setMatchScope] =
    useState<MatchScope>("mine");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("Tu dois être connecté.");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const [
        profileResult,
        matchesResult,
        playersResult,
        historyResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, first_name, last_name, username"
          )
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("matches")
          .select(
            "id, sport, format, result_type, created_at"
          )
          .eq("sport", mode)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("match_players")
          .select(
            `
              match_id,
              player_id,
              team,
              guest_name,
              profiles (
                id,
                first_name,
                last_name,
                username
              )
            `
          ),

        supabase
          .from("ranking_history")
          .select(
            `
              id,
              match_id,
              player_id,
              sport,
              old_points,
              new_points,
              points_change,
              created_at
            `
          )
          .eq("sport", mode),
      ]);

      if (cancelled) return;

      if (profileResult.error) {
        setError(profileResult.error.message);
        setLoading(false);
        return;
      }

      if (matchesResult.error) {
        setError(matchesResult.error.message);
        setLoading(false);
        return;
      }

      if (playersResult.error) {
        setError(playersResult.error.message);
        setLoading(false);
        return;
      }

      if (historyResult.error) {
        setError(historyResult.error.message);
        setLoading(false);
        return;
      }

      const loadedMatches =
        (matchesResult.data ?? []) as Match[];

      setProfile(
        (profileResult.data ??
          null) as Profile | null
      );

      setMatches(loadedMatches);

      setMatchPlayers(
        (playersResult.data ??
          []) as MatchPlayer[]
      );

      setRankingHistory(
        (historyResult.data ??
          []) as RankingHistory[]
      );

      const matchIds =
        loadedMatches.map(
          (match) => match.id
        );

      if (!matchIds.length) {
        setSets([]);
        setLoading(false);
        return;
      }

      const {
        data: setsData,
        error: setsError,
      } = await supabase
        .from("sets")
        .select(
          `
            id,
            match_id,
            set_number,
            team_1_score,
            team_2_score,
            is_match_tiebreak
          `
        )
        .in("match_id", matchIds)
        .order("set_number", {
          ascending: true,
        });

      if (cancelled) return;

      if (setsError) {
        setError(setsError.message);
        setLoading(false);
        return;
      }

      setSets(
        (setsData ?? []) as SetRow[]
      );

      setLoading(false);
    }

    loadMatches().catch((loadError) => {
      if (cancelled) return;

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Une erreur est survenue."
      );

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const playersByMatch = useMemo(() => {
    const map = new Map<
      string,
      MatchPlayer[]
    >();

    for (const player of matchPlayers) {
      const current =
        map.get(player.match_id) ?? [];

      current.push(player);

      map.set(player.match_id, current);
    }

    return map;
  }, [matchPlayers]);

  const setsByMatch = useMemo(() => {
    const map = new Map<
      string,
      SetRow[]
    >();

    for (const set of sets) {
      const current =
        map.get(set.match_id) ?? [];

      current.push(set);

      map.set(set.match_id, current);
    }

    return map;
  }, [sets]);

  const myMatches = useMemo(() => {
    if (!currentUserId) {
      return [];
    }

    return matches.filter((match) => {
      const players =
        playersByMatch.get(match.id) ?? [];

      return players.some(
        (player) =>
          player.player_id === currentUserId
      );
    });
  }, [
    matches,
    playersByMatch,
    currentUserId,
  ]);

  const displayedMatches =
    matchScope === "mine"
      ? myMatches
      : matches;

  const sportLabel = getSportLabel(mode);

  const displayName =
    profile?.first_name ||
    profile?.username ||
    "Joueur";

  const competitiveCount = useMemo(
    () =>
      displayedMatches.filter(
        (match) =>
          match.result_type ===
          "competitive"
      ).length,
    [displayedMatches]
  );

  const newMatchHref =
    mode === "super_tiebreak"
      ? "/supertiebreak/new"
      : "/matches/new";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5">
      {/* BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />

        <div className="absolute -right-45 top-[35%] h-96 w-96 rounded-full bg-indigo-500/8 blur-[130px]" />

        <div className="absolute -bottom-45 left-[20%] h-96 w-96 rounded-full bg-violet-500/8 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-xl">
        {/* HEADER */}

        <motion.header
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[15px] border border-accent/20 bg-white/5 shadow-[0_0_35px_var(--accent-glow)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              <Image
                src="/icons/icon-192.png"
                alt="SmashBreakPoint"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </Link>

            <div className="min-w-0">
              <p className="eyebrow">
                SmashBreakPoint
              </p>

              <h1 className="mt-0.5 truncate font-display text-xl font-bold tracking-[-0.03em]">
                Mes matchs
              </h1>
            </div>
          </div>

          <Link
            href="/profile"
            aria-label={`Profil de ${displayName}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/8 bg-white/4 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/7 hover:text-foreground active:scale-[0.97]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" />
            </svg>
          </Link>
        </motion.header>

        {/* PAGE INTRO */}

        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="mb-5"
        >
          <p className="text-sm leading-5 text-muted">
            Retrouve ton historique et les matchs
            enregistrés sur SmashBreakPoint.
          </p>
        </motion.div>

        {/* SPORT + NEW MATCH */}

        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <SportModeSwitcher />

          <Link
            href={newMatchHref}
            className="group flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-[12px] font-bold text-[#0b0d13] shadow-[0_8px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_10px_38px_var(--accent-glow)] active:scale-[0.97]"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nouveau match
          </Link>
        </motion.div>

        {/* CONTENT */}

        <AnimatePresence
          mode="wait"
          initial={false}
        >
          <motion.div
            key={mode}
            initial={{
              opacity: 0,
              y: 6,
              filter: "blur(4px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              y: -4,
              filter: "blur(2px)",
            }}
            transition={{
              duration: 0.28,
              ease: "easeOut",
            }}
          >
            {/* SPORT HEADER */}

            <section className="mb-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    Historique
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em]">
                    {sportLabel}
                  </h2>
                </div>

                <div className="text-right">
                  <p className="font-display text-2xl font-bold">
                    {displayedMatches.length}
                  </p>

                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                    match
                    {displayedMatches.length !==
                    1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>
            </section>

            {/* SCOPE SWITCH */}

            <section className="mb-5">
              <div className="rounded-[20px] border border-white/7 bg-white/3.5 p-1 backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      {
                        id: "mine",
                        label: "Mes matchs",
                        count:
                          myMatches.length,
                      },
                      {
                        id: "all",
                        label: "Tous les matchs",
                        count: matches.length,
                      },
                    ] as const
                  ).map((item) => {
                    const active =
                      matchScope === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setMatchScope(item.id)
                        }
                        className={`relative flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-[11px] font-bold transition-all duration-200 ${
                          active
                            ? "bg-white/8 text-foreground shadow-[0_8px_24px_-16px_rgba(0,0,0,0.9)]"
                            : "text-muted hover:bg-white/4 hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="match-scope-pill"
                            className="absolute inset-0 rounded-2xl border border-white/8 bg-white/4"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 32,
                            }}
                          />
                        )}

                        <span className="relative z-10">
                          {item.label}
                        </span>

                        <span
                          className={`relative z-10 rounded-full px-1.5 py-0.5 text-[8px] ${
                            active
                              ? "bg-accent/10 text-accent"
                              : "bg-white/5 text-muted-2"
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SUMMARY */}

            {!loading &&
              !error &&
              displayedMatches.length > 0 && (
                <motion.section
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  className="mb-5 grid grid-cols-2 gap-2.5"
                >
                  <div className="rounded-[22px] border border-white/7 bg-white/3.5 px-4 py-3.5 backdrop-blur-xl">
                    <p className="eyebrow">
                      Affichés
                    </p>

                    <p className="mt-1 font-display text-xl font-bold">
                      {displayedMatches.length}
                    </p>

                    <p className="mt-0.5 text-[9px] text-muted">
                      {matchScope === "mine"
                        ? "dans ton historique"
                        : "dans l'application"}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-white/7 bg-white/3.5 px-4 py-3.5 backdrop-blur-xl">
                    <p className="eyebrow">
                      Compétitifs
                    </p>

                    <p className="mt-1 font-display text-xl font-bold">
                      {competitiveCount}
                    </p>

                    <p className="mt-0.5 text-[9px] text-muted">
                      avec impact classement
                    </p>
                  </div>
                </motion.section>
              )}

            {/* LOADING */}

            {loading && (
              <div className="space-y-3">
                {[
                  1,
                  2,
                  3,
                ].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-[25px] border border-white/5 bg-white/3.5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white/7" />

                        <div>
                          <div className="h-3 w-24 rounded bg-white/7" />
                          <div className="mt-2 h-2 w-16 rounded bg-white/5" />
                        </div>
                      </div>

                      <div className="h-8 w-8 rounded-full bg-white/5" />
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="h-8 rounded-xl bg-white/5" />
                      <div className="h-8 rounded-xl bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <section className="glass-strong rounded-[30px] px-5 py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-danger/20 bg-danger/8 text-danger">
                  <AlertIcon className="h-6 w-6" />
                </div>

                <h2 className="mt-5 font-display text-xl font-bold">
                  Impossible de charger les matchs
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-muted">
                  {error}
                </p>
              </section>
            )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              displayedMatches.length === 0 && (
                <motion.section
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  className="glass-strong rounded-[30px] px-5 py-10 text-center"
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/15 bg-accent/8 text-accent">
                    <SportIcon
                      sport={mode}
                      className="h-6 w-6"
                    />
                  </div>

                  <h2 className="mt-5 font-display text-xl font-bold">
                    {matchScope === "mine"
                      ? "Aucun match pour le moment"
                      : `Aucun match ${sportLabel}`}
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-muted">
                    {matchScope === "mine"
                      ? `Tes matchs ${sportLabel.toLowerCase()} apparaîtront ici après ton premier match.`
                      : `Il n'y a encore aucun match ${sportLabel.toLowerCase()} enregistré.`}
                  </p>

                  <Link
                    href={newMatchHref}
                    className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-[12px] font-bold text-[#0b0d13] shadow-[0_8px_30px_var(--accent-glow)] transition-all hover:brightness-105 active:scale-[0.97]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Créer un match
                  </Link>
                </motion.section>
              )}

            {/* MATCH LIST */}

            {!loading &&
              !error &&
              displayedMatches.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="eyebrow">
                        Matchs
                      </p>

                      <h3 className="mt-1 font-display text-lg font-bold">
                        {matchScope === "mine"
                          ? "Ton historique"
                          : "Tous les matchs"}
                      </h3>
                    </div>

                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                      {displayedMatches.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {displayedMatches.map(
                      (match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          players={
                            playersByMatch.get(
                              match.id
                            ) ?? []
                          }
                          sets={
                            setsByMatch.get(
                              match.id
                            ) ?? []
                          }
                          rankingHistory={
                            rankingHistory
                          }
                          currentUserId={
                            currentUserId
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}