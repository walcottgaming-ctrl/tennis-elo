"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";

type Sport =
  | "tennis"
  | "padel"
  | "super_tiebreak";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

type Match = {
  id: string;
  sport: Sport;
  format: "singles" | "doubles";
  result_type: "competitive" | "friendly";
  created_at: string;
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
};

type MatchResult =
  | "win"
  | "loss"
  | "draw"
  | "unknown";

function ArrowLeftIcon({
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
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

function TrashIcon({
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function LoaderIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} animate-spin`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />

      <path
        d="M20 12a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
      return "Résultat";
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
        glow: "shadow-[0_0_35px_var(--accent-glow)]",
      };

    case "loss":
      return {
        text: "text-danger",
        bg: "bg-danger/8",
        border: "border-danger/20",
        glow: "",
      };

    case "draw":
      return {
        text: "text-muted",
        bg: "bg-white/5",
        border: "border-white/10",
        glow: "",
      };

    default:
      return {
        text: "text-muted",
        bg: "bg-white/5",
        border: "border-white/10",
        glow: "",
      };
  }
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
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

function getPlayerRankingHistory(
  history: RankingHistory[],
  playerId: string,
  matchId: string
) {
  return history.find(
    (item) =>
      item.player_id === playerId &&
      item.match_id === matchId
  );
}

function formatSignedPoints(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function formatPointValue(value: number) {
  if (value === 0) {
    return "0";
  }

  return formatSignedPoints(value);
}

type PointDetail = {
  label: string;
  value: number;
};

function getPointDetails(
  history: RankingHistory
): PointDetail[] {
  return [
    {
      label: "Base",
      value: history.base_points,
    },
    {
      label: "Bulle",
      value: history.bonus_bulle,
    },
    {
      label: "Double bulle",
      value: history.bonus_double_bulle,
    },
    {
      label: "Victoire propre",
      value: history.bonus_victoire_propre,
    },
    {
      label: "Série",
      value: history.bonus_serie,
    },
    {
      label: "Performer",
      value: history.bonus_performer,
    },
    {
      label: "Fanny",
      value: history.malus_fanny,
    },
    {
      label: "Double bulle",
      value: history.malus_double_bulle,
    },
    {
      label: "Contre-performance",
      value: history.malus_contre_performance,
    },
    {
      label: "Amortisseur tie-break",
      value: history.amortisseur_tiebreak,
    },
    {
      label: "STB large",
      value: history.bonus_stb_large,
    },
    {
      label: "STB perfect",
      value: history.bonus_stb_perfect,
    },
  ].filter(
    (item) => item.value !== 0
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();

  const matchId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : null;

  const [userId, setUserId] =
    useState<string | null>(null);

  const [match, setMatch] =
    useState<Match | null>(null);

  const [matchPlayers, setMatchPlayers] =
    useState<MatchPlayer[]>([]);

  const [sets, setSets] =
    useState<SetRow[]>([]);

  const [rankingHistory, setRankingHistory] =
    useState<RankingHistory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!matchId) {
      return;
    }

    let cancelled = false;

    async function loadMatch() {
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

      setUserId(user.id);

      const {
        data: matchData,
        error: matchError,
      } = await supabase
        .from("matches")
        .select(
          "id, sport, format, result_type, created_at"
        )
        .eq("id", matchId)
        .maybeSingle();

      if (cancelled) return;

      if (matchError) {
        setError(matchError.message);
        setLoading(false);
        return;
      }

      if (!matchData) {
        setError("Ce match n'existe pas.");
        setLoading(false);
        return;
      }

      const {
        data: playersData,
        error: playersError,
      } = await supabase
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
        )
        .eq("match_id", matchId);

      if (cancelled) return;

      if (playersError) {
        setError(playersError.message);
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
        .eq("match_id", matchId)
        .order("set_number", {
          ascending: true,
        });

      if (cancelled) return;

      if (setsError) {
        setError(setsError.message);
        setLoading(false);
        return;
      }

      const {
        data: historyData,
        error: historyError,
      } = await supabase
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
            created_at
          `
        )
        .eq("match_id", matchId);

      if (cancelled) return;

      if (historyError) {
        setError(historyError.message);
        setLoading(false);
        return;
      }

      setMatch(matchData as Match);

      setMatchPlayers(
        (playersData ?? []) as MatchPlayer[]
      );

      setSets(
        (setsData ?? []) as SetRow[]
      );

      setRankingHistory(
        (historyData ?? []) as RankingHistory[]
      );

      setLoading(false);
    }

    loadMatch().catch((loadError) => {
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
  }, [matchId]);

  const orderedPlayers = useMemo(
    () =>
      [...matchPlayers].sort(
        (a, b) => a.team - b.team
      ),
    [matchPlayers]
  );

  const team1Players = useMemo(
    () =>
      orderedPlayers.filter(
        (player) => player.team === 1
      ),
    [orderedPlayers]
  );

  const team2Players = useMemo(
    () =>
      orderedPlayers.filter(
        (player) => player.team === 2
      ),
    [orderedPlayers]
  );

  const winnerTeam = useMemo(
    () =>
      match
        ? getWinnerTeam(match, sets)
        : null,
    [match, sets]
  );

  const currentUserTeam = useMemo(() => {
    if (!userId) {
      return null;
    }

    return (
      matchPlayers.find(
        (player) =>
          player.player_id === userId
      )?.team ?? null
    );
  }, [matchPlayers, userId]);

  const currentUserHistory = useMemo(() => {
    if (!userId || !matchId) {
      return null;
    }

    return getPlayerRankingHistory(
      rankingHistory,
      userId,
      matchId
    );
  }, [
    rankingHistory,
    userId,
    matchId,
  ]);

  const matchResult = useMemo<MatchResult>(() => {
    if (
      !currentUserTeam ||
      !winnerTeam
    ) {
      return "unknown";
    }

    if (
      currentUserTeam === winnerTeam
    ) {
      return "win";
    }

    return "loss";
  }, [
    currentUserTeam,
    winnerTeam,
  ]);

  const resultClasses =
    getResultClasses(matchResult);

  const scoreLabel = useMemo(
    () =>
      match
        ? getScoreLabel(match, sets)
        : "—",
    [match, sets]
  );

  const pointDetails = useMemo(() => {
    if (!currentUserHistory) {
      return [];
    }

    return getPointDetails(
      currentUserHistory
    );
  }, [currentUserHistory]);

  const isUserInMatch = useMemo(() => {
    if (!userId) {
      return false;
    }

    return matchPlayers.some(
      (player) =>
        player.player_id === userId
    );
  }, [matchPlayers, userId]);

  async function handleDeleteMatch() {
    if (!matchId || !userId || !match || deleting) {
      return;
    }

    if (!isUserInMatch) {
      setError("Tu ne peux pas supprimer ce match.");
      return;
    }

    const confirmed = window.confirm(
      "Supprimer ce match ?\n\nCette action supprimera définitivement le match, ses scores et son impact sur le classement. Le classement sera recalculé à partir des matchs restants."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/matches/${matchId}/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const details = [
          result.message ? `Message : ${result.message}` : "",
          result.code ? `Code : ${result.code}` : "",
          result.details ? `Détails : ${result.details}` : "",
          result.hint ? `Indice : ${result.hint}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        throw new Error(
          details || "Impossible de supprimer ce match."
        );
      }

      router.replace("/matches");
      router.refresh();
    } catch (deleteError) {
      console.error("Erreur suppression match :", deleteError);
      setDeleting(false);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer ce match."
      );
    }
  }

  if (!matchId) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute left-[-20%] top-[-10%] h-125 w-125 rounded-full bg-accent/6 blur-[120px]" />

          <div className="absolute bottom-[-15%] right-[-15%] h-135 w-135 rounded-full bg-indigo-500/8 blur-[135px]" />
        </div>

        <div className="mx-auto max-w-lg">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3.5 py-2 text-xs font-semibold text-muted transition-all hover:border-white/15 hover:bg-white/7 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Mes matchs
          </Link>

          <section className="glass-strong mt-6 rounded-[30px] px-5 py-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-danger/20 bg-danger/8 text-danger">
              <AlertIcon className="h-6 w-6" />
            </div>

            <h1 className="mt-5 font-display text-xl font-bold">
              Match introuvable
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-muted">
              Aucun identifiant de match n&apos;a été fourni.
            </p>

            <Link
              href="/matches"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2.5 text-xs font-semibold text-accent transition-all hover:bg-accent/15 active:scale-[0.98]"
            >
              Retour aux matchs
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute left-[-20%] top-[-10%] h-125 w-125 rounded-full bg-accent/6 blur-[120px]" />

          <div className="absolute bottom-[-15%] right-[-15%] h-135 w-135 rounded-full bg-indigo-500/8 blur-[135px]" />
        </div>

        <div className="mx-auto max-w-lg">
          <div className="mb-7 flex items-center justify-between">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-white/8" />

            <div className="h-11 w-11 animate-pulse rounded-full bg-white/8" />
          </div>

          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-[28px] bg-white/5" />

            <div className="h-72 animate-pulse rounded-[30px] bg-white/5" />

            <div className="h-48 animate-pulse rounded-[28px] bg-white/5" />

            <div className="h-56 animate-pulse rounded-[28px] bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute left-[-20%] top-[-10%] h-125 w-125 rounded-full bg-accent/6 blur-[120px]" />

          <div className="absolute bottom-[-15%] right-[-15%] h-135 w-135 rounded-full bg-indigo-500/8 blur-[135px]" />
        </div>

        <div className="mx-auto max-w-lg">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3.5 py-2 text-xs font-semibold text-muted transition-all hover:border-white/15 hover:bg-white/7 hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Mes matchs
          </Link>

          <section className="glass-strong mt-6 rounded-[30px] px-5 py-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-danger/20 bg-danger/8 text-danger">
              <AlertIcon className="h-6 w-6" />
            </div>

            <h1 className="mt-5 font-display text-xl font-bold">
              Match introuvable
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-muted">
              {error ||
                "Impossible de charger les informations de ce match."}
            </p>

            <Link
              href="/matches"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2.5 text-xs font-semibold text-accent transition-all hover:bg-accent/15 active:scale-[0.98]"
            >
              Retour aux matchs
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </section>
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

        <header className="flex items-center justify-between gap-3">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3.5 py-2 text-xs font-semibold text-muted transition-all hover:border-white/15 hover:bg-white/7 hover:text-foreground active:scale-[0.98]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Mes matchs</span>
          </Link>

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent shadow-[0_0_28px_var(--accent-glow)]">
            <SportIcon
              sport={match.sport}
              className="h-5 w-5"
            />
          </div>
        </header>

        {/* MATCH META */}

        <section className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="eyebrow">
              {getSportLabel(match.sport)}
            </span>

            <span className="h-1 w-1 rounded-full bg-white/20" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
              {getFormatLabel(match.format)}
            </span>
          </div>

          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">
            Détail du match
          </h1>

          <p className="mt-2 text-xs capitalize text-muted">
            {formatDate(match.created_at)}
          </p>

          <div className="mt-3 flex justify-center">
            <span
              className={`rounded-full border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                match.result_type === "competitive"
                  ? "border-accent/15 bg-accent/6 text-accent"
                  : "border-white/8 bg-white/4 text-muted"
              }`}
            >
              {match.result_type === "competitive"
                ? "Compétitif"
                : "Amical"}
            </span>
          </div>
        </section>

        {/* RESULT */}

        <section
          className={`relative overflow-hidden rounded-[30px] border p-5 sm:p-6 ${resultClasses.border} ${resultClasses.bg} ${resultClasses.glow}`}
        >
          <div
            className={`pointer-events-none absolute left-1/2 -top-17.5 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${
              matchResult === "win"
                ? "bg-accent/10"
                : matchResult === "loss"
                  ? "bg-danger/8"
                  : "bg-white/5"
            }`}
            aria-hidden="true"
          />

          <div className="relative text-center">
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${resultClasses.text}`}
            >
              {getResultLabel(matchResult)}
            </p>

            <div className="mt-4 font-display text-5xl font-bold tracking-[-0.06em] sm:text-6xl">
              {scoreLabel}
            </div>

            {sets.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {[...sets]
                  .sort(
                    (a, b) =>
                      a.set_number -
                      b.set_number
                  )
                  .map((set) => (
                    <div
                      key={set.id}
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        set.is_match_tiebreak
                          ? "border-accent/15 bg-accent/6 text-accent"
                          : "border-white/6 bg-white/4 text-muted"
                      }`}
                    >
                      <span className="mr-1.5 text-[9px] uppercase tracking-wider text-muted-2">
                        {set.is_match_tiebreak
                          ? "STB"
                          : `Set ${set.set_number}`}
                      </span>

                      <span className="font-display font-bold text-foreground">
                        {set.team_1_score}
                        {" - "}
                        {set.team_2_score}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* TEAMS */}

        <section>
          <div className="mb-3">
            <p className="eyebrow">
              Composition du match
            </p>

            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
              Les joueurs
            </h2>
          </div>

          <div className="grid gap-2.5">
            {[1, 2].map((team) => {
              const teamPlayers =
                team === 1
                  ? team1Players
                  : team2Players;

              const isWinner =
                winnerTeam === team;

              const isCurrentUserTeam =
                currentUserTeam === team;

              return (
                <div
                  key={team}
                  className={`relative overflow-hidden rounded-3xl border p-4 transition-all ${
                    isWinner
                      ? "border-accent/15 bg-accent/5"
                      : "border-white/7 bg-white/3"
                  }`}
                >
                  {isWinner && (
                    <div
                      className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/8 blur-2xl"
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border font-display text-xs font-bold ${
                          isWinner
                            ? "border-accent/20 bg-accent/10 text-accent"
                            : "border-white/8 bg-white/5 text-muted"
                        }`}
                      >
                        {team}
                      </div>

                      <div className="min-w-0">
                        <p className="eyebrow">
                          Équipe {team}
                        </p>

                        <div className="mt-1 space-y-0.5">
                          {teamPlayers.length > 0 ? (
                            teamPlayers.map(
                              (player) => {
                                const playerName =
                                  getPlayerName(
                                    player
                                  );

                                const isUser =
                                  player.player_id ===
                                  userId;

                                return (
                                  <div
                                    key={`${player.team}-${player.player_id ?? player.guest_name}`}
                                    className="flex min-w-0 items-center gap-2"
                                  >
                                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/8 bg-white/5 text-[9px] font-bold text-muted">
                                      {getPlayerInitials(
                                        playerName
                                      )}
                                    </div>

                                    <span
                                      className={`truncate text-sm font-semibold ${
                                        isUser
                                          ? "text-accent"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {playerName}
                                    </span>

                                    {isUser && (
                                      <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-accent">
                                        Toi
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                            )
                          ) : (
                            <span className="text-sm text-muted">
                              Joueur non renseigné
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isWinner && (
                      <div className="flex shrink-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">
                        <TrophyIcon className="h-3.5 w-3.5" />
                        Gagnant
                      </div>
                    )}

                    {isCurrentUserTeam &&
                      !isWinner &&
                      winnerTeam !== null && (
                        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                          Ton équipe
                        </span>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RANKING IMPACT */}

        {currentUserHistory && (
          <section className="glass-strong relative overflow-hidden rounded-[30px] p-5 sm:p-6">
            <div
              className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl ${
                currentUserHistory.points_change >= 0
                  ? "bg-accent/10"
                  : "bg-danger/7"
              }`}
              aria-hidden="true"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    Impact classement
                  </p>

                  <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">
                    Tes points
                  </h2>
                </div>

                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                    currentUserHistory.points_change >= 0
                      ? "bg-accent/10 text-accent"
                      : "bg-danger/8 text-danger"
                  }`}
                >
                  <span className="font-display text-lg font-bold">
                    {currentUserHistory.points_change >= 0
                      ? "↑"
                      : "↓"}
                  </span>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <div>
                  <p className="eyebrow">
                    Avant
                  </p>

                  <p className="mt-1 font-display text-3xl font-bold tracking-tight">
                    {currentUserHistory.old_points}
                  </p>
                </div>

                <div className="pb-2 text-muted-2">
                  →
                </div>

                <div className="text-right">
                  <p className="eyebrow">
                    Après
                  </p>

                  <p className="mt-1 font-display text-3xl font-bold tracking-tight">
                    {currentUserHistory.new_points}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <div
                  className={`rounded-full border px-4 py-2 ${
                    currentUserHistory.points_change >= 0
                      ? "border-accent/20 bg-accent/10 text-accent"
                      : "border-danger/20 bg-danger/8 text-danger"
                  }`}
                >
                  <span className="font-display text-2xl font-bold">
                    {formatSignedPoints(
                      currentUserHistory.points_change
                    )}
                  </span>

                  <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-[0.14em]">
                    points
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* POINT DETAILS */}

        {currentUserHistory &&
          pointDetails.length > 0 && (
            <section className="glass rounded-[28px] p-5">
              <div>
                <p className="eyebrow">
                  Détail des points
                </p>

                <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">
                  Calcul du match
                </h2>

                <p className="mt-1.5 text-xs leading-5 text-muted">
                  Seuls les éléments ayant réellement
                  modifié ton score sont affichés.
                </p>
              </div>

              <div className="mt-5 space-y-1.5">
                {pointDetails.map(
                  (detail, index) => {
                    const positive =
                      detail.value > 0;

                    return (
                      <div
                        key={`${detail.label}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/2.5 px-3.5 py-3"
                      >
                        <span className="text-xs font-medium text-muted">
                          {detail.label}
                        </span>

                        <span
                          className={`font-display text-sm font-bold ${
                            positive
                              ? "text-accent"
                              : "text-danger"
                          }`}
                        >
                          {formatPointValue(
                            detail.value
                          )}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/7 bg-white/4 px-3.5 py-3.5">
                <span className="text-xs font-semibold">
                  Variation totale
                </span>

                <span
                  className={`font-display text-base font-bold ${
                    currentUserHistory.points_change >= 0
                      ? "text-accent"
                      : "text-danger"
                  }`}
                >
                  {formatSignedPoints(
                    currentUserHistory.points_change
                  )}
                </span>
              </div>
            </section>
          )}

        {/* NO RANKING DATA */}

        {!currentUserHistory && (
          <section className="glass rounded-[28px] p-5">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/8 bg-white/5 text-muted">
                <TrophyIcon className="h-4 w-4" />
              </div>

              <div>
                <p className="eyebrow">
                  Classement
                </p>

                <h2 className="mt-1.5 font-display text-lg font-bold">
                  Aucun impact enregistré
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-muted">
                  Ce match ne possède pas de variation
                  de classement enregistrée pour ton
                  profil.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ACTIONS */}

        <div className="space-y-2.5">
          <Link
            href="/ranking"
            className="group flex items-center gap-4 rounded-3xl border border-accent/15 bg-accent/5 px-4 py-4 transition-all duration-200 hover:border-accent/25 hover:bg-accent/8 active:scale-[0.99]"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
              <TrophyIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Voir le classement
              </p>

              <p className="mt-0.5 text-xs text-muted">
                Consulte ta position et celle des autres joueurs.
              </p>
            </div>

            <ChevronRightIcon className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/matches"
            className="group flex items-center gap-4 rounded-3xl border border-white/8 bg-white/3.5 px-4 py-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.99]"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/8 bg-white/5 text-muted">
              <ArrowLeftIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Retour aux matchs
              </p>

              <p className="mt-0.5 text-xs text-muted">
                Revenir à ton historique de matchs.
              </p>
            </div>

            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-2 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* DELETE MATCH */}

          {isUserInMatch && (
            <button
              type="button"
              onClick={handleDeleteMatch}
              disabled={deleting}
              className="group flex w-full items-center gap-4 rounded-3xl border border-danger/15 bg-danger/5 px-4 py-4 text-left transition-all duration-200 hover:border-danger/25 hover:bg-danger/8 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-danger/15 bg-danger/8 text-danger">
                {deleting ? (
                  <LoaderIcon className="h-4 w-4" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-danger">
                  {deleting
                    ? "Suppression..."
                    : "Supprimer le match"}
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  {deleting
                    ? "Suppression du match en cours..."
                    : "Cette action supprimera définitivement ce match."}
                </p>
              </div>
            </button>
          )}
        </div>

        {/* DELETE ERROR */}

        {error && (
          <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-xs leading-5 text-danger">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}