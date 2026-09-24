"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";
import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import { useSportMode } from "@/app/context/SportModeContext";

type Sport = "tennis" | "padel" | "super_tiebreak";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | Profile[] | null;
};

type Match = {
  id: string;
  sport: Sport;
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

type RankingHistoryRow = {
  match_id: string;
  player_id: string;
  points_change: number;
};

function getProfile(player: MatchPlayer) {
  if (!player.profiles) {
    return null;
  }

  return Array.isArray(player.profiles)
    ? player.profiles[0] ?? null
    : player.profiles;
}

function getPlayerName(player: MatchPlayer) {
  if (player.guest_name) {
    return player.guest_name;
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
    .join(" ");

  return fullName || profile.username || "Joueur";
}

function getSportLabel(sport: Sport) {
  if (sport === "tennis") {
    return "Tennis";
  }

  if (sport === "padel") {
    return "Padel";
  }

  return "Super Tie-Break";
}

function getFormatLabel(
  format: "singles" | "doubles"
) {
  return format === "singles" ? "Simple" : "Double";
}

function getWinnerTeam(
  match: Match,
  matchSets: SetRow[]
) {
  if (matchSets.length === 0) {
    return null;
  }

  if (match.sport === "super_tiebreak") {
    const set = matchSets[0];

    if (
      set.team_1_score ===
      set.team_2_score
    ) {
      return null;
    }

    return set.team_1_score >
      set.team_2_score
      ? 1
      : 2;
  }

  let team1Sets = 0;
  let team2Sets = 0;

  for (const set of matchSets) {
    if (set.is_match_tiebreak) {
      continue;
    }

    if (
      set.team_1_score >
      set.team_2_score
    ) {
      team1Sets += 1;
    } else if (
      set.team_2_score >
      set.team_1_score
    ) {
      team2Sets += 1;
    }
  }

  if (team1Sets >= 2) {
    return 1;
  }

  if (team2Sets >= 2) {
    return 2;
  }

  return null;
}

function formatScore(
  match: Match,
  matchSets: SetRow[]
) {
  if (matchSets.length === 0) {
    return "—";
  }

  if (match.sport === "super_tiebreak") {
    const set = matchSets[0];

    return `${set.team_1_score} - ${set.team_2_score}`;
  }

  return [...matchSets]
    .sort(
      (a, b) =>
        a.set_number - b.set_number
    )
    .map(
      (set) =>
        `${set.team_1_score}-${set.team_2_score}`
    )
    .join("  ");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function MatchesPage() {
  const { mode } = useSportMode();

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [sets, setSets] =
    useState<SetRow[]>([]);

  const [rankingHistory, setRankingHistory] =
    useState<RankingHistoryRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const {
        data: playerMatches,
        error: playerMatchesError,
      } = await supabase
        .from("match_players")
        .select("match_id")
        .eq("player_id", user.id);

      if (playerMatchesError) {
        console.error(
          "Erreur récupération des matchs du joueur :",
          playerMatchesError
        );

        setLoading(false);
        return;
      }

      const playerMatchIds =
        (playerMatches ?? []).map(
          (row) => row.match_id
        );

      if (playerMatchIds.length === 0) {
        setLoading(false);
        return;
      }

      const {
        data: matchesData,
        error: matchesError,
      } = await supabase
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
              username
            )
          )
        `)
        .in("id", playerMatchIds)
        .order("created_at", {
          ascending: false,
        });

      if (matchesError) {
        setErrorMessage(
          matchesError.message
        );

        setLoading(false);
        return;
      }

      const typedMatches =
        (matchesData ?? []) as Match[];

      setMatches(typedMatches);

      const matchIds =
        typedMatches.map(
          (match) => match.id
        );

      if (matchIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: setsData } =
        await supabase
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
          });

      setSets(
        (setsData ?? []) as SetRow[]
      );

      /*
       * ranking_history reste la source
       * des variations de points du match.
       *
       * On affiche points_change ici :
       * ce n'est PAS le classement actuel,
       * mais uniquement l'évolution générée
       * par ce match.
       */
      const { data: historyData } =
        await supabase
          .from("ranking_history")
          .select(`
            match_id,
            player_id,
            points_change
          `)
          .in("match_id", matchIds);

      setRankingHistory(
        (historyData ?? []) as RankingHistoryRow[]
      );

      setLoading(false);
    }

    void loadMatches();
  }, []);

  const pageBackground = {
    backgroundImage:
      "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
    backgroundAttachment:
      "fixed" as const,
  };

  if (!currentUserId && !loading) {
    return (
      <main
        className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
        style={pageBackground}
      >
        <div className="mx-auto max-w-lg">
          <header className="mb-8">
            <p className="eyebrow">
              SmashBreakPoint
            </p>

            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Connexion requise
            </h1>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Connecte-toi pour retrouver tes matchs et ton historique.
            </p>
          </header>

          <section className="glass-strong rounded-[28px] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3.5"
                  />

                  <path
                    strokeLinecap="round"
                    d="M5 20c.8-3.8 3.1-5.8 7-5.8s6.2 2 7 5.8"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Ton historique est privé
                </p>

                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Connecte-toi pour accéder à tes matchs.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="accent-glow mt-6 flex min-h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-[#0b0d13] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              Se connecter
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main
        className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
        style={pageBackground}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-28 animate-pulse rounded-full bg-surface-2" />

              <div className="mt-4 h-9 w-52 animate-pulse rounded-xl bg-surface-2" />

              <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-surface-2" />
            </div>

            <div className="h-11 w-11 animate-pulse rounded-full bg-surface-2" />
          </div>

          <div className="mt-7 flex items-center justify-between">
            <div className="h-9 w-28 animate-pulse rounded-full bg-surface-2" />

            <div className="h-3 w-20 animate-pulse rounded-full bg-surface-2" />
          </div>

          <div className="mt-3 space-y-3">
            <div className="h-36 animate-pulse rounded-[26px] bg-surface" />

            <div className="h-36 animate-pulse rounded-[26px] bg-surface" />

            <div className="h-36 animate-pulse rounded-[26px] bg-surface" />
          </div>
        </div>
      </main>
    );
  }

  const filteredMatches =
    (matches ?? [])
      .filter(
        (match) =>
          match.sport === mode
      )
      .sort(
        (a, b) =>
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
      );

  const totalMatches =
    filteredMatches.length;

  const competitiveMatches =
    filteredMatches.filter(
      (match) =>
        match.result_type ===
        "competitive"
    ).length;

  const newMatchHref =
    mode === "super_tiebreak"
      ? "/supertiebreak/new"
      : "/matches/new";

  const sportLabel =
    getSportLabel(mode);

  return (
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={pageBackground}
    >
      <div className="mx-auto max-w-lg">
        {/* HEADER */}
        <header className="mb-7 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">
              Historique · {sportLabel}
            </p>

            <h1 className="mt-2 font-display text-[30px] font-bold tracking-tight">
              Mes matchs
            </h1>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Retrouve tes matchs, tes scores et l’évolution de ton classement.
            </p>
          </div>

          <Link
            href={newMatchHref}
            className="accent-glow grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-[#0b0d13] transition-all duration-200 hover:brightness-105 active:scale-95"
            aria-label="Nouveau match"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </header>

        {/* SPORT SWITCHER */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <SportModeSwitcher />

          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <SportIcon
              sport={mode}
              className="h-3.5 w-3.5 text-accent"
            />

            <span>
              {totalMatches} match
              {totalMatches > 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>

        {/* SUMMARY */}
        <section className="glass-strong rounded-[28px] p-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Total
                </p>

                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]" />
              </div>

              <p className="mt-2.5 font-display text-2xl font-bold leading-none tabular-nums">
                {totalMatches}
              </p>

              <p className="mt-1.5 text-[10px] text-muted">
                matchs enregistrés
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Compétitifs
                </p>

                <span className="h-1.5 w-1.5 rounded-full bg-success" />
              </div>

              <p className="mt-2.5 font-display text-2xl font-bold leading-none tabular-nums">
                {competitiveMatches}
              </p>

              <p className="mt-1.5 text-[10px] text-muted">
                matchs classés
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm leading-relaxed text-danger">
            {errorMessage}
          </div>
        )}

        {/* EMPTY STATE */}
        {filteredMatches.length === 0 ? (
          <section className="glass mt-3 rounded-[28px] p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
              <SportIcon
                sport={mode}
                className="h-6 w-6"
              />
            </div>

            <p className="eyebrow mt-5">
              Aucun historique
            </p>

            <h2 className="mt-2 font-display text-xl font-bold tracking-tight">
              Aucun match
            </h2>

            <p className="mx-auto mt-2 max-w-65 text-sm leading-relaxed text-muted">
              Aucun match de{" "}
              {sportLabel.toLowerCase()} n’est encore enregistré.
            </p>

            <Link
              href={newMatchHref}
              className="accent-glow mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0d13] transition-all duration-200 hover:brightness-105 active:scale-[0.97]"
            >
              <span className="text-lg leading-none">
                +
              </span>

              Enregistrer un match
            </Link>
          </section>
        ) : (
          /* MATCH LIST */
          <section className="mt-7">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="eyebrow">
                  Derniers matchs
                </p>

                <p className="mt-1 text-xs text-muted">
                  Ton historique récent
                </p>
              </div>

              <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[9px] font-semibold tabular-nums text-muted">
                {totalMatches}
              </span>
            </div>

            <div className="space-y-3">
              {filteredMatches.map(
                (match) => {
                  const matchSets =
                    sets.filter(
                      (set) =>
                        set.match_id ===
                        match.id
                    );

                  const winnerTeam =
                    getWinnerTeam(
                      match,
                      matchSets
                    );

                  const players =
                    match.match_players ??
                    [];

                  const team1Players =
                    players.filter(
                      (player) =>
                        player.team === 1
                    );

                  const team2Players =
                    players.filter(
                      (player) =>
                        player.team === 2
                    );

                  const history =
                    rankingHistory.filter(
                      (item) =>
                        item.match_id ===
                          match.id &&
                        item.player_id ===
                          currentUserId
                    );

                  /*
                   * Ici on additionne uniquement
                   * les variations de points du joueur
                   * pour CE match.
                   *
                   * Ce n'est pas le classement actuel.
                   */
                  const pointsChange =
                    history.reduce(
                      (total, item) =>
                        total +
                        item.points_change,
                      0
                    );

                  const isWinner =
                    winnerTeam !== null &&
                    players.some(
                      (player) =>
                        player.player_id ===
                          currentUserId &&
                        player.team ===
                          winnerTeam
                    );

                  const matchHref =
                    match.sport ===
                    "super_tiebreak"
                      ? `/supertiebreak/${match.id}`
                      : `/matches/${match.id}`;

                  return (
                    <Link
                      key={match.id}
                      href={matchHref}
                      className="glass group block rounded-[28px] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.99]"
                    >
                      {/* MATCH HEADER */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
                            <SportIcon
                              sport={match.sport}
                              className="h-5 w-5"
                            />

                            {winnerTeam !==
                              null && (
                              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(126,231,135,0.45)]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-semibold">
                                {getSportLabel(
                                  match.sport
                                )}
                              </p>

                              <span className="text-xs text-muted">
                                ·
                              </span>

                              <p className="shrink-0 text-[11px] text-muted">
                                {getFormatLabel(
                                  match.format
                                )}
                              </p>
                            </div>

                            <p className="mt-1 text-[10px] text-muted">
                              {formatDate(
                                match.created_at
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest ${
                              match.result_type ===
                              "competitive"
                                ? "border-accent/15 bg-accent/8 text-accent"
                                : "border-white/8 bg-white/5 text-muted"
                            }`}
                          >
                            {match.result_type ===
                            "competitive"
                              ? "Compétitif"
                              : "Amical"}
                          </span>

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5"
                            aria-hidden="true"
                          >
                            <path
                              d="m9 5 7 7-7 7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* SCORE */}
                      <div className="mt-4 rounded-[22px] border border-white/8 bg-[#0f1118]/55 p-3.5">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          {/* TEAM 1 */}
                          <div
                            className={
                              winnerTeam ===
                              1
                                ? "min-w-0 text-foreground"
                                : "min-w-0 text-muted"
                            }
                          >
                            <div className="space-y-1.5">
                              {team1Players.map(
                                (
                                  player,
                                  index
                                ) => (
                                  <div
                                    key={`${player.player_id ?? "player"}-1-${index}`}
                                    className="flex min-w-0 items-center gap-2"
                                  >
                                    {player.player_id ===
                                      currentUserId && (
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                    )}

                                    <p
                                      className={`truncate text-xs ${
                                        player.player_id ===
                                        currentUserId
                                          ? "font-bold text-foreground"
                                          : ""
                                      }`}
                                    >
                                      {getPlayerName(
                                        player
                                      )}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* SCORE CENTER */}
                          <div className="min-w-0 text-center">
                            <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                              <p className="whitespace-nowrap font-display text-base font-bold tracking-tight tabular-nums">
                                {formatScore(
                                  match,
                                  matchSets
                                )}
                              </p>
                            </div>

                            {winnerTeam !==
                              null && (
                              <p
                                className={`mt-2 text-[9px] font-bold uppercase tracking-[0.15em] ${
                                  isWinner
                                    ? "text-success"
                                    : "text-muted"
                                }`}
                              >
                                {isWinner
                                  ? "Victoire"
                                  : "Défaite"}
                              </p>
                            )}
                          </div>

                          {/* TEAM 2 */}
                          <div
                            className={
                              winnerTeam ===
                              2
                                ? "min-w-0 text-right text-foreground"
                                : "min-w-0 text-right text-muted"
                            }
                          >
                            <div className="space-y-1.5">
                              {team2Players.map(
                                (
                                  player,
                                  index
                                ) => (
                                  <div
                                    key={`${player.player_id ?? "player"}-2-${index}`}
                                    className="flex min-w-0 items-center justify-end gap-2"
                                  >
                                    <p
                                      className={`truncate text-xs ${
                                        player.player_id ===
                                        currentUserId
                                          ? "font-bold text-foreground"
                                          : ""
                                      }`}
                                    >
                                      {getPlayerName(
                                        player
                                      )}
                                    </p>

                                    {player.player_id ===
                                      currentUserId && (
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* POINTS */}
                      {pointsChange !==
                        0 && (
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-accent">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              >
                                <path
                                  d="M12 19V5M6.5 10.5 12 5l5.5 5.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>

                            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">
                              Classement
                            </p>
                          </div>

                          <p
                            className={`text-xs font-bold tabular-nums ${
                              pointsChange > 0
                                ? "text-success"
                                : "text-danger"
                            }`}
                          >
                            {pointsChange >
                            0
                              ? "+"
                              : ""}
                            {pointsChange} pts
                          </p>
                        </div>
                      )}
                    </Link>
                  );
                }
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}