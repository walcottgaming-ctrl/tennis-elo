import Link from "next/link";
import { createClient } from "@/src/supabase/server";
import PlayerProfile from "./PlayerProfile";

type Sport = "tennis" | "padel" | "super_tiebreak";

type RankingHistory = {
  id: string;
  player_id: string;
  match_id: string;
  sport: Sport;
  old_points: number | null;
  new_points: number | null;
  points_change: number | null;
  base_points: number | null;
  bonus_bulle: number | null;
  bonus_double_bulle: number | null;
  bonus_victoire_propre: number | null;
  bonus_serie: number | null;
  bonus_performer: number | null;
  malus_fanny: number | null;
  malus_double_bulle: number | null;
  malus_contre_performance: number | null;
  amortisseur_tiebreak: number | null;
  bonus_stb_large: number | null;
  bonus_stb_perfect: number | null;
  created_at: string;
};

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;

  // Les points ne viennent plus de profiles.
  // Ils sont calculés depuis ranking_history.new_points.
  points_tennis: number | null;
  points_padel: number | null;
  points_super_tiebreak: number | null;

  // Profil sportif
  dominant_hand: string | null;
  playing_style: string | null;
  backhand_style: string | null;
  preferred_surface: string | null;

  height_cm: number | null;
  weight_kg: number | null;

  forehand_style: string | null;
  backhand_preference: string | null;
  down_the_line_style: string | null;
  cross_court_style: string | null;
  volley_level: string | null;
  serve_style: string | null;

  court_position: string | null;
  player_strength: string | null;
  player_weakness: string | null;
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

type SetScore = {
  match_id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
};

type ChampionHistory = {
  id: string;
  player_id: string;
  sport: Sport;
  started_at: string;
  ended_at: string | null;
  matches_as_champion: number;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function ArrowLeftIcon({
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
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function AlertCircleIcon({
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function LockIcon({
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
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const PLAYER_PROFILE_FIELDS = `
  id,
  first_name,
  last_name,
  username,
  avatar_url,
  dominant_hand,
  playing_style,
  backhand_style,
  preferred_surface,
  height_cm,
  weight_kg,
  forehand_style,
  backhand_preference,
  down_the_line_style,
  cross_court_style,
  volley_level,
  serve_style,
  court_position,
  player_strength,
  player_weakness
`;

function getLatestPointsBySport(
  history: RankingHistory[],
  matchesById: Map<string, Match>
): Record<Sport, number | null> {
  const latest: Partial<Record<Sport, RankingHistory>> = {};

  for (const item of history) {
    const previous = latest[item.sport];

    const currentMatch = matchesById.get(item.match_id);
    const previousMatch = previous
      ? matchesById.get(previous.match_id)
      : undefined;

    if (!currentMatch) {
      continue;
    }

    if (!previous) {
      latest[item.sport] = item;
      continue;
    }

    if (!previousMatch) {
      latest[item.sport] = item;
      continue;
    }

    const currentTime = new Date(
      currentMatch.created_at
    ).getTime();

    const previousTime = new Date(
      previousMatch.created_at
    ).getTime();

    if (
      currentTime > previousTime ||
      (currentTime === previousTime &&
        item.match_id > previous.match_id)
    ) {
      latest[item.sport] = item;
    }
  }

  return {
    tennis: latest.tennis?.new_points ?? null,
    padel: latest.padel?.new_points ?? null,
    super_tiebreak:
      latest.super_tiebreak?.new_points ?? null,
  };
}

export default async function PlayerPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[#0c0f17]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,color-mix(in_srgb,var(--accent)_12%,transparent)_0%,transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_85%,rgba(79,45,127,0.18)_0%,transparent_45%)]" />
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-lg flex-col justify-center">
          <div className="mb-5">
            <Link
              href="/login"
              aria-label="Retour à la connexion"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass-strong relative overflow-hidden rounded-[28px] p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
                <LockIcon />
              </div>

              <p className="eyebrow mt-5">
                Accès au profil
              </p>

              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
                Profil joueur
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted">
                Tu dois être connecté pour accéder à ce profil.
              </p>

              <Link
                href="/login"
                className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.985]"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const [
    playerResult,
    matchPlayersResult,
    matchesResult,
    setsResult,
    profilesResult,
    championHistoryResult,
    rankingHistoryResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(PLAYER_PROFILE_FIELDS)
      .eq("id", id)
      .single(),

    supabase
      .from("match_players")
      .select("match_id, player_id, team"),

    supabase
      .from("matches")
      .select("id, sport, format, created_at")
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("sets")
      .select(
        "match_id, set_number, team_1_score, team_2_score"
      )
      .order("set_number", {
        ascending: true,
      }),

    supabase
      .from("profiles")
      .select(PLAYER_PROFILE_FIELDS),

    supabase
      .from("champion_history")
      .select(
        "id, player_id, sport, started_at, ended_at, matches_as_champion"
      )
      .eq("player_id", id)
      .order("started_at", {
        ascending: false,
      }),

    supabase
      .from("ranking_history")
      .select(
        `
          id,
          player_id,
          match_id,
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
      .eq("player_id", id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const player = playerResult.data as Player | null;

  if (playerResult.error || !player) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[#0c0f17]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,color-mix(in_srgb,var(--accent)_12%,transparent)_0%,transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_85%,rgba(79,45,127,0.18)_0%,transparent_45%)]" />
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-lg flex-col justify-center">
          <div className="mb-5">
            <Link
              href="/players"
              aria-label="Retour aux joueurs"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass-strong relative overflow-hidden rounded-[28px] p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-danger/8 blur-3xl" />

            <div className="relative">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-danger/15 bg-danger/10 text-danger">
                <AlertCircleIcon />
              </div>

              <p className="eyebrow mt-5">
                Profil indisponible
              </p>

              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
                Joueur introuvable
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted">
                Ce joueur n&apos;existe pas ou n&apos;est plus disponible.
              </p>

              <Link
                href="/players"
                className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.985]"
              >
                Retour aux joueurs
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (rankingHistoryResult.error) {
    console.error(rankingHistoryResult.error);
  }

  const matches = (matchesResult.data ?? []) as Match[];

  const matchesById = new Map<string, Match>();

  for (const match of matches) {
    matchesById.set(match.id, match);
  }

  /*
   * SOURCE DE VÉRITÉ DES POINTS
   * --------------------------------
   * Les points actuels viennent du dernier
   * ranking_history.new_points pour chaque sport.
   *
   * La chronologie est déterminée par matches.created_at,
   * et match_id sert de départage si deux matchs ont exactement
   * la même date.
   */
  const latestPoints = getLatestPointsBySport(
    (rankingHistoryResult.data ?? []) as RankingHistory[],
    matchesById
  );

  const playerWithCurrentPoints: Player = {
    ...player,

    points_tennis: latestPoints.tennis,
    points_padel: latestPoints.padel,
    points_super_tiebreak: latestPoints.super_tiebreak,
  };

  /*
   * Même principe pour la liste des joueurs.
   *
   * Les points affichés ne viennent pas de profiles.points_*.
   * Ils viennent du dernier ranking_history.new_points.
   */
  const allRankingHistoryResult = await supabase
    .from("ranking_history")
    .select(
      `
        id,
        player_id,
        match_id,
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
    .order("created_at", {
      ascending: false,
    });

  if (allRankingHistoryResult.error) {
    console.error(allRankingHistoryResult.error);
  }

  const historiesByPlayer = new Map<
    string,
    RankingHistory[]
  >();

  for (const item of (allRankingHistoryResult.data ??
    []) as RankingHistory[]) {
    const existing = historiesByPlayer.get(item.player_id);

    if (existing) {
      existing.push(item);
    } else {
      historiesByPlayer.set(item.player_id, [item]);
    }
  }

  const playersWithCurrentPoints = (
    profilesResult.data ?? []
  ).map((profile) => {
    const profilePlayer = profile as Player;

    const playerHistory =
      historiesByPlayer.get(profilePlayer.id) ?? [];

    const points = getLatestPointsBySport(
      playerHistory,
      matchesById
    );

    return {
      ...profilePlayer,
      points_tennis: points.tennis,
      points_padel: points.padel,
      points_super_tiebreak: points.super_tiebreak,
    };
  });

  return (
    <PlayerProfile
      player={playerWithCurrentPoints}
      players={playersWithCurrentPoints}
      matches={matches}
      matchPlayers={
        (matchPlayersResult.data ?? []) as MatchPlayer[]
      }
      sets={(setsResult.data ?? []) as SetScore[]}
      championHistory={
        (championHistoryResult.data ??
          []) as ChampionHistory[]
      }
      rankingHistory={
        (allRankingHistoryResult.data ?? []) as RankingHistory[]
      }
    />
  );
}