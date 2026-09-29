"use client";

import Link from "next/link";
import SportIcon from "@/app/components/SportIcon";
import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import { useSportMode } from "@/app/context/SportModeContext";

type Sport =
  | "tennis"
  | "padel"
  | "super_tiebreak";

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

type MatchesContentProps = {
  currentUserId: string;
  matches: Match[];
  sets: SetRow[];
  rankingHistory: RankingHistoryRow[];
  errorMessage: string | null;
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

  return (
    fullName ||
    profile.username ||
    "Joueur"
  );
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
  return format === "singles"
    ? "Simple"
    : "Double";
}

function getWinnerTeam(
  match: Match,
  matchSets: SetRow[]
) {
  if (matchSets.length === 0) {
    return null;
  }

  if (match.sport === "super_tiebreak") {
    const finalSet = matchSets[0];

    if (
      finalSet.team_1_score ===
      finalSet.team_2_score
    ) {
      return null;
    }

    return finalSet.team_1_score >
      finalSet.team_2_score
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

  return matchSets
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
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(date));
}

function PlusIcon({
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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

function CheckIcon({
  className = "h-3.5 w-3.5",
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function MatchesContent({
  currentUserId,
  matches,
  sets,
  rankingHistory,
  errorMessage,
}: MatchesContentProps) {
  const { mode } = useSportMode();

  const filteredMatches =
    matches.filter(
      (match) => match.sport === mode
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
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-lg">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">
              Historique · {sportLabel}
            </p>

            <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Mes matchs
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              Retrouve tes matchs, tes scores et
              l&apos;évolution de ton classement.
            </p>
          </div>

          <Link
            href={newMatchHref}
            className="group grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_14px_36px_var(--accent-glow)] active:scale-[0.96]"
            aria-label="Nouveau match"
          >
            <PlusIcon className="transition-transform duration-200 group-hover:rotate-90" />
          </Link>
        </header>

        <div className="mt-6 flex items-center justify-between gap-3">
          <SportModeSwitcher />

          <p className="text-xs font-medium text-muted">
            {totalMatches}{" "}
            {totalMatches > 1
              ? "matchs"
              : "match"}
          </p>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="glass rounded-[22px] p-4">
            <p className="eyebrow">
              Matchs
            </p>

            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {totalMatches}
            </p>

            <p className="mt-1 text-xs text-muted">
              dans {sportLabel.toLowerCase()}
            </p>
          </div>

          <div className="glass rounded-[22px] p-4">
            <p className="eyebrow">
              Compétitifs
            </p>

            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {competitiveMatches}
            </p>

            <p className="mt-1 text-xs text-muted">
              matchs classés
            </p>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <p className="text-sm leading-6 text-danger">
              {errorMessage}
            </p>
          </div>
        )}

        {filteredMatches.length === 0 ? (
          <section className="glass-strong relative mt-5 overflow-hidden rounded-[28px] p-7 text-center">
            <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
                <SportIcon
                  sport={mode}
                  className="h-6 w-6"
                />
              </div>

              <p className="eyebrow mt-5">
                Aucune activité
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Aucun match
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Aucun match de{" "}
                {sportLabel.toLowerCase()} n&apos;est
                encore enregistré.
              </p>

              <Link
                href={newMatchHref}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
              >
                <PlusIcon className="h-4 w-4" />
                Enregistrer un match
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-5 space-y-3">
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

                const pointsChange =
                  history.reduce(
                    (total, item) =>
                      total +
                      item.points_change,
                    0
                  );

                const isWinner =
                  winnerTeam !== null &&
                  team1Players
                    .concat(team2Players)
                    .some(
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
                    className="glass group relative block overflow-hidden rounded-[27px] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5.5 active:scale-[0.995]"
                  >
                    {winnerTeam !== null &&
                      isWinner && (
                        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-accent/8 blur-3xl" />
                      )}

                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
                            <SportIcon
                              sport={
                                match.sport
                              }
                              className="h-5 w-5"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate font-semibold">
                                {getSportLabel(
                                  match.sport
                                )}
                              </p>

                              <span className="text-white/15">
                                /
                              </span>

                              <p className="shrink-0 text-xs text-muted">
                                {getFormatLabel(
                                  match.format
                                )}
                              </p>
                            </div>

                            <p className="mt-1 text-xs text-muted">
                              {formatDate(
                                match.created_at
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                            {match.result_type ===
                            "competitive"
                              ? "Compétitif"
                              : "Amical"}
                          </span>

                          {pointsChange !==
                            0 && (
                            <span
                              className={`font-display text-sm font-semibold ${
                                pointsChange >
                                0
                                  ? "text-success"
                                  : "text-danger"
                              }`}
                            >
                              {pointsChange >
                              0
                                ? "+"
                                : ""}
                              {pointsChange}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[22px] border border-white/6 bg-[#0f1219]/55 px-3.5 py-4">
                        <div
                          className={`min-w-0 ${
                            winnerTeam === 1
                              ? "text-foreground"
                              : "text-muted"
                          }`}
                        >
                          <div className="space-y-1.5">
                            {team1Players.map(
                              (
                                player,
                                index
                              ) => (
                                <div
                                  key={`${player.player_id ?? "guest"}-1-${index}`}
                                  className="flex min-w-0 items-center gap-1.5"
                                >
                                  {winnerTeam ===
                                    1 && (
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                      <CheckIcon className="h-2.5 w-2.5" />
                                    </span>
                                  )}

                                  <p
                                    className={`truncate text-sm ${
                                      player.player_id ===
                                      currentUserId
                                        ? "font-semibold text-foreground"
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

                        <div className="min-w-0 text-center">
                          <p className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                            {formatScore(
                              match,
                              matchSets
                            )}
                          </p>

                          {winnerTeam !==
                            null && (
                            <p
                              className={`mt-1.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
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

                        <div
                          className={`min-w-0 text-right ${
                            winnerTeam === 2
                              ? "text-foreground"
                              : "text-muted"
                          }`}
                        >
                          <div className="space-y-1.5">
                            {team2Players.map(
                              (
                                player,
                                index
                              ) => (
                                <div
                                  key={`${player.player_id ?? "guest"}-2-${index}`}
                                  className="flex min-w-0 items-center justify-end gap-1.5"
                                >
                                  <p
                                    className={`truncate text-sm ${
                                      player.player_id ===
                                      currentUserId
                                        ? "font-semibold text-foreground"
                                        : ""
                                    }`}
                                  >
                                    {getPlayerName(
                                      player
                                    )}
                                  </p>

                                  {winnerTeam ===
                                    2 && (
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                      <CheckIcon className="h-2.5 w-2.5" />
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
                          {match.sport ===
                          "super_tiebreak"
                            ? "Super Tie-Break"
                            : "Match"}
                        </span>

                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted">
                          Détails

                          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              }
            )}
          </section>
        )}
      </div>
    </main>
  );
}