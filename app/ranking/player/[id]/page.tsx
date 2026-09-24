import Link from "next/link";
import { createClient } from "@/src/supabase/server";
import PlayerProfile from "./PlayerProfile";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  points_tennis: number | null;
  points_padel: number | null;
  points_super_tiebreak: number | null;
};

type Match = {
  id: string;
  sport: "tennis" | "padel" | "super_tiebreak";
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
  sport: "tennis" | "padel" | "super_tiebreak";
  started_at: string;
  ended_at: string | null;
  matches_as_champion: number;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5m6 6-6-6 6-6"
      />
    </svg>
  );
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
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold">
            Profil joueur
          </h1>

          <p className="mt-3 text-sm text-muted">
            Tu dois être connecté pour accéder à ce profil.
          </p>

          <Link
            href="/login"
            className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background"
          >
            Se connecter
          </Link>
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
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, username, avatar_url, points_tennis, points_padel, points_super_tiebreak"
      )
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
      .select(
        "id, first_name, last_name, username, avatar_url, points_tennis, points_padel, points_super_tiebreak"
      ),

    supabase
      .from("champion_history")
      .select(
        "id, player_id, sport, started_at, ended_at, matches_as_champion"
      )
      .eq("player_id", id)
      .order("started_at", {
        ascending: false,
      }),
  ]);

  const player = playerResult.data as Player | null;

  if (playerResult.error || !player) {
    return (
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <Link
            href="/players"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted"
          >
            <ArrowLeftIcon />
            Retour aux joueurs
          </Link>

          <div className="mt-6 rounded-3xl border border-border bg-surface p-7">
            <h1 className="text-2xl font-bold">
              Joueur introuvable
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              Ce joueur n&apos;existe pas ou n&apos;est plus disponible.
            </p>

            <Link
              href="/players"
              className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background"
            >
              Retour aux joueurs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PlayerProfile
      player={player}
      players={(profilesResult.data ?? []) as Player[]}
      matches={(matchesResult.data ?? []) as Match[]}
      matchPlayers={
        (matchPlayersResult.data ?? []) as MatchPlayer[]
      }
      sets={(setsResult.data ?? []) as SetScore[]}
      championHistory={
        (championHistoryResult.data ??
          []) as ChampionHistory[]
      }
    />
  );
}