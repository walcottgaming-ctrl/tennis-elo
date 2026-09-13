"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/src/supabase/client";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  points_tennis: number | null;
  points_padel: number | null;
};

type Match = {
  id: string;
  sport: "tennis" | "padel";
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
  sport: "tennis" | "padel";
  started_at: string;
  ended_at: string | null;
  matches_as_champion: number;
};

type MatchHistory = {
  match: Match;
  opponentName: string;
  result: "Victoire" | "Défaite";
  scores: string[];
};

type Sport = "tennis" | "padel";

type Division = {
  name: string;
  icon: string;
  min: number;
  max: number | null;
  description: string;
};

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5a3 3 0 0 0 3 3" />
      <path d="M16 6h3a3 3 0 0 1-3 3" />
      <path d="M12 12v4" />
      <path d="M8 20h8" />
      <path d="M9 16h6" />
    </svg>
  );
}

function TennisIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5c3.2 2 5 4.8 5 8.2s-1.8 6.2-5 8.2" />
      <path d="M18.5 5.5c-3.2 2-5 4.8-5 8.2s1.8 6.2 5 8.2" />
    </svg>
  );
}

function PadelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 4.5c1.5 2 1.7 4.1.7 6.1-1 2-2.8 3.4-5.2 4" />
      <path d="M16 19.5c-1.5-2-1.7-4.1-.7-6.1 1-2 2.8-3.4 5.2-4" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-5 w-5 transition-transform ${
        open ? "rotate-180" : ""
      }`}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m4 7 4 4 4-6 4 6 4-4-2 11H6L4 7Z" />
      <path d="M6 21h12" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 21a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-4 5-4 8a6 6 0 0 0 6 7Z" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}



export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [sets, setSets] = useState<SetScore[]>([]);
  const [championHistory, setChampionHistory] = useState<
    ChampionHistory[]
  >([]);

  const [sport, setSport] = useState<Sport>("tennis");

  const [openPlayer, setOpenPlayer] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRanking() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Tu dois être connecté.");
        setLoading(false);
        return;
      }

      const {
        data: playersData,
        error: playersError,
      } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, username, points_tennis, points_padel"
        );

      if (playersError) {
        setMessage(playersError.message);
        setLoading(false);
        return;
      }

      const {
        data: matchesData,
        error: matchesError,
      } = await supabase
        .from("matches")
        .select("id, sport, format, created_at")
        .order("created_at", {
          ascending: false,
        });

      if (matchesError) {
        setMessage(matchesError.message);
        setLoading(false);
        return;
      }

      const {
        data: matchPlayersData,
        error: matchPlayersError,
      } = await supabase
        .from("match_players")
        .select("match_id, player_id, team");

      if (matchPlayersError) {
        setMessage(matchPlayersError.message);
        setLoading(false);
        return;
      }

      const {
        data: setsData,
        error: setsError,
      } = await supabase
        .from("sets")
        .select(
          "match_id, set_number, team_1_score, team_2_score"
        )
        .order("set_number", {
          ascending: true,
        });

      if (setsError) {
        setMessage(setsError.message);
        setLoading(false);
        return;
      }

      const {
        data: championData,
        error: championError,
      } = await supabase
        .from("champion_history")
        .select(
          "id, player_id, sport, started_at, ended_at, matches_as_champion"
        )
        .order("started_at", {
          ascending: false,
        });

      if (championError) {
        setMessage(championError.message);
        setLoading(false);
        return;
      }

      setPlayers(playersData ?? []);
      setMatches(matchesData ?? []);
      setMatchPlayers(matchPlayersData ?? []);
      setSets(setsData ?? []);
      setChampionHistory(championData ?? []);

      setLoading(false);
    }

    loadRanking();
  }, []);

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

  function getPlayerPoints(player: Player) {
    if (sport === "tennis") {
      return player.points_tennis ?? 1000;
    }

    return player.points_padel ?? 1000;
  }

  function getDivision(points: number): Division {
    if (points < 1000) {
      return {
        name: "Bronze",
        icon: "🥉",
        min: 0,
        max: 999,
        description: "Tu construis ton niveau.",
      };
    }

    if (points < 1100) {
      return {
        name: "Argent",
        icon: "🥈",
        min: 1000,
        max: 1099,
        description: "Tu progresses et prends de la place.",
      };
    }

    if (points < 1200) {
      return {
        name: "Or",
        icon: "🥇",
        min: 1100,
        max: 1199,
        description: "Tu fais partie des joueurs solides.",
      };
    }

    if (points < 1300) {
      return {
        name: "Platine",
        icon: "💠",
        min: 1200,
        max: 1299,
        description: "Tu fais partie des meilleurs.",
      };
    }

    return {
      name: "Diamant",
      icon: "💎",
      min: 1300,
      max: null,
      description: "Le niveau élite.",
    };
  }

  function getChampion(sportValue: Sport) {
    return championHistory.find(
      (item) =>
        item.sport === sportValue &&
        item.ended_at === null
    );
  }

  function isChampion(playerId: string) {
    const champion = getChampion(sport);

    return champion?.player_id === playerId;
  }

  function getChampionStreak(playerId: string) {
    const champion = championHistory.find(
      (item) =>
        item.sport === sport &&
        item.player_id === playerId &&
        item.ended_at === null
    );

    return champion?.matches_as_champion ?? 0;
  }

  function getChampionStartedAt(playerId: string) {
    const champion = championHistory.find(
      (item) =>
        item.sport === sport &&
        item.player_id === playerId &&
        item.ended_at === null
    );

    return champion?.started_at ?? null;
  }

  function getPlayerHistory(
    playerId: string
  ): MatchHistory[] {
    const playerMatchPlayers = matchPlayers
      .filter(
        (item) => item.player_id === playerId
      )
      .sort((a, b) => {
        const matchA = matches.find(
          (match) => match.id === a.match_id
        );

        const matchB = matches.find(
          (match) => match.id === b.match_id
        );

        return (
          new Date(
            matchB?.created_at ?? 0
          ).getTime() -
          new Date(
            matchA?.created_at ?? 0
          ).getTime()
        );
      });

    const history: MatchHistory[] = [];

    for (const playerMatchPlayer of playerMatchPlayers) {
      const match = matches.find(
        (item) =>
          item.id === playerMatchPlayer.match_id
      );

      if (!match || match.sport !== sport) {
        continue;
      }

      const opponents = matchPlayers.filter(
        (item) =>
          item.match_id === match.id &&
          item.team !== playerMatchPlayer.team &&
          item.player_id !== null
      );

      const opponentNames = opponents.map(
        (opponent) => {
          const profile = players.find(
            (player) =>
              player.id === opponent.player_id
          );

          return profile
            ? getPlayerName(profile)
            : "Joueur";
        }
      );

      const matchSets = sets.filter(
        (set) =>
          set.match_id === match.id
      );

      let playerSetWins = 0;
      let opponentSetWins = 0;

      const scores = matchSets.map(
        (set) => {
          const playerScore =
            playerMatchPlayer.team === 1
              ? set.team_1_score
              : set.team_2_score;

          const opponentScore =
            playerMatchPlayer.team === 1
              ? set.team_2_score
              : set.team_1_score;

          if (playerScore > opponentScore) {
            playerSetWins++;
          } else if (
            opponentScore > playerScore
          ) {
            opponentSetWins++;
          }

          return `${set.team_1_score}-${set.team_2_score}`;
        }
      );

      if (scores.length === 0) {
        continue;
      }

      history.push({
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

      if (history.length >= 10) {
        break;
      }
    }

    return history;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-accent/20" />

            <p className="mt-4 text-sm font-medium text-muted">
              Chargement du classement...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const rankedPlayers = [...players].sort(
    (a, b) =>
      getPlayerPoints(b) -
      getPlayerPoints(a)
  );

  const podium = rankedPlayers.slice(0, 3);

  const topPlayer = rankedPlayers[0] ?? null;

  const currentChampion = getChampion(sport);

  const currentChampionPlayer = currentChampion
    ? players.find(
        (player) =>
          player.id === currentChampion.player_id
      ) ?? null
    : null;

  const topDivision = topPlayer
    ? getDivision(getPlayerPoints(topPlayer))
    : null;

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        {/* HEADER */}

        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <TrophyIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Classement
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Qui domine ?
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted">
            Gagne des points à chaque match et grimpe
            progressivement dans le classement.
          </p>
        </header>

        {/* ERROR */}

        {message && (
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">
              {message}
            </p>
          </div>
        )}

        {/* SPORT SELECTOR */}

        <section className="mt-7">
          <div className="grid grid-cols-2 gap-2 rounded-3xl border border-border bg-surface p-2">
            <button
              type="button"
              onClick={() => {
                setSport("tennis");
                setOpenPlayer(null);
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${
                sport === "tennis"
                  ? "bg-accent text-background"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              <TennisIcon />
              Tennis
            </button>

            <button
              type="button"
              onClick={() => {
                setSport("padel");
                setOpenPlayer(null);
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${
                sport === "padel"
                  ? "bg-accent text-background"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              <PadelIcon />
              Padel
            </button>
          </div>
        </section>

        {/* CHAMPION */}

        {currentChampionPlayer && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-accent/20 bg-surface">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <CrownIcon />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                      Champion actuel
                    </p>
                  </div>

                  <h2 className="mt-4 truncate text-2xl font-bold tracking-tight">
                    {getPlayerName(currentChampionPlayer)}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    N°1{" "}
                    {sport === "tennis"
                      ? "Tennis"
                      : "Padel"}
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-accent/10 px-4 py-3 text-right">
                  <p className="text-2xl font-bold text-accent">
                    {getPlayerPoints(
                      currentChampionPlayer
                    )}
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Points
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    Division
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    {
                      getDivision(
                        getPlayerPoints(
                          currentChampionPlayer
                        )
                      ).icon
                    }{" "}
                    {
                      getDivision(
                        getPlayerPoints(
                          currentChampionPlayer
                        )
                      ).name
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-surface-2 p-4">
                  <div className="flex items-center gap-2 text-muted">
                    <FlameIcon />

                    <p className="text-xs font-bold uppercase tracking-[0.14em]">
                      Streak
                    </p>
                  </div>

                  <p className="mt-2 text-lg font-bold">
                    {getChampionStreak(
                      currentChampionPlayer.id
                    )}{" "}
                    match
                    {getChampionStreak(
                      currentChampionPlayer.id
                    ) > 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>

              {getChampionStartedAt(
                currentChampionPlayer.id
              ) && (
                <p className="mt-4 text-xs text-muted">
                  Champion depuis le{" "}
                  {new Date(
                    getChampionStartedAt(
                      currentChampionPlayer.id
                    )!
                  ).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </section>
        )}

        {/* DIVISION */}

        {topPlayer && topDivision && (
          <section className="mt-5 rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Division du leader
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {topDivision.icon}{" "}
                  {topDivision.name}
                </h2>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold">
                  {getPlayerPoints(topPlayer)}
                </p>

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Points
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted">
              {topDivision.description}
            </p>

            <div className="mt-5 grid grid-cols-5 gap-1.5">
              {[
                {
                  name: "Bronze",
                  icon: "🥉",
                  range: "< 1000",
                },
                {
                  name: "Argent",
                  icon: "🥈",
                  range: "1000",
                },
                {
                  name: "Or",
                  icon: "🥇",
                  range: "1100",
                },
                {
                  name: "Platine",
                  icon: "💠",
                  range: "1200",
                },
                {
                  name: "Diamant",
                  icon: "💎",
                  range: "1300+",
                },
              ].map((division) => (
                <div
                  key={division.name}
                  className={`rounded-xl p-2 text-center ${
                    division.name === topDivision.name
                      ? "border border-accent/20 bg-accent/10"
                      : "bg-surface-2"
                  }`}
                >
                  <p className="text-base">
                    {division.icon}
                  </p>

                  <p
                    className={`mt-1 text-[9px] font-bold uppercase tracking-wide ${
                      division.name === topDivision.name
                        ? "text-accent"
                        : "text-muted"
                    }`}
                  >
                    {division.name}
                  </p>

                  <p className="mt-0.5 text-[8px] text-muted">
                    {division.range}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PODIUM */}

        {podium.length > 0 && (
          <section className="mt-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Classement
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Le podium
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-3 items-end gap-2">
              {/* 2ND */}

              {podium[1] && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenPlayer(
                      openPlayer === podium[1].id
                        ? null
                        : podium[1].id
                    )
                  }
                  className="rounded-3xl border border-border bg-surface p-3 text-center transition hover:border-white/10 hover:bg-surface-2 active:scale-[0.98]"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-xl">
                    2
                  </div>

                  <p className="mt-3 truncate text-sm font-bold">
                    {getPlayerName(podium[1])}
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {getPlayerPoints(podium[1])}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold text-muted">
                    {
                      getDivision(
                        getPlayerPoints(podium[1])
                      ).icon
                    }{" "}
                    {
                      getDivision(
                        getPlayerPoints(podium[1])
                      ).name
                    }
                  </p>
                </button>
              )}

              {/* 1ST */}

              {podium[0] && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenPlayer(
                      openPlayer === podium[0].id
                        ? null
                        : podium[0].id
                    )
                  }
                  className="relative rounded-3xl border border-accent/30 bg-surface p-4 text-center shadow-2xl transition hover:bg-surface-2 active:scale-[0.98]"
                >
                  {isChampion(podium[0].id) && (
                    <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[9px] font-bold text-background">
                      <CrownIcon />
                      CHAMPION
                    </span>
                  )}

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <TrophyIcon />
                  </div>

                  <p className="mt-3 truncate text-sm font-bold">
                    {getPlayerName(podium[0])}
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    {getPlayerPoints(podium[0])}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold text-muted">
                    {
                      getDivision(
                        getPlayerPoints(podium[0])
                      ).icon
                    }{" "}
                    {
                      getDivision(
                        getPlayerPoints(podium[0])
                      ).name
                    }
                  </p>
                </button>
              )}

              {/* 3RD */}

              {podium[2] && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenPlayer(
                      openPlayer === podium[2].id
                        ? null
                        : podium[2].id
                    )
                  }
                  className="rounded-3xl border border-border bg-surface p-3 text-center transition hover:border-white/10 hover:bg-surface-2 active:scale-[0.98]"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-xl">
                    3
                  </div>

                  <p className="mt-3 truncate text-sm font-bold">
                    {getPlayerName(podium[2])}
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {getPlayerPoints(podium[2])}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold text-muted">
                    {
                      getDivision(
                        getPlayerPoints(podium[2])
                      ).icon
                    }{" "}
                    {
                      getDivision(
                        getPlayerPoints(podium[2])
                      ).name
                    }
                  </p>
                </button>
              )}
            </div>
          </section>
        )}

        {/* FULL RANKING */}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Classement
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Tous les joueurs
              </h2>
            </div>

            <span className="text-xs font-medium text-muted">
              {rankedPlayers.length} joueur
              {rankedPlayers.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface">
            {rankedPlayers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted">
                  Aucun joueur disponible.
                </p>
              </div>
            ) : (
              rankedPlayers.map((player, index) => {
                const isOpen =
                  openPlayer === player.id;

                const playerHistory =
                  getPlayerHistory(player.id);

                const playerPoints =
                  getPlayerPoints(player);

                const division =
                  getDivision(playerPoints);

                const playerIsChampion =
                  isChampion(player.id);

                return (
                  <div
                    key={player.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPlayer(
                          isOpen
                            ? null
                            : player.id
                        )
                      }
                      className="w-full px-4 py-4 text-left transition hover:bg-surface-2"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            index === 0
                              ? "bg-accent/10 text-accent"
                              : "bg-surface-2 text-muted"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold">
                              {getPlayerName(player)}
                            </p>

                            {playerIsChampion && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                <CrownIcon />
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-muted">
                            {division.icon}{" "}
                            {division.name}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {playerPoints}
                          </p>

                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                            points
                          </p>
                        </div>

                        <div className="text-muted">
                          <ChevronDownIcon
                            open={isOpen}
                          />
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border bg-surface-2/60 px-4 py-5">
                        {/* PLAYER SUMMARY */}

                        <div className="rounded-2xl border border-border bg-surface p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-base font-bold">
                                {getPlayerName(player)}
                              </p>

                              <p className="mt-1 text-xs text-muted">
                                {sport === "tennis"
                                  ? "Tennis"
                                  : "Padel"}{" "}
                                · Division{" "}
                                {division.name}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-bold text-accent">
                                {playerPoints}
                              </p>

                              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                                points
                              </p>
                            </div>
                          </div>

                          {playerIsChampion && (
                            <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 p-4">
                              <div className="flex items-center gap-2 text-accent">
                                <CrownIcon />

                                <p className="text-xs font-bold uppercase tracking-[0.14em]">
                                  Champion actuel
                                </p>
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <FlameIcon />

                                <p className="text-lg font-bold">
                                  {getChampionStreak(
                                    player.id
                                  )}{" "}
                                  match
                                  {getChampionStreak(
                                    player.id
                                  ) > 1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>

                              {getChampionStartedAt(
                                player.id
                              ) && (
                                <p className="mt-1 text-xs text-muted">
                                  Depuis le{" "}
                                  {new Date(
                                    getChampionStartedAt(
                                      player.id
                                    )!
                                  ).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* MATCH HISTORY */}

                        <div className="mt-6">
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                                Historique
                              </p>

                              <h3 className="mt-1 text-base font-bold">
                                10 dernières confrontations
                              </h3>
                            </div>
                          </div>

                          {playerHistory.length === 0 ? (
                            <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
                              <p className="text-sm text-muted">
                                Aucune confrontation
                                enregistrée.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              {playerHistory.map(
                                (item) => (
                                  <Link
                                    key={item.match.id}
                                    href={`/matches/${item.match.id}`}
                                    className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-white/10 hover:bg-surface-2"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                                        {item.match.sport ===
                                        "tennis" ? (
                                          <TennisIcon />
                                        ) : (
                                          <PadelIcon />
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-bold">
                                              vs{" "}
                                              {
                                                item.opponentName
                                              }
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                              {item.match.format ===
                                              "singles"
                                                ? "Simple"
                                                : "Double"}{" "}
                                              ·{" "}
                                              {new Date(
                                                item.match.created_at
                                              ).toLocaleDateString(
                                                "fr-FR"
                                              )}
                                            </p>
                                          </div>

                                          <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                              item.result ===
                                              "Victoire"
                                                ? "bg-accent/10 text-accent"
                                                : "bg-danger/10 text-danger"
                                            }`}
                                          >
                                            {item.result}
                                          </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                          {item.scores.map(
                                            (
                                              score,
                                              scoreIndex
                                            ) => (
                                              <span
                                                key={`${item.match.id}-${scoreIndex}`}
                                                className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-[10px] font-semibold text-muted"
                                              >
                                                S
                                                {scoreIndex +
                                                  1}{" "}
                                                {score}
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </div>

                                      <div className="shrink-0 pt-1 text-muted">
                                        <ChevronRightIcon />
                                      </div>
                                    </div>
                                  </Link>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

<Link
  href="/ranking/history"
  className="mt-4 flex min-h-14 items-center justify-between rounded-2xl border border-border bg-surface px-4 transition-colors hover:bg-surface-2"
>
  <div>
    <p className="text-sm font-bold text-foreground">
      Historique des points
    </p>
    <p className="mt-0.5 text-xs text-muted">
      Voir l&apos;évolution de vos points
    </p>
  </div>

  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
    →
  </div>
</Link>



        {/* POINTS EXPLANATION */}

        <section className="mt-6 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ArrowUpIcon />
            </div>

            <div>
              <p className="font-bold">
                Comment fonctionnent les points ?
              </p>

              <p className="mt-2 text-sm leading-6 text-muted">
                Une victoire rapporte{" "}
                <span className="font-semibold text-foreground">
                  +25 points
                </span>{" "}
                et une défaite fait perdre{" "}
                <span className="font-semibold text-foreground">
                  20 points
                </span>
                .
              </p>

              <p className="mt-3 text-sm leading-6 text-muted">
                Des bonus récompensent les grosses
                performances : bulle, double bulle,
                victoire propre, série de victoires
                et victoire contre un joueur mieux
                classé.
              </p>

              <p className="mt-3 text-sm leading-6 text-muted">
                Les défaites peuvent également entraîner
                des malus selon le score et le niveau
                de l&apos;adversaire.
              </p>

              <p className="mt-3 text-sm leading-6 text-muted">
                Plus tes points augmentent, plus tu
                montes dans les divisions : Bronze,
                Argent, Or, Platine puis Diamant.
              </p>

              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-accent/5 p-3">
                <div className="mt-0.5 shrink-0 text-accent">
                  <CrownIcon />
                </div>

                <p className="text-xs font-medium leading-5 text-muted">
                  Le joueur actuellement premier est le
                  Champion. Son compteur indique combien
                  de matchs il a conservé la première
                  place.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}