"use client";

import Link from "next/link";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";

type Sport = "tennis" | "padel" | "super_tiebreak";

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

  const fullName = [profile.first_name, profile.last_name]
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

function getFormatLabel(format: "singles" | "doubles") {
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
    const finalSet = matchSets[0];

    if (finalSet.team_1_score === finalSet.team_2_score) {
      return null;
    }

    return finalSet.team_1_score > finalSet.team_2_score
      ? 1
      : 2;
  }

  let team1Sets = 0;
  let team2Sets = 0;

  for (const set of matchSets) {
    if (set.is_match_tiebreak) {
      continue;
    }

    if (set.team_1_score > set.team_2_score) {
      team1Sets += 1;
    } else if (set.team_2_score > set.team_1_score) {
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
    .sort((a, b) => a.set_number - b.set_number)
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

export default function MatchesContent({
  currentUserId,
  matches,
  sets,
  rankingHistory,
  errorMessage,
}: MatchesContentProps) {
  const { mode } = useSportMode();

  const filteredMatches = matches.filter(
    (match) => match.sport === mode
  );

  const totalMatches = filteredMatches.length;

  const competitiveMatches = filteredMatches.filter(
    (match) => match.result_type === "competitive"
  ).length;

  const newMatchHref =
    mode === "super_tiebreak"
      ? "/supertiebreak/new"
      : "/matches/new";

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Historique
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Mes matchs
            </h1>

            <p className="mt-2 text-sm leading-5 text-muted">
              Retrouve tes matchs, tes scores et l’évolution de ton
              classement.
            </p>
          </div>

          <Link
            href={newMatchHref}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
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

        <section className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Matchs
            </p>

            <p className="mt-2 text-2xl font-bold">
              {totalMatches}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Compétitifs
            </p>

            <p className="mt-2 text-2xl font-bold">
              {competitiveMatches}
            </p>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm leading-5 text-danger">
            {errorMessage}
          </div>
        )}

        {filteredMatches.length === 0 ? (
          <section className="mt-5 rounded-3xl border border-border bg-surface p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-accent">
              <SportIcon
                sport={mode}
                className="h-6 w-6"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold tracking-tight">
              Aucun match
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-muted">
              Aucun match de {getSportLabel(mode).toLowerCase()} n’est
              encore enregistré.
            </p>

            <Link
              href={newMatchHref}
              className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 font-bold text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
            >
              Enregistrer un match
            </Link>
          </section>
        ) : (
          <section className="mt-5 space-y-3">
            {filteredMatches.map((match) => {
              const matchSets = sets.filter(
                (set) => set.match_id === match.id
              );

              const winnerTeam = getWinnerTeam(
                match,
                matchSets
              );

              const players = match.match_players ?? [];

              const team1Players = players.filter(
                (player) => player.team === 1
              );

              const team2Players = players.filter(
                (player) => player.team === 2
              );

              const history = rankingHistory.filter(
                (item) =>
                  item.match_id === match.id &&
                  item.player_id === currentUserId
              );

              const pointsChange =
                history.reduce(
                  (total, item) =>
                    total + item.points_change,
                  0
                );

              const isWinner =
                winnerTeam !== null &&
                team1Players.concat(team2Players).some(
                  (player) =>
                    player.player_id === currentUserId &&
                    player.team === winnerTeam
                );

              const matchHref =
                match.sport === "super_tiebreak"
                  ? `/supertiebreak/${match.id}`
                  : `/matches/${match.id}`;

              return (
                <Link
                  key={match.id}
                  href={matchHref}
                  className="block rounded-3xl border border-border bg-surface p-5 transition-all duration-200 hover:border-white/15 hover:bg-surface-2 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <SportIcon
                          sport={match.sport}
                          className="h-5 w-5"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">
                            {getSportLabel(match.sport)}
                          </p>

                          <span className="text-xs text-muted">
                            ·
                          </span>

                          <p className="text-xs text-muted">
                            {getFormatLabel(match.format)}
                          </p>
                        </div>

                        <p className="mt-1 text-xs text-muted">
                          {formatDate(match.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                        {match.result_type === "competitive"
                          ? "Compétitif"
                          : "Amical"}
                      </span>

                      {pointsChange !== 0 && (
                        <span
                          className={`text-xs font-bold ${
                            pointsChange > 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {pointsChange > 0 ? "+" : ""}
                          {pointsChange}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div
                      className={`min-w-0 ${
                        winnerTeam === 1
                          ? "text-foreground"
                          : "text-muted"
                      }`}
                    >
                      <div className="space-y-1">
                        {team1Players.map((player, index) => (
                          <p
                            key={`${player.player_id ?? "guest"}-1-${index}`}
                            className={`truncate text-sm ${
                              player.player_id === currentUserId
                                ? "font-bold"
                                : ""
                            }`}
                          >
                            {getPlayerName(player)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold tracking-tight">
                        {formatScore(match, matchSets)}
                      </p>

                      {winnerTeam !== null && (
                        <p
                          className={`mt-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
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
                      <div className="space-y-1">
                        {team2Players.map((player, index) => (
                          <p
                            key={`${player.player_id ?? "guest"}-2-${index}`}
                            className={`truncate text-sm ${
                              player.player_id === currentUserId
                                ? "font-bold"
                                : ""
                            }`}
                          >
                            {getPlayerName(player)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}