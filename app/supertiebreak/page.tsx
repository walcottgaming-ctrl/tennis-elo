import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/supabase/server";
import BottomNav from "@/app/components/BottomNav";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  points_super_tiebreak: number;
};

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | null;
};

type Match = {
  id: string;
  created_at: string;
  match_players: MatchPlayer[];
};

type RankingPlayer = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  points_super_tiebreak: number;
};

export default async function SuperTiebreakPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, first_name, points_super_tiebreak"
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/profile");
  }

  const { data: ranking } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, first_name, points_super_tiebreak"
    )
    .order("points_super_tiebreak", {
      ascending: false,
    })
    .limit(3);

  const { data: recentMatches } = await supabase
    .from("matches")
    .select(
      `
        id,
        created_at,
        match_players (
          player_id,
          team,
          guest_name,
          profiles (
            id,
            username,
            full_name,
            first_name,
            points_super_tiebreak
          )
        )
      `
    )
    .eq("sport", "super_tiebreak")
    .eq("result_type", "competitive")
    .order("created_at", { ascending: false })
    .limit(5);

  const topPlayers = (ranking ?? []) as RankingPlayer[];

  const matches: Match[] = (recentMatches ?? []).map((match) => ({
    id: match.id,
    created_at: match.created_at,
    match_players: (match.match_players ?? []).map((player) => ({
      player_id: player.player_id,
      team: player.team,
      guest_name: player.guest_name,
      profiles: Array.isArray(player.profiles)
        ? player.profiles[0] ?? null
        : player.profiles ?? null,
    })),
  }));

  const playerRank =
    topPlayers.findIndex((player) => player.id === user.id) + 1;

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        {/* Header */}
        <header className="mb-7">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path
                d="M15 18 9 12l6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Accueil
          </Link>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Mode de jeu
          </p>

          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Super Tie-Break
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-5 text-muted">
                Des duels courts, un classement indépendant.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-border bg-surface-2 px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Ton score
              </p>

              <p className="mt-0.5 text-xl font-bold tracking-tight">
                {profile.points_super_tiebreak}
              </p>
            </div>
          </div>
        </header>

        {/* Main CTA */}
        <section className="mb-5 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Nouveau duel
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-tight">
                Prêt pour un 10 points ?
              </h2>

              <p className="mt-2 text-sm leading-5 text-muted">
                Lance un Super Tie-Break et fais évoluer ton classement
                uniquement dans ce mode.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path
                  strokeLinecap="round"
                  d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c-2.5 1.5-3.5 4-3.5 5.5s-1 4-3.5 5.5"
                />
              </svg>
            </div>
          </div>

          <Link
            href="/supertiebreak/new"
            className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            + Nouveau Super Tie-Break
          </Link>
        </section>

        {/* Ranking */}
        <section className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Classement
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Super Tie-Break
              </h2>
            </div>

            <Link
              href="/supertiebreak/ranking"
              className="text-sm font-semibold text-accent transition-colors hover:text-foreground"
            >
              Voir tout
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            {topPlayers.length === 0 ? (
              <div className="p-5 text-sm text-muted">
                Aucun joueur classé pour le moment.
              </div>
            ) : (
              topPlayers.map((player, index) => {
                const name =
                  player.first_name ||
                  player.full_name ||
                  player.username ||
                  "Joueur";

                const isCurrentUser = player.id === user.id;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 px-4 py-4 ${
                      index < topPlayers.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          isCurrentUser ? "text-accent" : ""
                        }`}
                      >
                        {name}
                        {isCurrentUser ? " · Toi" : ""}
                      </p>

                      <p className="mt-0.5 text-xs text-muted">
                        Super Tie-Break
                      </p>
                    </div>

                    <p className="text-base font-bold">
                      {player.points_super_tiebreak}
                      <span className="ml-1 text-xs font-medium text-muted">
                        pts
                      </span>
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {playerRank > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Ton rang apparaît ici si tu fais partie du top 3.
            </p>
          )}
        </section>

        {/* Recent matches */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Activité
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Derniers Super Tie-Breaks
              </h2>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold">
                Aucun Super Tie-Break pour le moment.
              </p>

              <p className="mt-1 text-sm leading-5 text-muted">
                Lance ton premier duel pour commencer ton classement.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const team1 = match.match_players.filter(
                  (player) => player.team === 1
                );

                const team2 = match.match_players.filter(
                  (player) => player.team === 2
                );

                const team1Names = team1
                  .map(
                    (player) =>
                      player.profiles?.first_name ||
                      player.profiles?.full_name ||
                      player.profiles?.username ||
                      player.guest_name ||
                      "Invité"
                  )
                  .join(" / ");

                const team2Names = team2
                  .map(
                    (player) =>
                      player.profiles?.first_name ||
                      player.profiles?.full_name ||
                      player.profiles?.username ||
                      player.guest_name ||
                      "Invité"
                  )
                  .join(" / ");

                return (
                  <Link
                    key={match.id}
                    href={`/supertiebreak/${match.id}`}
                    className="block rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-white/15 hover:bg-surface-2 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {team1Names}
                        </p>

                        <p className="mt-1 truncate text-sm text-muted">
                          {team2Names}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m9 6 6 6-6 6"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}