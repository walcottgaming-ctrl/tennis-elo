"use client";

import Link from "next/link";
import { useMemo } from "react";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";

type Sport =
  | "tennis"
  | "padel"
  | "super_tiebreak";

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

type Props = {
  player: Player;
  players: Player[];
  matches: Match[];
  matchPlayers: MatchPlayer[];
  sets: SetScore[];
  championHistory: ChampionHistory[];
};

type MatchResult = {
  match: Match;
  opponentName: string;
  result: "Victoire" | "Défaite";
  scores: string[];
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

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 6H3v1a4 4 0 0 0 4 4M17 6h4v1a4 4 0 0 1-4 4"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 19V5M4 19h16"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m7 15 3-4 3 2 5-6"
      />
    </svg>
  );
}

function getPlayerName(player: Player) {
  const fullName = [
    player.first_name,
    player.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (player.username) {
    return `@${player.username}`;
  }

  return "Joueur";
}

function getInitials(player: Player) {
  const name = getPlayerName(player);

  if (name.startsWith("@")) {
    return name.substring(1, 2).toUpperCase();
  }

  const parts = name.split(" ");

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
}

function getPoints(player: Player, sport: Sport) {
  if (sport === "tennis") {
    return player.points_tennis ?? 1000;
  }

  if (sport === "padel") {
    return player.points_padel ?? 1000;
  }

  return player.points_super_tiebreak ?? 1000;
}

function getSportName(sport: Sport) {
  if (sport === "tennis") {
    return "Tennis";
  }

  if (sport === "padel") {
    return "Padel";
  }

  return "Super Tie-Break";
}

function getDivision(points: number) {
  if (points < 1000) {
    return {
      name: "Bronze",
      description: "Moins de 1000 points",
    };
  }

  if (points < 1100) {
    return {
      name: "Argent",
      description: "1000 à 1099 points",
    };
  }

  if (points < 1200) {
    return {
      name: "Or",
      description: "1100 à 1199 points",
    };
  }

  if (points < 1300) {
    return {
      name: "Platine",
      description: "1200 à 1299 points",
    };
  }

  return {
    name: "Diamant",
    description: "1300 points et plus",
  };
}

export default function PlayerProfile({
  player,
  players,
  matches,
  matchPlayers,
  sets,
  championHistory,
}: Props) {
  const { mode } = useSportMode();

  const points = getPoints(player, mode);
  const division = getDivision(points);

  const rankedPlayers = useMemo(() => {
    const modeMatchIds = new Set(
      matches
        .filter((match) => match.sport === mode)
        .map((match) => match.id)
    );

    const activeIds = new Set(
      matchPlayers
        .filter(
          (item) =>
            item.player_id &&
            modeMatchIds.has(item.match_id)
        )
        .map((item) => item.player_id)
    );

    return players
      .filter((item) => activeIds.has(item.id))
      .sort(
        (a, b) =>
          getPoints(b, mode) -
          getPoints(a, mode)
      );
  }, [matches, matchPlayers, mode, players]);

  const rankIndex = rankedPlayers.findIndex(
    (item) => item.id === player.id
  );

  const rank =
    rankIndex >= 0 ? rankIndex + 1 : null;

  const history = useMemo(() => {
    const playerLinks = matchPlayers.filter(
      (item) => item.player_id === player.id
    );

    const playerMatches = playerLinks
      .map((link) => {
        const match = matches.find(
          (item) => item.id === link.match_id
        );

        return match ? { match, link } : null;
      })
      .filter(
        (
          item
        ): item is {
          match: Match;
          link: MatchPlayer;
        } => Boolean(item)
      )
      .filter(
        ({ match }) => match.sport === mode
      )
      .sort(
        (a, b) =>
          new Date(b.match.created_at).getTime() -
          new Date(a.match.created_at).getTime()
      );

    const result: MatchResult[] = [];

    for (const { match, link } of playerMatches) {
      const opponents = matchPlayers.filter(
        (item) =>
          item.match_id === match.id &&
          item.team !== link.team
      );

      const opponentNames = opponents.map(
        (opponent) => {
          const profile = players.find(
            (item) =>
              item.id === opponent.player_id
          );

          return profile
            ? getPlayerName(profile)
            : "Joueur";
        }
      );

      const matchSets = sets
        .filter(
          (set) => set.match_id === match.id
        )
        .sort(
          (a, b) =>
            a.set_number - b.set_number
        );

      if (matchSets.length === 0) {
        continue;
      }

      let playerSetWins = 0;
      let opponentSetWins = 0;

      const scores = matchSets.map((set) => {
        const playerScore =
          link.team === 1
            ? set.team_1_score
            : set.team_2_score;

        const opponentScore =
          link.team === 1
            ? set.team_2_score
            : set.team_1_score;

        if (playerScore > opponentScore) {
          playerSetWins++;
        }

        if (opponentScore > playerScore) {
          opponentSetWins++;
        }

        return `${set.team_1_score}-${set.team_2_score}`;
      });

      if (playerSetWins === opponentSetWins) {
        continue;
      }

      result.push({
        match,
        opponentName:
          opponentNames.join(" / ") ||
          "Joueur",
        result:
          playerSetWins > opponentSetWins
            ? "Victoire"
            : "Défaite",
        scores,
      });
    }

    return result;
  }, [
    matchPlayers,
    matches,
    mode,
    player.id,
    players,
    sets,
  ]);

  const wins = history.filter(
    (item) => item.result === "Victoire"
  ).length;

  const losses = history.filter(
    (item) => item.result === "Défaite"
  ).length;

  const totalMatches = wins + losses;

  const winRate =
    totalMatches > 0
      ? Math.round((wins / totalMatches) * 100)
      : 0;

  const currentStreak = useMemo(() => {
    let streak = 0;

    for (const item of history) {
      if (item.result !== "Victoire") {
        break;
      }

      streak++;
    }

    return streak;
  }, [history]);

  const currentChampion = championHistory.find(
    (item) =>
      item.sport === mode &&
      item.ended_at === null
  );

  const modeChampionHistory =
    championHistory.filter(
      (item) => item.sport === mode
    );

  const name = getPlayerName(player);
  const initials = getInitials(player);

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        <Link
          href="/ranking"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted"
        >
          <ArrowLeftIcon />
          Retour au classement
        </Link>

        {/* Identité */}

        <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            {player.avatar_url ? (
              <img
                src={player.avatar_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-lg font-bold">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {name}
              </h1>

              {player.username && (
                <p className="mt-1 text-sm text-muted">
                  @{player.username}
                </p>
              )}

              <p className="mt-2 text-sm text-muted">
                Profil {getSportName(mode)}
              </p>
            </div>
          </div>
        </section>

        {/* Classement */}

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-muted">
              <SportIcon
                sport={mode}
                className="h-4 w-4"
              />

              <p className="text-xs font-bold uppercase tracking-[0.14em]">
                {getSportName(mode)}
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold tracking-tight">
              {points}
            </p>

            <p className="mt-1 text-xs text-muted">
              points
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Classement
            </p>

            <p className="mt-3 text-3xl font-bold tracking-tight">
              {rank ? `#${rank}` : "—"}
            </p>

            <p className="mt-1 text-xs text-muted">
              {division.name}
            </p>
          </div>
        </section>

        {/* Statistiques */}

        <section className="mt-7">
          <div className="flex items-center gap-2 text-muted">
            <ChartIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Performances
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold tracking-tight">
            {getSportName(mode)}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Matchs
              </p>

              <p className="mt-2 text-3xl font-bold">
                {totalMatches}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Victoire
              </p>

              <p className="mt-2 text-3xl font-bold">
                {winRate}%
              </p>
            </div>

            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Victoires
              </p>

              <p className="mt-2 text-3xl font-bold">
                {wins}
              </p>
            </div>

            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-danger">
                Défaites
              </p>

              <p className="mt-2 text-3xl font-bold">
                {losses}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Série actuelle
            </p>

            <p className="mt-2 text-3xl font-bold">
              {currentStreak}
            </p>

            <p className="mt-1 text-xs text-muted">
              {currentStreak > 1
                ? "victoires consécutives"
                : "victoire consécutive"}
            </p>
          </div>
        </section>

        {/* Champion */}

        {currentChampion && (
          <section className="mt-7 rounded-3xl border border-accent/20 bg-accent/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-accent">
                <TrophyIcon />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                  Champion
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Champion {getSportName(mode)}
                </h2>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-surface p-4">
              <p className="text-sm text-muted">
                Matchs en tant que champion
              </p>

              <p className="mt-1 text-3xl font-bold">
                {currentChampion.matches_as_champion}
              </p>
            </div>
          </section>
        )}

        {/* Palmarès */}

        {modeChampionHistory.length > 0 && (
          <section className="mt-7">
            <div className="flex items-center gap-2 text-muted">
              <TrophyIcon />

              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Palmarès
              </p>
            </div>

            <h2 className="mt-1 text-xl font-bold">
              Historique des titres
            </h2>

            <div className="mt-4 space-y-3">
              {modeChampionHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {getSportName(mode)}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Depuis{" "}
                        {new Date(
                          item.started_at
                        ).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold">
                      {item.matches_as_champion}{" "}
                      matchs
                    </span>
                  </div>

                  {item.ended_at && (
                    <p className="mt-3 text-xs text-muted">
                      Fin du règne :{" "}
                      {new Date(
                        item.ended_at
                      ).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Historique */}

        <section className="mt-7">
          <div className="flex items-center gap-2 text-muted">
            <TrophyIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Historique
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Dernières confrontations
          </h2>

          {history.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-border bg-surface p-7 text-center">
              <p className="font-bold">
                Aucun match enregistré
              </p>

              <p className="mt-2 text-sm leading-6 text-muted">
                Les résultats apparaîtront ici après
                les premiers matchs.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {history.slice(0, 10).map((item) => (
                <Link
                  key={item.match.id}
                  href={
                    item.match.sport ===
                    "super_tiebreak"
                      ? `/supertiebreak/${item.match.id}`
                      : `/matches/${item.match.id}`
                  }
                  className="block rounded-3xl border border-border bg-surface p-5 transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <SportIcon
                            sport={item.match.sport}
                            className="h-4 w-4"
                          />

                          <span>
                            {getSportName(
                              item.match.sport
                            )}
                          </span>
                        </div>

                        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                          {item.match.format ===
                          "singles"
                            ? "Simple"
                            : "Double"}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm text-muted">
                        vs {item.opponentName}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-bold uppercase tracking-wider ${
                        item.result === "Victoire"
                          ? "text-accent"
                          : "text-danger"
                      }`}
                    >
                      {item.result}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.scores.map(
                      (score, index) => (
                        <span
                          key={`${item.match.id}-${index}`}
                          className="rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold text-muted"
                        >
                          Set {index + 1} : {score}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mt-3 text-xs text-muted">
                    {new Date(
                      item.match.created_at
                    ).toLocaleDateString("fr-FR")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}