import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles:
    | {
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        points_tennis: number;
        points_padel: number;
      }
    | {
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        points_tennis: number;
        points_padel: number;
      }[]
    | null;
};

type Match = {
  id: string;
  sport: "tennis" | "padel";
  format: "singles" | "doubles";
  result_type: "competitive" | "friendly";
  created_at: string;
  match_players: MatchPlayer[];
};

type SetRow = {
  id: string;
  match_id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
  is_match_tiebreak: boolean;
};

function getProfile(profiles: MatchPlayer["profiles"]) {
  if (!profiles) return null;

  return Array.isArray(profiles)
    ? profiles[0] ?? null
    : profiles;
}

function getPlayerName(player: MatchPlayer) {
  const profile = getProfile(player.profiles);

  if (!profile) {
    return player.guest_name || "Invité";
  }

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile.username || "Joueur";
}

function getWinnerTeam(sets: SetRow[]) {
  let team1Wins = 0;
  let team2Wins = 0;

  for (const set of sets) {
    if (set.team_1_score > set.team_2_score) {
      team1Wins++;
    }

    if (set.team_2_score > set.team_1_score) {
      team2Wins++;
    }
  }

  if (team1Wins >= 2) return 1;
  if (team2Wins >= 2) return 2;

  return null;
}

function formatScore(sets: SetRow[]) {
  if (sets.length === 0) {
    return "Aucun résultat";
  }

  return sets
    .map((set) => `${set.team_1_score}-${set.team_2_score}`)
    .join("  ");
}

function getMatchDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function MatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            SmashBreakPoint
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Connexion requise
          </h1>

          <p className="mt-3 leading-6 text-muted">
            Connecte-toi pour retrouver tes matchs et ton historique.
          </p>

          <Link
            href="/login"
            className="mt-7 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 font-bold text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const currentUserId = user.id;

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      sport,
      format,
      result_type,
      created_at,
      match_players (
        player_id,
        team,
        guest_name,
        profiles (
          first_name,
          last_name,
          username,
          points_tennis,
          points_padel
        )
      )
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const matchIds = (matches ?? []).map(
    (match) => match.id
  );

  const { data: sets } =
    matchIds.length > 0
      ? await supabase
          .from("sets")
          .select(`
            id,
            match_id,
            set_number,
            team_1_score,
            team_2_score,
            is_match_tiebreak
          `)
          .in("match_id", matchIds)
          .order("set_number", {
            ascending: true,
          })
      : { data: [] };

  const { data: rankingHistory } =
    matchIds.length > 0
      ? await supabase
          .from("ranking_history")
          .select(`
            match_id,
            player_id,
            points_change
          `)
          .in("match_id", matchIds)
      : { data: [] };

  const typedMatches = (matches ?? []) as Match[];
  const typedSets = (sets ?? []) as SetRow[];

  function getMatchSets(matchId: string) {
    return typedSets.filter(
      (set) => set.match_id === matchId
    );
  }

  function getPointsChange(matchId: string) {
    const history = (rankingHistory ?? []).filter(
      (item) =>
        item.match_id === matchId &&
        item.player_id === currentUserId
    );

    if (history.length === 0) {
      return null;
    }

    return history.reduce(
      (total, item) => total + item.points_change,
      0
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">

        {/* HEADER */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Activité
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Mes matchs
            </h1>

            <p className="mt-2 text-sm leading-5 text-muted">
              Ton historique de rencontres
            </p>
          </div>

          <Link
            href="/matches/new"
            aria-label="Nouveau match"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-2xl font-light text-background transition-all duration-200 hover:brightness-95 active:scale-95"
          >
            +
          </Link>
        </header>

        {/* STATS RAPIDES */}
        {typedMatches.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Matchs
              </p>

              <p className="mt-2 text-2xl font-bold">
                {typedMatches.length}
              </p>

              <p className="mt-1 text-xs text-muted-2">
                enregistrés
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Compétitifs
              </p>

              <p className="mt-2 text-2xl font-bold">
                {
                  typedMatches.filter(
                    (match) =>
                      match.result_type === "competitive"
                  ).length
                }
              </p>

              <p className="mt-1 text-xs text-muted-2">
                matchs classés
              </p>
            </div>
          </div>
        )}

        {/* ERREUR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <p className="text-sm font-semibold text-danger">
              Impossible de charger tes matchs
            </p>

            <p className="mt-1 text-xs text-muted">
              {error.message}
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && typedMatches.length === 0 && (
          <div className="mt-8 rounded-3xl border border-border bg-surface p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path
                  strokeLinecap="round"
                  d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c-2.5 1.5-3.5 4-3.5 5.5s1 4 3.5 5.5"
                />
              </svg>
            </div>

            <p className="mt-5 text-lg font-bold">
              Aucun match pour le moment
            </p>

            <p className="mt-2 max-w-sm text-sm leading-5 text-muted">
              Enregistre ton premier résultat pour commencer
              à suivre ton classement.
            </p>

            <Link
              href="/matches/new"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 font-bold text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
            >
              Créer un match
            </Link>
          </div>
        )}

        {/* MATCHS */}
        <div className="mt-8 space-y-3">
          {typedMatches.map((match) => {
            const matchSets = getMatchSets(match.id);
            const winnerTeam = getWinnerTeam(matchSets);
            const pointsChange = getPointsChange(match.id);

            const team1 = match.match_players.filter(
              (player) => player.team === 1
            );

            const team2 = match.match_players.filter(
              (player) => player.team === 2
            );

            const userTeam = match.match_players.find(
              (player) => player.player_id === currentUserId
            )?.team;

            const userWon =
              winnerTeam !== null &&
              userTeam === winnerTeam;

            const userLost =
              winnerTeam !== null &&
              userTeam !== winnerTeam;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="group block overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-200 hover:border-white/10 hover:bg-surface-2 active:scale-[0.99]"
              >
                {/* TOP */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        match.sport === "tennis"
                          ? "bg-accent/10 text-accent"
                          : "bg-white/5 text-white"
                      }`}
                    >
                      {match.sport === "tennis" ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-5 w-5"
                        >
                          <circle cx="12" cy="12" r="8.5" />
                          <path
                            strokeLinecap="round"
                            d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c2.5 1.5 3.5 4 3.5 5.5s1 4 3.5 5.5"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-black">
                          P
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">
                          {match.sport === "tennis"
                            ? "Tennis"
                            : "Padel"}
                        </p>

                        <span className="text-muted-2">
                          ·
                        </span>

                        <p className="text-sm text-muted">
                          {match.format === "singles"
                            ? "Simple"
                            : "Double"}
                        </p>
                      </div>

                      <p className="mt-0.5 text-xs text-muted-2">
                        {getMatchDate(match.created_at)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      match.result_type === "competitive"
                        ? "bg-accent/10 text-accent"
                        : "bg-white/5 text-muted"
                    }`}
                  >
                    {match.result_type === "competitive"
                      ? "Compétitif"
                      : "Amical"}
                  </span>
                </div>

                {/* SCORE */}
                <div className="px-5 py-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                    {/* TEAM 1 */}
                    <div className="min-w-0">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-2">
                        Équipe 1
                      </p>

                      <div className="space-y-1.5">
                        {team1.map((player) => (
                          <p
                            key={
                              player.player_id ??
                              player.guest_name
                            }
                            className={`truncate text-sm font-semibold ${
                              userTeam === 1
                                ? "text-foreground"
                                : "text-muted"
                            }`}
                          >
                            {getPlayerName(player)}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* SCORE */}
                    <div className="min-w-22.5 text-center">
                      {matchSets.length > 0 ? (
                        <>
                          <p className="whitespace-nowrap text-lg font-black tracking-tight">
                            {formatScore(matchSets)}
                          </p>

                          {winnerTeam !== null && (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-2">
                              Équipe {winnerTeam}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold uppercase tracking-wide text-muted-2">
                            VS
                          </span>

                          <span className="mt-1 text-[10px] text-muted-2">
                            à jouer
                          </span>
                        </div>
                      )}
                    </div>

                    {/* TEAM 2 */}
                    <div className="min-w-0 text-right">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-2">
                        Équipe 2
                      </p>

                      <div className="space-y-1.5">
                        {team2.map((player) => (
                          <p
                            key={
                              player.player_id ??
                              player.guest_name
                            }
                            className={`truncate text-sm font-semibold ${
                              userTeam === 2
                                ? "text-foreground"
                                : "text-muted"
                            }`}
                          >
                            {getPlayerName(player)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RESULT */}
                  <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                    <div className="min-w-0">
                      {winnerTeam !== null ? (
                        <p
                          className={`text-sm font-bold ${
                            userWon
                              ? "text-success"
                              : userLost
                              ? "text-danger"
                              : "text-muted"
                          }`}
                        >
                          {userWon
                            ? "Victoire"
                            : userLost
                            ? "Défaite"
                            : `Équipe ${winnerTeam} gagnante`}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-muted">
                          Aucun résultat enregistré
                        </p>
                      )}

                      {pointsChange !== null && (
                        <p
                          className={`mt-1 text-xs font-semibold ${
                            pointsChange >= 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {pointsChange >= 0 ? "+" : ""}
                          {pointsChange} points
                        </p>
                      )}
                    </div>

                    <span className="ml-4 shrink-0 text-sm font-semibold text-muted-2 transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}