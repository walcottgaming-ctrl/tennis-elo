"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";

type Sport = "tennis" | "padel" | "super_tiebreak";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  points_tennis: number | null;
  points_padel: number | null;
  points_super_tiebreak: number | null;
};

type Match = {
  id: string;
  sport: Sport;
  format: "singles" | "doubles";
  created_at: string;
};

type MatchPlayer = {
  match_id: string;
  player_id: string | null;
  team: number;
};

type RankingHistory = {
  id: string;
  match_id: string;
  player_id: string;
  sport: Sport;
  old_points: number;
  new_points: number;
  points_change: number;
  base_points: number;
  bonus_bulle: number;
  bonus_double_bulle: number;
  bonus_victoire_propre: number;
  bonus_serie: number;
  bonus_performer: number;
  malus_fanny: number;
  malus_double_bulle: number;
  malus_contre_performance: number;
  amortisseur_tiebreak: number;
  bonus_stb_large: number;
  bonus_stb_perfect: number;
  created_at: string;
  profiles: Player | Player[] | null;
};

type ChampionHistory = {
  id: string;
  player_id: string;
  sport: Sport;
  started_at: string;
  ended_at: string | null;
  matches_as_champion: number;
};

type Division = {
  name: string;
  min: number;
  max: number | null;
  description: string;
};

function TrophyIcon({
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
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v2a4 4 0 0 0 4 4" />
      <path d="M17 6h3v2a4 4 0 0 1-4 4" />
    </svg>
  );
}

function ChevronRightIcon({
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon({
  open,
  className = "h-4 w-4",
}: {
  open: boolean;
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
      className={`${className} transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CrownIcon({
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
      <path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" />
      <path d="M5 19h14" />
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

function AlertIcon({
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
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.5 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function DivisionMark({
  name,
  className = "h-7 w-7",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "Bronze") {
    return (
      <svg
        viewBox="0 0 40 40"
        className={className}
        aria-hidden="true"
      >
        <circle {...common} cx="20" cy="20" r="10" />
        <circle
          {...common}
          cx="20"
          cy="20"
          r="5"
          opacity="0.5"
        />
      </svg>
    );
  }

  if (name === "Argent") {
    return (
      <svg
        viewBox="0 0 40 40"
        className={className}
        aria-hidden="true"
      >
        <circle {...common} cx="20" cy="20" r="11" />
        <circle
          {...common}
          cx="20"
          cy="20"
          r="6"
          opacity="0.5"
        />
        <path
          {...common}
          d="M20 5v4M20 31v4M5 20h4M31 20h4"
          opacity="0.45"
        />
      </svg>
    );
  }

  if (name === "Or") {
    return (
      <svg
        viewBox="0 0 40 40"
        className={className}
        aria-hidden="true"
      >
        <path
          {...common}
          d="m20 6 11 7v14l-11 7-11-7V13l11-7Z"
        />
        <path
          {...common}
          d="m20 12 5 3v10l-5 3-5-3V15l5-3Z"
          opacity="0.5"
        />
      </svg>
    );
  }

  if (name === "Platine") {
    return (
      <svg
        viewBox="0 0 40 40"
        className={className}
        aria-hidden="true"
      >
        <path
          {...common}
          d="m20 5 13 13-13 17L7 18 20 5Z"
        />
        <path
          {...common}
          d="m20 11 7 7-7 10-7-10 7-7Z"
          opacity="0.5"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
    >
      <path
        {...common}
        d="m20 4 14 14-14 18L6 18 20 4Z"
        opacity="0.9"
      />
      <path
        {...common}
        d="m20 10 8 8-8 11-8-11 8-8Z"
        opacity="0.6"
      />
      <path
        {...common}
        d="M20 4v6M6 18h8M34 18h-8M20 32v4"
        opacity="0.35"
      />
    </svg>
  );
}

function getDivisionAccent(name: string) {
  switch (name) {
    case "Bronze":
      return "text-[#cd8b55]";
    case "Argent":
      return "text-[#cbd5e1]";
    case "Or":
      return "text-[#f5c451]";
    case "Platine":
      return "text-[#b7c8e8]";
    case "Diamant":
      return "text-accent";
    default:
      return "text-muted";
  }
}

function DivisionBadge({
  division,
  compact = false,
}: {
  division: Division;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center ${
        compact ? "gap-1.5" : "gap-2.5"
      } ${getDivisionAccent(division.name)}`}
    >
      <DivisionMark
        name={division.name}
        className={compact ? "h-5 w-5" : "h-7 w-7"}
      />

      <span
        className={`font-semibold uppercase tracking-[0.12em] ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        {division.name}
      </span>
    </div>
  );
}

export default function RankingPage() {
  const { mode } = useSportMode();

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>(
    []
  );
  const [rankingHistory, setRankingHistory] = useState<
    RankingHistory[]
  >([]);
  const [championHistory, setChampionHistory] = useState<
    ChampionHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expandedPlayerId, setExpandedPlayerId] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function loadRanking() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Tu dois être connecté.");
        setLoading(false);
        return;
      }

      const { data: playersData, error: playersError } =
        await supabase
          .from("profiles")
          .select(
            "id, first_name, last_name, username, points_tennis, points_padel, points_super_tiebreak"
          );

      if (playersError) {
        setMessage(playersError.message);
        setLoading(false);
        return;
      }

      const { data: matchesData, error: matchesError } =
        await supabase
          .from("matches")
          .select("id, sport, format, created_at")
          .order("created_at", { ascending: false });

      if (matchesError) {
        setMessage(matchesError.message);
        setLoading(false);
        return;
      }

      const {
        data: matchPlayersData,
        error: matchPlayersError,
      } = await supabase
        .from("match_players")
        .select("match_id, player_id, team");

      if (matchPlayersError) {
        setMessage(matchPlayersError.message);
        setLoading(false);
        return;
      }

      const {
        data: rankingHistoryData,
        error: rankingHistoryError,
      } = await supabase
        .from("ranking_history")
        .select(`
          id,
          match_id,
          player_id,
          sport,
          old_points,
          new_points,
          points_change,
          base_points,
          bonus_bulle,
          bonus_double_bulle,
          bonus_victoire_propre,
          bonus_serie,
          bonus_performer,
          malus_fanny,
          malus_double_bulle,
          malus_contre_performance,
          amortisseur_tiebreak,
          bonus_stb_large,
          bonus_stb_perfect,
          created_at,
          profiles (
            id,
            first_name,
            last_name,
            username,
            points_tennis,
            points_padel,
            points_super_tiebreak
          )
        `)
        .order("created_at", { ascending: true });

      if (rankingHistoryError) {
        setMessage(rankingHistoryError.message);
        setLoading(false);
        return;
      }

      const { data: championData, error: championError } =
        await supabase
          .from("champion_history")
          .select(
            "id, player_id, sport, started_at, ended_at, matches_as_champion"
          )
          .order("started_at", { ascending: false });

      if (championError) {
        setMessage(championError.message);
        setLoading(false);
        return;
      }

      setPlayers(playersData ?? []);
      setMatches((matchesData ?? []) as Match[]);
      setMatchPlayers(matchPlayersData ?? []);
      setRankingHistory(
        (rankingHistoryData ?? []) as RankingHistory[]
      );
      setChampionHistory(championData ?? []);
      setLoading(false);
    }

    loadRanking();
  }, []);

  function getPlayerName(player: Player) {
    const fullName = [player.first_name, player.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) return fullName;
    if (player.username) return `@${player.username}`;

    return "Joueur";
  }

  /*
   * SOURCE DE VÉRITÉ DU CLASSEMENT
   *
   * Les points actuels ne viennent PAS de profiles.points_*.
   * Ils viennent de la dernière valeur new_points enregistrée
   * dans ranking_history pour le joueur et le sport sélectionné.
   *
   * La date du match est utilisée pour déterminer l'ordre réel
   * des matchs. match_id sert de départage si deux matchs ont
   * exactement le même created_at.
   */
  const getPlayerPoints = useCallback(
    (player: Player) => {
      const playerHistory = rankingHistory
        .filter(
          (history) =>
            history.player_id === player.id &&
            history.sport === mode
        )
        .sort((a, b) => {
          const matchA = matches.find(
            (match) => match.id === a.match_id
          );

          const matchB = matches.find(
            (match) => match.id === b.match_id
          );

          const timeA = matchA
            ? new Date(matchA.created_at).getTime()
            : new Date(a.created_at).getTime();

          const timeB = matchB
            ? new Date(matchB.created_at).getTime()
            : new Date(b.created_at).getTime();

          if (timeA !== timeB) {
            return timeB - timeA;
          }

          return b.match_id.localeCompare(a.match_id);
        });

      if (playerHistory.length === 0) {
        return null;
      }

      return playerHistory[0].new_points;
    },
    [rankingHistory, matches, mode]
  );

  function getSportLabel() {
    if (mode === "tennis") return "Tennis";
    if (mode === "padel") return "Padel";
    return "Super Tie-Break";
  }

  function getDivision(points: number): Division {
    if (points < 1000) {
      return {
        name: "Bronze",
        min: 0,
        max: 999,
        description: "Tu construis ton niveau.",
      };
    }

    if (points < 1100) {
      return {
        name: "Argent",
        min: 1000,
        max: 1099,
        description: "Tu progresses et prends de la place.",
      };
    }

    if (points < 1200) {
      return {
        name: "Or",
        min: 1100,
        max: 1199,
        description: "Tu fais partie des joueurs solides.",
      };
    }

    if (points < 1300) {
      return {
        name: "Platine",
        min: 1200,
        max: 1299,
        description: "Tu fais partie des meilleurs.",
      };
    }

    return {
      name: "Diamant",
      min: 1300,
      max: null,
      description: "Le niveau élite.",
    };
  }

  function getChampion(sportValue: Sport) {
    return championHistory.find(
      (item) =>
        item.sport === sportValue && item.ended_at === null
    );
  }

  function isChampion(playerId: string) {
    return championHistory.some(
      (item) =>
        item.sport === mode &&
        item.ended_at === null &&
        item.player_id === playerId
    );
  }

  function getChampionStreak(playerId: string) {
    return (
      championHistory.find(
        (item) =>
          item.sport === mode &&
          item.ended_at === null &&
          item.player_id === playerId
      )?.matches_as_champion ?? 0
    );
  }

  function getPlayerMatches(playerId: string) {
    const playerMatchIds = new Set(
      matchPlayers
        .filter((item) => item.player_id === playerId)
        .map((item) => item.match_id)
    );

    return matches
      .filter(
        (match) =>
          match.sport === mode &&
          playerMatchIds.has(match.id)
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
  }

  function getOpponentNames(
    playerId: string,
    matchId: string
  ) {
    const currentPlayer = matchPlayers.find(
      (item) =>
        item.match_id === matchId &&
        item.player_id === playerId
    );

    if (!currentPlayer) return "Adversaire";

    const opponentTeam =
      currentPlayer.team === 1 ? 2 : 1;

    const opponentIds = matchPlayers
      .filter(
        (item) =>
          item.match_id === matchId &&
          item.team === opponentTeam &&
          item.player_id
      )
      .map((item) => item.player_id as string);

    const opponentPlayers = players.filter((player) =>
      opponentIds.includes(player.id)
    );

    if (!opponentPlayers.length) {
      return "Adversaire";
    }

    return opponentPlayers.map(getPlayerName).join(" & ");
  }

  function getFormatLabel(format: Match["format"]) {
    return format === "doubles" ? "Double" : "Simple";
  }

  function getRecentConfrontations(playerId: string) {
    return getPlayerMatches(playerId).slice(0, 3);
  }

  const sportLabel = getSportLabel();

  const modeMatchIds = useMemo(
    () =>
      new Set(
        matches
          .filter((match) => match.sport === mode)
          .map((match) => match.id)
      ),
    [matches, mode]
  );

  /*
   * Un joueur apparaît dans le classement uniquement s'il :
   *
   * 1. a réellement participé à un match du sport sélectionné
   * 2. possède au moins une entrée dans ranking_history
   */
  const activePlayerIds = useMemo(
    () =>
      new Set(
        matchPlayers
          .filter(
            (item) =>
              modeMatchIds.has(item.match_id) &&
              item.player_id
          )
          .map((item) => item.player_id as string)
      ),
    [matchPlayers, modeMatchIds]
  );

  /*
   * Classement :
   * - uniquement les joueurs actifs
   * - uniquement ceux qui ont un historique de points
   * - tri décroissant par points
   */
  const rankedPlayers = useMemo(() => {
    return players
      .filter((player) => activePlayerIds.has(player.id))
      .map((player) => ({
        player,
        points: getPlayerPoints(player),
      }))
      .filter(
        (
          item
        ): item is {
          player: Player;
          points: number;
        } => item.points !== null
      )
      .sort((a, b) => b.points - a.points)
      .map((item) => item.player);
  }, [players, activePlayerIds, getPlayerPoints]);

  const podium = rankedPlayers.slice(0, 3);

  const topPlayer = rankedPlayers[0] ?? null;

  const currentChampion = getChampion(mode);

  const currentChampionPlayer = currentChampion
    ? players.find(
        (player) =>
          player.id === currentChampion.player_id
      ) ?? null
    : null;

  const topPoints = topPlayer
    ? getPlayerPoints(topPlayer) ?? 1000
    : 0;

  const topDivision = topPlayer
    ? getDivision(topPoints)
    : null;

  function getDivisionProgress(
    points: number,
    division: Division
  ) {
    if (division.max === null) return 100;

    const range =
      division.max - division.min + 1;

    const current = points - division.min;

    return Math.min(
      100,
      Math.max(0, (current / range) * 100)
    );
  }

  function getNextDivision(points: number) {
    if (points < 1000) return 1000;
    if (points < 1100) return 1100;
    if (points < 1200) return 1200;
    if (points < 1300) return 1300;

    return null;
  }

  const topNextDivision = topPlayer
    ? getNextDivision(topPoints)
    : null;

  const pointsToNextDivision =
    topNextDivision !== null
      ? Math.max(0, topNextDivision - topPoints)
      : 0;

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute left-[-18%] top-[-10%] h-105 w-105 rounded-full bg-accent/5.5 blur-[110px]" />
          <div className="absolute bottom-[-18%] right-[-12%] h-115 w-115 rounded-full bg-indigo-500/8 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-lg">
          <div className="mb-7 flex items-center justify-between">
            <div className="space-y-2.5">
              <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/8" />
              <div className="h-9 w-40 animate-pulse rounded-xl bg-white/8" />
              <div className="h-3 w-56 animate-pulse rounded-full bg-white/5" />
            </div>

            <div className="h-12 w-12 animate-pulse rounded-full bg-white/8" />
          </div>

          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-[28px] bg-white/5" />
            <div className="h-32 animate-pulse rounded-[28px] bg-white/5" />
            <div className="h-40 animate-pulse rounded-[28px] bg-white/5" />
            <div className="h-80 animate-pulse rounded-[28px] bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute left-[-20%] top-[-10%] h-125 w-125 rounded-full bg-accent/6 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-15%] h-135 w-135 rounded-full bg-indigo-500/8 blur-[135px]" />
      </div>

      <div className="mx-auto max-w-lg space-y-5 pb-8">
        {/* HEADER */}

        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow">
                Classement
              </span>

              <span className="h-1 w-1 rounded-full bg-white/20" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                {sportLabel}
              </span>
            </div>

            <h1 className="mt-1 font-display text-3xl font-bold tracking-[-0.04em]">
              Classement
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-5 text-muted">
              Ta position dans la hiérarchie SmashBreakPoint.
            </p>
          </div>

          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent shadow-[0_0_30px_var(--accent-glow)]">
            <div className="absolute inset-0 rounded-full bg-accent/6 blur-xl" />

            <SportIcon
              sport={mode}
              className="relative h-5 w-5"
            />
          </div>
        </header>

        {/* ERROR */}

        {message && (
          <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3.5 text-sm text-danger">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* LEADER */}

        {topPlayer && topDivision ? (
          <section className="glass-strong relative overflow-hidden rounded-[30px] p-5 sm:p-6">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
              aria-hidden="true"
            />

            <div
              className="pointer-events-none absolute bottom-0 left-0 h-28 w-44 rounded-full bg-accent/5 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    Leader actuel
                  </p>

                  <div className="mt-4 flex items-center gap-3.5">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-accent/10 font-display text-xl font-bold text-accent shadow-[0_0_28px_var(--accent-glow)]">
                      01
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-bold tracking-tight">
                        {getPlayerName(topPlayer)}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2">
                        <DivisionBadge
                          division={topDivision}
                          compact
                        />

                        {isChampion(topPlayer.id) && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-white/20" />

                            <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-accent">
                              <CrownIcon className="h-3 w-3" />
                              Champion
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/ranking/player/${topPlayer.id}`}
                  aria-label={`Voir le profil de ${getPlayerName(
                    topPlayer
                  )}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/8 bg-white/5 text-muted transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-[1fr_auto] items-end gap-5">
                <div>
                  <p className="eyebrow">
                    Points
                  </p>

                  <p className="mt-1 font-display text-5xl font-bold tracking-tighter">
                    {topPoints}
                  </p>
                </div>

                <div className="text-right">
                  <p className="eyebrow">
                    Joueurs actifs
                  </p>

                  <p className="mt-1 font-display text-2xl font-bold">
                    {rankedPlayers.length}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {topDivision.name}
                  </span>

                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
                    {topNextDivision !== null
                      ? `${pointsToNextDivision} pts restantes`
                      : "Niveau maximal"}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-accent shadow-[0_0_18px_var(--accent-glow)] transition-all duration-700"
                    style={{
                      width: `${getDivisionProgress(
                        topPoints,
                        topDivision
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="glass-strong rounded-[30px] px-5 py-9 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/8 bg-white/5 text-muted">
              <TrophyIcon className="h-6 w-6" />
            </div>

            <p className="mt-4 font-display text-lg font-semibold">
              Aucun classement
            </p>

            <p className="mx-auto mt-1 max-w-xs text-sm leading-5 text-muted">
              Joue un premier match pour apparaître dans le classement.
            </p>
          </section>
        )}

        {/* PODIUM */}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="eyebrow">
                Top joueurs
              </p>

              <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                Podium
              </h2>
            </div>

            <span className="text-xs text-muted">
              {rankedPlayers.length} joueur
              {rankedPlayers.length > 1 ? "s" : ""}
            </span>
          </div>

          {podium.length > 0 ? (
            <div className="grid grid-cols-3 items-end gap-2">
              {[1, 0, 2].map((index) => {
                const player = podium[index];

                if (!player) {
                  return <div key={index} />;
                }

                const rank = index + 1;

                const points =
                  getPlayerPoints(player) ?? 1000;

                const division =
                  getDivision(points);

                const champion = isChampion(
                  player.id
                );

                const isFirst = rank === 1;

                return (
                  <Link
                    key={player.id}
                    href={`/ranking/player/${player.id}`}
                    className={`group relative overflow-hidden rounded-[26px] border p-3.5 text-center transition-all duration-200 hover:-translate-y-1 ${
                      isFirst
                        ? "border-accent/20 bg-accent/4.5 shadow-[0_18px_45px_var(--accent-glow)]"
                        : "border-white/8 bg-white/3.5 hover:border-white/12 hover:bg-white/5"
                    }`}
                  >
                    {isFirst && (
                      <div
                        className="pointer-events-none absolute inset-x-4 top-0 h-20 rounded-full bg-accent/10 blur-2xl"
                        aria-hidden="true"
                      />
                    )}

                    <div className="relative">
                      <div
                        className={`mx-auto grid place-items-center rounded-full border font-display font-bold ${
                          isFirst
                            ? "h-12 w-12 border-accent/25 bg-accent/10 text-lg text-accent"
                            : "h-10 w-10 border-white/8 bg-white/5 text-sm text-muted"
                        }`}
                      >
                        {rank}
                      </div>

                      <div className="mt-3 truncate text-xs font-semibold">
                        {getPlayerName(player)}
                      </div>

                      <div className="mt-1 font-display text-lg font-bold">
                        {points}
                      </div>

                      <div className="mt-1 flex justify-center">
                        <DivisionBadge
                          division={division}
                          compact
                        />
                      </div>

                      {champion && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-[8px] font-semibold uppercase tracking-widest text-accent">
                          <CrownIcon className="h-3 w-3" />
                          Champion
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* CHAMPION */}

        <section className="glass relative overflow-hidden rounded-[28px] p-5">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Champion actuel
                </p>

                <h2 className="mt-2 font-display text-xl font-bold tracking-tight">
                  {currentChampionPlayer
                    ? getPlayerName(
                        currentChampionPlayer
                      )
                    : "Aucun champion"}
                </h2>

                {currentChampionPlayer && (
                  <p className="mt-1 text-xs text-muted">
                    {sportLabel}
                  </p>
                )}
              </div>

              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <CrownIcon className="h-5 w-5" />
              </div>
            </div>

            {currentChampionPlayer &&
            currentChampion ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-white/6 bg-white/2.5 p-3.5">
                    <p className="eyebrow">
                      Règne
                    </p>

                    <p className="mt-1.5 font-display text-xl font-bold">
                      {
                        currentChampion.matches_as_champion
                      }
                    </p>

                    <p className="mt-0.5 text-[11px] text-muted">
                      matchs défendus
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/6 bg-white/2.5 p-3.5">
                    <p className="eyebrow">
                      Depuis
                    </p>

                    <p className="mt-1.5 font-display text-xl font-bold">
                      {new Date(
                        currentChampion.started_at
                      ).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "short",
                        }
                      )}
                    </p>

                    <p className="mt-0.5 text-[11px] text-muted">
                      début du règne
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                  <div className="h-1 w-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                  Champion en titre
                </div>
              </>
            ) : (
              <p className="mt-4 max-w-sm text-sm leading-5 text-muted">
                Le premier champion sera désigné après les prochains matchs.
              </p>
            )}
          </div>
        </section>

        {/* DIVISION */}

        {topDivision && topPlayer && (
          <section className="glass relative overflow-hidden rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="eyebrow">
                  Progression de division
                </p>

                <div className="mt-2.5">
                  <DivisionBadge
                    division={topDivision}
                  />
                </div>

                <p className="mt-2 max-w-xs text-sm leading-5 text-muted">
                  {topDivision.description}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="eyebrow">
                  Points
                </p>

                <p className="mt-1 font-display text-3xl font-bold tracking-tight">
                  {topPoints}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                <span>
                  {topDivision.name}
                </span>

                <span className="text-accent">
                  {topDivision.max === null
                    ? "Élite"
                    : `${Math.round(
                        getDivisionProgress(
                          topPoints,
                          topDivision
                        )
                      )}%`}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-accent shadow-[0_0_16px_var(--accent-glow)] transition-all duration-500"
                  style={{
                    width: `${getDivisionProgress(
                      topPoints,
                      topDivision
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-muted-2">
                <span>
                  {topDivision.min} pts
                </span>

                <span>
                  {topDivision.max === null
                    ? "Niveau maximal"
                    : topNextDivision !== null
                      ? `${topNextDivision} pts`
                      : "Prochain niveau"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-1">
              {[
                "Bronze",
                "Argent",
                "Or",
                "Platine",
                "Diamant",
              ].map((divisionName) => {
                const isCurrent =
                  divisionName ===
                  topDivision.name;

                return (
                  <div
                    key={divisionName}
                    className={`flex flex-col items-center gap-1.5 rounded-xl py-2 ${
                      isCurrent
                        ? "bg-white/5 text-foreground"
                        : "text-muted-2"
                    }`}
                  >
                    <DivisionMark
                      name={divisionName}
                      className={`h-6 w-6 ${
                        isCurrent
                          ? getDivisionAccent(
                              divisionName
                            )
                          : ""
                      }`}
                    />

                    <span className="text-[8px] font-semibold uppercase tracking-[0.08em]">
                      {divisionName}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* FULL RANKING */}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="eyebrow">
                Classement complet
              </p>

              <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                Tous les joueurs
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
              <ArrowUpIcon className="h-3 w-3 text-accent" />
              Points
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/2.5">
            {rankedPlayers.map(
              (player, index) => {
                const points =
                  getPlayerPoints(player) ?? 1000;

                const division =
                  getDivision(points);

                const playerMatches =
                  getRecentConfrontations(
                    player.id
                  );

                const expanded =
                  expandedPlayerId ===
                  player.id;

                const champion =
                  isChampion(player.id);

                const streak =
                  getChampionStreak(
                    player.id
                  );

                return (
                  <div
                    key={player.id}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPlayerId(
                          expanded
                            ? null
                            : player.id
                        )
                      }
                      className="group flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition-colors hover:bg-white/4.5"
                    >
                      <div
                        className={`w-7 shrink-0 text-center font-display text-[11px] font-bold ${
                          index === 0
                            ? "text-accent"
                            : "text-muted-2"
                        }`}
                      >
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </div>

                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
                          index === 0
                            ? "border-accent/20 bg-accent/10 text-accent"
                            : "border-white/8 bg-white/5 text-muted"
                        }`}
                      >
                        <span className="text-[11px] font-semibold">
                          {getPlayerName(
                            player
                          )
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-semibold">
                            {getPlayerName(
                              player
                            )}
                          </span>

                          {champion && (
                            <CrownIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <DivisionBadge
                            division={division}
                            compact
                          />

                          {champion &&
                            streak > 0 && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-white/20" />

                                <span className="text-[9px] uppercase tracking-[0.08em] text-accent">
                                  {streak} défense
                                  {streak > 1
                                    ? "s"
                                    : ""}
                                </span>
                              </>
                            )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="font-display text-base font-bold">
                          {points}
                        </div>

                        <div className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-muted">
                          pts
                        </div>
                      </div>

                      <div className="shrink-0 text-muted-2">
                        <ChevronDownIcon
                          open={expanded}
                          className="h-4 w-4"
                        />
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-white/5 bg-black/10 px-3.5 pb-4 pt-3">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="eyebrow">
                            Confrontations récentes
                          </p>

                          <Link
                            href={`/ranking/player/${player.id}`}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent transition-opacity hover:opacity-80"
                          >
                            Profil
                            <ChevronRightIcon className="h-3 w-3" />
                          </Link>
                        </div>

                        {playerMatches.length >
                        0 ? (
                          <div className="space-y-2">
                            {playerMatches.map(
                              (match) => (
                                <Link
                                  key={match.id}
                                  href={`/matches/${match.id}`}
                                  onClick={(
                                    event
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2.5 px-3 py-2.5 transition-all duration-200 hover:border-white/10 hover:bg-white/5"
                                >
                                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-muted">
                                    <SportIcon
                                      sport={
                                        match.sport
                                      }
                                      className="h-3.5 w-3.5"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium">
                                      vs{" "}
                                      {getOpponentNames(
                                        player.id,
                                        match.id
                                      )}
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-muted">
                                      {getFormatLabel(
                                        match.format
                                      )}
                                      {" · "}
                                      {new Date(
                                        match.created_at
                                      ).toLocaleDateString(
                                        "fr-FR",
                                        {
                                          day: "2-digit",
                                          month:
                                            "short",
                                        }
                                      )}
                                    </p>
                                  </div>

                                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-2 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-white/5 bg-white/2.5 px-3 py-4 text-center text-xs text-muted">
                            Aucun match récent.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* HISTORY */}

        <Link
          href="/ranking/history"
          className="group flex items-center gap-4 rounded-3xl border border-white/8 bg-white/3.5 px-4 py-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
            <ArrowUpIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Historique des points
            </p>

            <p className="mt-0.5 text-xs text-muted">
              Consulte l’évolution de ton classement.
            </p>
          </div>

          <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-2 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* EXPLANATION */}

        <section className="glass rounded-[28px] p-5">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
              <ArrowUpIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="eyebrow">
                Comprendre le classement
              </p>

              <h2 className="mt-1.5 font-display text-lg font-bold tracking-tight">
                Les points évoluent après chaque match
              </h2>

              <p className="mt-2 text-sm leading-5 text-muted">
                Ton classement dépend de tes résultats et de la valeur
                sportive de tes performances.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {[
              {
                title: "Victoire",
                description:
                  "Une victoire peut faire progresser ton total.",
              },
              {
                title: "Défaite",
                description:
                  "Une défaite peut entraîner une variation de points.",
              },
              {
                title: "Performance",
                description:
                  "Des bonus ou malus peuvent s’appliquer selon le résultat.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/5 bg-white/2.5 px-3.5 py-3"
              >
                <p className="text-xs font-semibold">
                  {item.title}
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}