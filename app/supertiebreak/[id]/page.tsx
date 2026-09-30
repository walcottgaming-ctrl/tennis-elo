import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/src/supabase/server";


import SportIcon from "@/app/components/SportIcon";

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | null;
};

type Match = {
  id: string;
  created_by: string;
  created_at: string;
  sport: string;
  format: string;
  result_type: string;
  match_players: MatchPlayer[];
};

type MatchSet = {
  id: string;
  team_1_score: number;
  team_2_score: number;
  is_match_tiebreak: boolean;
};

type RankingHistory = {
  player_id: string;
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
};



function playerName(player: MatchPlayer | null) {
  if (!player) {
    return "Joueur";
  }

  if (player.guest_name?.trim()) {
    return player.guest_name.trim();
  }

  if (player.profiles) {
    const fullName = [
      player.profiles.first_name,
      player.profiles.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      (player.profiles.username
        ? `@${player.profiles.username}`
        : "Joueur")
    );
  }

  return "Joueur";
}

function playerInitials(player: MatchPlayer | null) {
  const name = playerName(player);

  const parts = name
    .replace(/^@/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "J";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function formatPointsChange(points: number) {
  if (points > 0) {
    return `+${points}`;
  }

  return `${points}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

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
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v2a3 3 0 0 0 3 3" />
      <path d="M16 6h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4" />
      <path d="M8 20h8" />
      <path d="M9 17h6" />
    </svg>
  );
}

function ChartIcon({
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
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-4 3 2 5-7" />
    </svg>
  );
}



function getPointDetails(history: RankingHistory) {
  const details = [
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
  ];

  return details.filter(
    (detail) => detail.value !== 0
  );
}

export default async function SuperTieBreakMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* --------------------------------
     MATCH
  -------------------------------- */

  const {
    data: matchData,
    error: matchError,
  } = await supabase
    .from("matches")
    .select(
      `
        id,
        created_by,
        created_at,
        sport,
        format,
        result_type,
        match_players (
          player_id,
          team,
          guest_name,
          profiles (
            id,
            username,
            first_name,
            last_name
          )
        )
      `
    )
    .eq("id", id)
    .eq("sport", "super_tiebreak")
    .single();

  if (matchError || !matchData) {
    notFound();
  }

  const match: Match = {
    id: matchData.id,
    created_by: matchData.created_by,
    created_at: matchData.created_at,
    sport: matchData.sport,
    format: matchData.format,
    result_type: matchData.result_type,
    match_players: (
      matchData.match_players ?? []
    ).map((player) => ({
      player_id: player.player_id,
      team: player.team,
      guest_name: player.guest_name,
      profiles: Array.isArray(player.profiles)
        ? player.profiles[0] ?? null
        : player.profiles ?? null,
    })),
  };

  if (match.match_players.length !== 2) {
    notFound();
  }

  /* --------------------------------
     SET / SCORE
  -------------------------------- */

  const {
    data: setData,
    error: setError,
  } = await supabase
    .from("sets")
    .select(
      `
        id,
        team_1_score,
        team_2_score,
        is_match_tiebreak
      `
    )
    .eq("match_id", id)
    .eq("set_number", 1)
    .eq("is_match_tiebreak", true)
    .single();

  /* --------------------------------
     RESULT NOT YET RECORDED
  -------------------------------- */

  if (setError || !setData) {
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
            href="/supertiebreak"
            aria-label="Retour au Super Tie-Break"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3.5 py-2 text-xs font-semibold text-muted transition-all hover:border-white/15 hover:bg-white/7 hover:text-foreground active:scale-[0.98]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Super Tie-Break
          </Link>

          <section className="glass-strong mt-6 overflow-hidden rounded-[30px] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accent/15 bg-accent/10 text-accent shadow-[0_0_24px_var(--accent-glow)]">
                <SportIcon
                  sport="super_tiebreak"
                  className="h-5 w-5"
                />
              </div>

              <div>
                <p className="eyebrow">
                  Super Tie-Break
                </p>

                <h1 className="mt-1 font-display text-xl font-bold">
                  Résultat non enregistré
                </h1>

                <p className="mt-2 text-sm leading-5 text-muted">
                  Le score de ce Super Tie-Break
                  n&apos;a pas encore été enregistré.
                </p>
              </div>
            </div>

            {match.created_by === user.id && (
              <Link
                href={`/supertiebreak/${id}/result`}
                className="mt-6 flex items-center justify-between rounded-2xl bg-accent px-4 py-3.5 font-semibold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all hover:brightness-105 active:scale-[0.99]"
              >
                <span>
                  Enregistrer le résultat
                </span>

                <ChevronRightIcon className="h-5 w-5" />
              </Link>
            )}
          </section>
        </div>
      </main>
    );
  }

  const set: MatchSet = {
    id: setData.id,
    team_1_score: setData.team_1_score,
    team_2_score: setData.team_2_score,
    is_match_tiebreak:
      setData.is_match_tiebreak,
  };

  /* --------------------------------
     RANKING HISTORY
  -------------------------------- */

  const {
    data: historyData,
  } = await supabase
    .from("ranking_history")
    .select(
      `
        player_id,
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
        amortisseur_tiebreak
      `
    )
    .eq("match_id", id)
    .eq("sport", "super_tiebreak");


  const history =
    (historyData ?? []) as RankingHistory[];

  

  /* --------------------------------
     PLAYERS
  -------------------------------- */

  const team1 = match.match_players.find(
    (player) => player.team === 1
  );

  const team2 = match.match_players.find(
    (player) => player.team === 2
  );

  if (!team1 || !team2) {
    notFound();
  }

  const team1Won =
    set.team_1_score > set.team_2_score;

  const winner = team1Won ? team1 : team2;
  const loser = team1Won ? team2 : team1;

  

  const winnerHistory = history.find(
    (entry) =>
      entry.player_id === winner.player_id
  );

  const loserHistory = history.find(
    (entry) =>
      entry.player_id === loser.player_id
  );

  const isCompetitive =
    match.result_type === "competitive";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-6 text-foreground sm:px-5">
      {/* BACKGROUND */}

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
            href="/supertiebreak"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3.5 py-2 text-xs font-semibold text-muted transition-all hover:border-white/15 hover:bg-white/7 hover:text-foreground active:scale-[0.98]"
          >
            <ArrowLeftIcon className="h-4 w-4" />

            <span>
              Super Tie-Break
            </span>
          </Link>

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent shadow-[0_0_28px_var(--accent-glow)]">
            <SportIcon
              sport="super_tiebreak"
              className="h-5 w-5"
            />
          </div>
        </header>

        {/* META */}

        <section className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="eyebrow">
              Super Tie-Break
            </span>

            <span className="h-1 w-1 rounded-full bg-white/20" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
              {match.format === "doubles"
                ? "Double"
                : "Simple"}
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
                isCompetitive
                  ? "border-accent/15 bg-accent/6 text-accent"
                  : "border-white/8 bg-white/4 text-muted"
              }`}
            >
              {isCompetitive
                ? "Compétitif"
                : "Amical"}
            </span>
          </div>
        </section>

        {/* SCORE */}

        <section className="relative overflow-hidden rounded-[30px] border border-accent/15 bg-accent/5 p-5 shadow-[0_0_40px_var(--accent-glow)] sm:p-6">
          <div
            className="pointer-events-none absolute left-1/2 -top-20 h-52 w-52 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-white/8" />

              <p className="eyebrow text-accent">
                Résultat
              </p>

              <div className="h-px w-8 bg-white/8" />
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {/* PLAYER 1 */}

              <div className="min-w-0 text-center">
                <div
                  className={`mx-auto grid h-12 w-12 place-items-center rounded-full border ${
                    team1Won
                      ? "border-accent/25 bg-accent/10 text-accent shadow-[0_0_18px_var(--accent-glow)]"
                      : "border-white/8 bg-white/5 text-muted"
                  }`}
                >
                  <span className="text-xs font-bold">
                    {playerInitials(team1)}
                  </span>
                </div>

                <p
                  className={`mt-3 truncate text-sm font-semibold ${
                    team1Won
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {playerName(team1)}
                </p>

                <p
                  className={`mt-3 font-display text-6xl font-bold leading-none tracking-[-0.06em] ${
                    team1Won
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {set.team_1_score}
                </p>

                {team1Won && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1">
                    <TrophyIcon className="h-3 w-3 text-accent" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent">
                      Victoire
                    </span>
                  </div>
                )}
              </div>

              {/* VS */}

              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-px bg-white/8" />

                <span className="font-display text-xs font-semibold text-muted">
                  VS
                </span>

                <div className="h-8 w-px bg-white/8" />
              </div>

              {/* PLAYER 2 */}

              <div className="min-w-0 text-center">
                <div
                  className={`mx-auto grid h-12 w-12 place-items-center rounded-full border ${
                    !team1Won
                      ? "border-accent/25 bg-accent/10 text-accent shadow-[0_0_18px_var(--accent-glow)]"
                      : "border-white/8 bg-white/5 text-muted"
                  }`}
                >
                  <span className="text-xs font-bold">
                    {playerInitials(team2)}
                  </span>
                </div>

                <p
                  className={`mt-3 truncate text-sm font-semibold ${
                    !team1Won
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {playerName(team2)}
                </p>

                <p
                  className={`mt-3 font-display text-6xl font-bold leading-none tracking-[-0.06em] ${
                    !team1Won
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {set.team_2_score}
                </p>

                {!team1Won && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1">
                    <TrophyIcon className="h-3 w-3 text-accent" />

                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent">
                      Victoire
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Premier à 10 points avec 2 points
                d&apos;écart
              </p>
            </div>
          </div>
        </section>

        {/* PLAYERS */}

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
            {[team1, team2].map(
              (player, index) => {
                const isWinner =
                  (index === 0 && team1Won) ||
                  (index === 1 && !team1Won);

                const isCurrentUser =
                  player.player_id === user.id;

                return (
                  <div
                    key={`${player.player_id ?? player.guest_name}-${index}`}
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
                          {playerInitials(player)}
                        </div>

                        <div className="min-w-0">
                          <p className="eyebrow">
                            Joueur {index + 1}
                          </p>

                          <p
                            className={`mt-1 truncate text-sm font-semibold ${
                              isCurrentUser
                                ? "text-accent"
                                : "text-foreground"
                            }`}
                          >
                            {playerName(player)}
                          </p>
                        </div>

                        {isCurrentUser && (
                          <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-accent">
                            Toi
                          </span>
                        )}
                      </div>

                      {isWinner && (
                        <div className="flex shrink-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">
                          <TrophyIcon className="h-3.5 w-3.5" />

                          Gagnant
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        

        {/* RANKING IMPACT */}

        {winnerHistory && loserHistory && (
          <section className="glass-strong relative overflow-hidden rounded-[30px] p-5 sm:p-6">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl"
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

                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <TrophyIcon className="h-5 w-5" />
                </div>
              </div>

              {(() => {
                const userHistory =
                  history.find(
                    (entry) =>
                      entry.player_id ===
                      user.id
                  );

                if (!userHistory) {
                  return (
                    <div className="mt-5 rounded-2xl border border-white/7 bg-white/3 px-4 py-4 text-sm text-muted">
                      Aucun impact de classement
                      enregistré pour ton profil.
                    </div>
                  );
                }

                const positive =
                  userHistory.points_change >= 0;

                return (
                  <>
                    <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                      <div>
                        <p className="eyebrow">
                          Avant
                        </p>

                        <p className="mt-1 font-display text-3xl font-bold tracking-tight">
                          {userHistory.old_points}
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
                          {userHistory.new_points}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <div
                        className={`rounded-full border px-4 py-2 ${
                          positive
                            ? "border-accent/20 bg-accent/10 text-accent"
                            : "border-danger/20 bg-danger/8 text-danger"
                        }`}
                      >
                        <span className="font-display text-2xl font-bold">
                          {formatPointsChange(
                            userHistory.points_change
                          )}
                        </span>

                        <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-[0.14em]">
                          points
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {/* POINT CALCULATION */}

        {(() => {
          const userHistory =
            history.find(
              (entry) =>
                entry.player_id === user.id
            );

          if (!userHistory) {
            return null;
          }

          const pointDetails =
            getPointDetails(userHistory);

          if (!pointDetails.length) {
            return null;
          }

          return (
            <section className="glass rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4">
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

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/4 text-muted">
                  <ChartIcon className="h-4 w-4" />
                </div>
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
                          {formatPointsChange(
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
                    userHistory.points_change >=
                    0
                      ? "text-accent"
                      : "text-danger"
                  }`}
                >
                  {formatPointsChange(
                    userHistory.points_change
                  )}
                </span>
              </div>
            </section>
          );
        })()}

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
                Consulte ta position et ta progression.
              </p>
            </div>

            <ChevronRightIcon className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/supertiebreak"
            className="group flex items-center gap-4 rounded-3xl border border-white/8 bg-white/3.5 px-4 py-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.99]"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/8 bg-white/5 text-muted">
              <ArrowLeftIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Retour aux Super Tie-Break
              </p>

              <p className="mt-0.5 text-xs text-muted">
                Revenir à ton historique.
              </p>
            </div>

            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-2 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}