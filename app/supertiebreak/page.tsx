import Link from "next/link";
import { redirect } from "next/navigation";

import BottomNav from "@/app/components/BottomNav";
import SportIcon from "@/app/components/SportIcon";
import { createClient } from "@/src/supabase/server";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
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

type RankingHistory = {
  id: string;
  match_id: string;
  player_id: string;
  sport: "super_tiebreak";
  new_points: number | null;
};

type RankingPlayer = Profile & {
  points_super_tiebreak: number;
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
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}

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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v2a3 3 0 0 0 3 3" />
      <path d="M16 6h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4" />
      <path d="M8 20h8" />
      <path d="M9 17h6" />
    </svg>
  );
}

function FlameIcon({
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
      <path d="M12.5 3.5c.8 3.1-1.7 4.6-3.2 6.5-1.5 1.8-1.9 3.7-.8 5.6 1 1.7 2.8 2.7 4.7 2.7 3.5 0 6.3-2.7 6.3-6.1 0-3.1-2-5.5-4.3-7.2.2 2.1-.8 3.2-1.9 4.1.2-2.5-.3-4.3-.8-5.6Z" />
      <path d="M10.4 17.1c-.7 1.1-.5 2.4.4 3.3" />
    </svg>
  );
}

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
      "id, username, full_name, first_name"
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/profile");
  }

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, first_name"
    );

  const { data: rankingHistory } = await supabase
    .from("ranking_history")
    .select(
      "id, match_id, player_id, sport, new_points"
    )
    .eq("sport", "super_tiebreak");

  const { data: rankingMatches } = await supabase
    .from("matches")
    .select("id, created_at")
    .eq("sport", "super_tiebreak")
    .eq("result_type", "competitive")
    .order("created_at", {
      ascending: true,
    });

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
            first_name
          )
        )
      `
    )
    .eq("sport", "super_tiebreak")
    .eq("result_type", "competitive")
    .order("created_at", { ascending: false })
    .limit(5);

  /*
   * Source de vérité :
   * ranking_history.new_points
   *
   * On cherche le dernier match de chaque joueur
   * en fonction de matches.created_at.
   */
  const matchById = new Map(
    (rankingMatches ?? []).map((match) => [
      match.id,
      match,
    ])
  );

  const pointsByPlayer = new Map<
    string,
    RankingHistory
  >();

  for (const history of (rankingHistory ??
    []) as RankingHistory[]) {
    if (history.new_points === null) {
      continue;
    }

    const currentMatch = matchById.get(
      history.match_id
    );

    if (!currentMatch) {
      continue;
    }

    const previous = pointsByPlayer.get(
      history.player_id
    );

    if (!previous) {
      pointsByPlayer.set(
        history.player_id,
        history
      );
      continue;
    }

    const previousMatch = matchById.get(
      previous.match_id
    );

    if (!previousMatch) {
      pointsByPlayer.set(
        history.player_id,
        history
      );
      continue;
    }

    const currentMatchTime =
      new Date(
        currentMatch.created_at
      ).getTime();

    const previousMatchTime =
      new Date(
        previousMatch.created_at
      ).getTime();

    if (
      currentMatchTime >
        previousMatchTime ||
      (
        currentMatchTime ===
          previousMatchTime &&
        currentMatch.id >
          previousMatch.id
      )
    ) {
      pointsByPlayer.set(
        history.player_id,
        history
      );
    }
  }

  /*
   * Classement actuel.
   *
   * Joueur sans historique :
   * 1000 points.
   */
  const rankedPlayers: RankingPlayer[] = (
    allProfiles ?? []
  )
    .map((player) => ({
      ...player,
      points_super_tiebreak:
        pointsByPlayer.get(player.id)
          ?.new_points ?? 1000,
    }))
    .sort(
      (a, b) =>
        b.points_super_tiebreak -
        a.points_super_tiebreak
    );

  const topPlayers = rankedPlayers.slice(0, 3);

  const currentPoints =
    pointsByPlayer.get(user.id)
      ?.new_points ?? 1000;

  const playerRank =
    rankedPlayers.findIndex(
      (player) => player.id === user.id
    ) + 1;

  const matches: Match[] = (
    recentMatches ?? []
  ).map((match) => ({
    id: match.id,
    created_at: match.created_at,
    match_players: (
      match.match_players ?? []
    ).map((player) => ({
      player_id: player.player_id,
      team: player.team,
      guest_name: player.guest_name,
      profiles: Array.isArray(player.profiles)
        ? player.profiles[0] ?? null
        : player.profiles ?? null,
    })),
  }));

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />

        <div className="absolute -right-45 top-[30%] h-96 w-96 rounded-full bg-indigo-500/8 blur-[130px]" />

        <div className="absolute -bottom-45 left-[20%] h-96 w-96 rounded-full bg-violet-500/8 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-5">
          <Link
            href="/dashboard"
            className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white/6 bg-white/3 px-3.5 text-xs font-medium text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-foreground active:scale-[0.98]"
          >
            <ArrowLeftIcon className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Accueil
          </Link>

          <div className="mt-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[17px] border border-accent/20 bg-accent/10 text-accent shadow-[0_0_30px_var(--accent-glow)]">
                    <div className="absolute inset-0 bg-accent/5 blur-xl" />

                    <SportIcon
                      sport="super_tiebreak"
                      className="relative h-6 w-6"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="eyebrow">
                      Mode de jeu
                    </p>

                    <h1 className="mt-1 font-display text-[28px] font-bold tracking-tight sm:text-3xl">
                      Super Tie-Break
                    </h1>
                  </div>
                </div>

                <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
                  Des duels courts, un classement indépendant.
                </p>
              </div>

              <div className="shrink-0 rounded-[20px] border border-accent/15 bg-accent/6 px-3.5 py-3 text-right backdrop-blur-xl">
                <p className="eyebrow">
                  Ton score
                </p>

                <p className="mt-1 font-display text-2xl font-bold leading-none tracking-tight text-accent">
                  {currentPoints.toLocaleString(
                    "fr-FR"
                  )}
                </p>

                <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                  points
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero CTA */}
        <section className="group relative mb-4 overflow-hidden rounded-[30px] border border-white/10 bg-[#171920]/85 p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-[90px] transition-all duration-500 group-hover:bg-accent/15"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-sm">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/6 px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />

                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-accent">
                    Nouveau duel
                  </span>
                </div>

                <h2 className="mt-4 font-display text-[25px] font-semibold leading-tight tracking-tight">
                  Prêt pour un
                  <br />
                  <span className="text-accent">
                    10 points ?
                  </span>
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted">
                  Lance un Super Tie-Break et fais évoluer ton classement
                  uniquement dans ce mode.
                </p>
              </div>

              <div className="relative hidden h-16 w-16 shrink-0 place-items-center rounded-[22px] border border-accent/15 bg-accent/8 text-accent sm:grid">
                <div className="absolute inset-0 rounded-[22px] bg-accent/5 blur-xl" />

                <FlameIcon className="relative h-7 w-7" />
              </div>
            </div>

            <Link
              href="/supertiebreak/new"
              className="group/button mt-6 flex min-h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_12px_35px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_15px_42px_var(--accent-glow)] active:scale-[0.985]"
            >
              <span>
                Nouveau Super Tie-Break
              </span>

              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0b0d13]/10">
                <ArrowRightIcon className="transition-transform duration-200 group-hover/button:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>

        {/* Quick stats */}
        <section className="mb-7 grid grid-cols-3 gap-2.5">
          <div className="rounded-[20px] border border-white/6 bg-white/3.5 px-3 py-4 text-center backdrop-blur-xl">
            <p className="font-display text-lg font-bold leading-none">
              10
            </p>

            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              Points
            </p>
          </div>

          <div className="rounded-[20px] border border-white/6 bg-white/3.5 px-3 py-4 text-center backdrop-blur-xl">
            <p className="font-display text-lg font-bold leading-none">
              {topPlayers.length}
            </p>

            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              Top joueurs
            </p>
          </div>

          <div className="rounded-[20px] border border-white/6 bg-white/3.5 px-3 py-4 text-center backdrop-blur-xl">
            <p className="font-display text-lg font-bold leading-none">
              {matches.length}
            </p>

            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              Récents
            </p>
          </div>
        </section>

        {/* Ranking */}
        <section className="mb-7">
          <div className="mb-3.5 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">
                Classement
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Super Tie-Break
              </h2>
            </div>

            <Link
              href="/ranking"
              className="group flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent transition-colors hover:text-foreground"
            >
              Voir tout
              <ArrowRightIcon className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/3.5 backdrop-blur-xl">
            {topPlayers.length === 0 ? (
              <div className="p-6 text-sm text-muted">
                Aucun joueur classé pour le moment.
              </div>
            ) : (
              topPlayers.map((player, index) => {
                const name =
                  player.first_name ||
                  player.full_name ||
                  player.username ||
                  "Joueur";

                const isCurrentUser =
                  player.id === user.id;

                return (
                  <div
                    key={player.id}
                    className={`group relative flex items-center gap-3.5 px-4 py-4 transition-all duration-200 sm:px-5 ${
                      index <
                      topPlayers.length - 1
                        ? "border-b border-white/5"
                        : ""
                    } ${
                      isCurrentUser
                        ? "bg-accent/5"
                        : "hover:bg-white/4"
                    }`}
                  >
                    {isCurrentUser && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-0.5 bg-accent shadow-[0_0_14px_var(--accent)]"
                      />
                    )}

                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${
                        index === 0
                          ? "border border-accent/25 bg-accent/10 text-accent shadow-[0_0_18px_var(--accent-glow)]"
                          : "border border-white/6 bg-white/4 text-muted"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p
                          className={`truncate text-sm font-semibold ${
                            isCurrentUser
                              ? "text-accent"
                              : ""
                          }`}
                        >
                          {name}
                        </p>

                        {isCurrentUser && (
                          <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-accent">
                            Toi
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[10px] text-muted">
                        Classement Super Tie-Break
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-display text-base font-bold tabular-nums ${
                          isCurrentUser
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        {player.points_super_tiebreak.toLocaleString(
                          "fr-FR"
                        )}
                      </p>

                      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                        pts
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {playerRank > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-muted">
              <TrophyIcon className="h-3.5 w-3.5 text-accent" />

              <span>
                Tu es actuellement{" "}
                <span className="font-semibold text-foreground">
                  #{playerRank}
                </span>{" "}
                dans le classement.
              </span>
            </div>
          )}
        </section>

        {/* Recent matches */}
        <section>
          <div className="mb-3.5">
            <p className="eyebrow">
              Activité
            </p>

            <div className="mt-1 flex items-end justify-between gap-3">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Derniers duels
              </h2>

              {matches.length > 0 && (
                <span className="text-[10px] text-muted">
                  {matches.length} récent
                  {matches.length > 1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="relative overflow-hidden rounded-[28px] border border-dashed border-white/8 bg-white/3.5 p-6 backdrop-blur-xl">
              <div
                aria-hidden="true"
                className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-accent/7 blur-[60px]"
              />

              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/15 bg-accent/8 text-accent">
                  <TrophyIcon />
                </div>

                <p className="mt-5 font-display font-semibold">
                  Aucun Super Tie-Break pour le moment.
                </p>

                <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">
                  Lance ton premier duel pour commencer ton classement.
                </p>

                <Link
                  href="/supertiebreak/new"
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-xs font-bold text-[#0b0d13] shadow-[0_8px_25px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
                >
                  Commencer un duel
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {matches.map((match, index) => {
                const team1 =
                  match.match_players.filter(
                    (player) =>
                      player.team === 1
                  );

                const team2 =
                  match.match_players.filter(
                    (player) =>
                      player.team === 2
                  );

                const team1Names = team1
                  .map(
                    (player) =>
                      player.profiles
                        ?.first_name ||
                      player.profiles
                        ?.full_name ||
                      player.profiles
                        ?.username ||
                      player.guest_name ||
                      "Invité"
                  )
                  .join(" / ");

                const team2Names = team2
                  .map(
                    (player) =>
                      player.profiles
                        ?.first_name ||
                      player.profiles
                        ?.full_name ||
                      player.profiles
                        ?.username ||
                      player.guest_name ||
                      "Invité"
                  )
                  .join(" / ");

                return (
                  <Link
                    key={match.id}
                    href={`/supertiebreak/${match.id}`}
                    className="group relative block overflow-hidden rounded-3xl border border-white/6 bg-white/3.5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-accent/12 hover:bg-white/5 active:scale-[0.99]"
                  >
                    {index === 0 && (
                      <div
                        aria-hidden="true"
                        className="absolute right-0 top-0 h-20 w-20 rounded-full bg-accent/5 blur-2xl transition-all duration-300 group-hover:bg-accent/10"
                      />
                    )}

                    <div className="relative flex items-center gap-3.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/10 bg-accent/7 text-accent">
                        <SportIcon
                          sport="super_tiebreak"
                          className="h-4 w-4"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">
                            Duel
                          </span>

                          {index === 0 && (
                            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted">
                              Récent
                            </span>
                          )}
                        </div>

                        <div className="mt-2">
                          <p className="truncate text-sm font-semibold">
                            {team1Names}
                          </p>

                          <div className="my-1.5 flex items-center gap-2">
                            <div className="h-px w-5 bg-accent/30" />

                            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                              vs
                            </span>

                            <div className="h-px w-5 bg-white/8" />
                          </div>

                          <p className="truncate text-sm text-muted">
                            {team2Names}
                          </p>
                        </div>
                      </div>

                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/6 bg-white/3 text-muted transition-all duration-200 group-hover:border-accent/20 group-hover:bg-accent/8 group-hover:text-accent">
                        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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