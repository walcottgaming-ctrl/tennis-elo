"use client";

import { useEffect, useState } from "react";
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

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [sets, setSets] = useState<SetScore[]>([]);
  const [championHistory, setChampionHistory] = useState<
    ChampionHistory[]
  >([]);

  const [sport, setSport] = useState<Sport>("tennis");

  const [openPlayer, setOpenPlayer] = useState<string | null>(
    null
  );

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
        .select(
          "id, sport, format, created_at"
        )
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
        .select(
          "match_id, player_id, team"
        );

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
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
        <p className="text-gray-600">
          Chargement du classement...
        </p>
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
      (player) => player.id === currentChampion.player_id
    ) ?? null
  : null;

const topDivision = topPlayer
  ? getDivision(getPlayerPoints(topPlayer))
  : null;

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-lg pb-8">

        {/* HEADER */}

        <div>
          <p className="text-sm font-medium text-gray-500">
            🏆 Classement
          </p>

          <h1 className="mt-1 text-3xl font-bold text-black">
            Classement
          </h1>

          <p className="mt-2 text-gray-600">
            Gagne des points à chaque match et
            grimpe dans le classement.
          </p>
        </div>

        {message && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        {/* SPORT SELECTOR */}

        <section className="mt-6 rounded-2xl bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSport("tennis");
                setOpenPlayer(null);
              }}
              className={`min-h-12 rounded-xl px-4 py-3 text-sm font-bold transition ${
                sport === "tennis"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              🎾 Tennis
            </button>

            <button
              type="button"
              onClick={() => {
                setSport("padel");
                setOpenPlayer(null);
              }}
              className={`min-h-12 rounded-xl px-4 py-3 text-sm font-bold transition ${
                sport === "padel"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              🟢 Padel
            </button>
          </div>
        </section>

        {/* CHAMPION CARD */}

        {currentChampionPlayer && topDivision && (
  <section className="mt-6 overflow-hidden rounded-3xl bg-black text-white shadow-lg">
            <div className="p-6">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Champion actuel
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-3xl">
                      👑
                    </span>

                    <h2 className="text-2xl font-black">
                    {getPlayerName(currentChampionPlayer)}  
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-gray-400">
                    N°1 {sport === "tennis" ? "Tennis" : "Padel"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                  <p className="text-2xl font-black">
                    {getPlayerPoints(currentChampionPlayer)}
                  </p>

                  <p className="text-xs text-gray-400">
                    POINTS
                  </p>
                </div>
              </div>

              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Division
                  </p>

                  <p className="mt-2 text-xl font-black">
                    {getDivision(
                      getPlayerPoints(currentChampionPlayer)
                    ).icon}{" "}
                    {getDivision(
                      getPlayerPoints(currentChampionPlayer)
                    ).name}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Streak Champion
                  </p>

                  <p className="mt-2 text-xl font-black">
                    🔥{" "}
                    {getChampionStreak(currentChampionPlayer.id)}{" "}
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
                <p className="mt-5 text-xs text-gray-400">
                  Champion depuis le{" "}
                  {new Date(
                    getChampionStartedAt(
                      currentChampionPlayer.id
                    )!
                  ).toLocaleDateString(
                    "fr-FR"
                  )}
                </p>
              )}
            </div>
          </section>
        )}
```

```


        {/* DIVISION CARD */}

        {topPlayer && (
          <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Division actuelle
                </p>

                <h2 className="mt-1 text-xl font-black text-black">
                  {getDivision(
                    getPlayerPoints(topPlayer)
                  ).icon}{" "}
                  {getDivision(
                    getPlayerPoints(topPlayer)
                  ).name}
                </h2>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-black">
                  {getPlayerPoints(topPlayer)}
                </p>

                <p className="text-xs text-gray-400">
                  points du leader
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {getDivision(
                getPlayerPoints(topPlayer)
              ).description}
            </p>

            <div className="mt-5 space-y-2">

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">
                  🥉 Bronze
                </span>
                <span className="text-xs text-gray-400">
                  &lt; 1000
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">
                  🥈 Argent
                </span>
                <span className="text-xs text-gray-400">
                  1000–1099
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">
                  🥇 Or
                </span>
                <span className="text-xs text-gray-400">
                  1100–1199
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">
                  💠 Platine
                </span>
                <span className="text-xs text-gray-400">
                  1200–1299
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">
                  💎 Diamant
                </span>
                <span className="text-xs text-gray-400">
                  1300+
                </span>
              </div>

            </div>
          </section>
        )}

        {/* PODIUM */}

        {podium.length > 0 && (
          <section className="mt-8">
            <div>
              <h2 className="text-xl font-bold text-black">
                🏆 Podium
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Top 3{" "}
                {sport === "tennis"
                  ? "Tennis"
                  : "Padel"}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 items-end gap-2">

              {/* 2e */}

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
                  className="rounded-2xl bg-white p-3 text-center shadow-sm"
                >
                  <div className="text-3xl">
                    🥈
                  </div>

                  <p className="mt-2 truncate text-sm font-bold text-black">
                    {getPlayerName(podium[1])}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-black">
                    {getPlayerPoints(podium[1])}
                  </p>

                  <p className="text-xs text-gray-500">
                    {getDivision(
                      getPlayerPoints(podium[1])
                    ).icon}{" "}
                    {getDivision(
                      getPlayerPoints(podium[1])
                    ).name}
                  </p>
                </button>
              )}

              {/* 1er */}

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
                  className="relative rounded-2xl border-2 border-yellow-300 bg-white p-4 text-center shadow-sm"
                >
                  {isChampion(podium[0].id) && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-1 text-[10px] font-black text-white">
                      👑 CHAMPION
                    </span>
                  )}

                  <div className="text-4xl">
                    🥇
                  </div>

                  <p className="mt-2 truncate text-sm font-bold text-black">
                    {getPlayerName(podium[0])}
                  </p>

                  <p className="mt-1 text-3xl font-bold text-black">
                    {getPlayerPoints(podium[0])}
                  </p>

                  <p className="text-xs text-gray-500">
                    {getDivision(
                      getPlayerPoints(podium[0])
                    ).icon}{" "}
                    {getDivision(
                      getPlayerPoints(podium[0])
                    ).name}
                  </p>
                </button>
              )}

              {/* 3e */}

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
                  className="rounded-2xl bg-white p-3 text-center shadow-sm"
                >
                  <div className="text-3xl">
                    🥉
                  </div>

                  <p className="mt-2 truncate text-sm font-bold text-black">
                    {getPlayerName(podium[2])}
                  </p>

                  <p className="mt-1 text-2xl font-bold text-black">
                    {getPlayerPoints(podium[2])}
                  </p>

                  <p className="text-xs text-gray-500">
                    {getDivision(
                      getPlayerPoints(podium[2])
                    ).icon}{" "}
                    {getDivision(
                      getPlayerPoints(podium[2])
                    ).name}
                  </p>
                </button>
              )}
            </div>
          </section>
        )}

        {/* FULL RANKING */}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-black">
            📊 Classement complet
          </h2>

          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
            {rankedPlayers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  Aucun joueur disponible.
                </p>
              </div>
            ) : (
              rankedPlayers.map(
                (player, index) => {
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
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      {/* PLAYER ROW */}

                      <button
                        type="button"
                        onClick={() =>
                          setOpenPlayer(
                            isOpen
                              ? null
                              : player.id
                          )
                        }
                        className="w-full px-5 py-5 text-left"
                      >
                        <div className="flex items-center gap-4">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-black">
                            {index === 0
                              ? "🥇"
                              : index === 1
                                ? "🥈"
                                : index === 2
                                  ? "🥉"
                                  : index + 1}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center gap-2">
                              <p className="truncate font-bold text-black">
                                {getPlayerName(player)}
                              </p>

                              {playerIsChampion && (
                                <span className="shrink-0 rounded-full bg-black px-2 py-1 text-[9px] font-black text-white">
                                  👑
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              {division.icon}{" "}
                              {division.name}
                              {" · "}
                              {sport === "tennis"
                                ? "🎾 Tennis"
                                : "🟢 Padel"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-black">
                              {playerPoints}
                            </p>

                            <p className="text-xs text-gray-500">
                              POINTS
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* PLAYER DETAILS */}

                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">

                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-black">
                                {getPlayerName(player)}
                              </h3>

                              <p className="mt-1 text-sm text-gray-500">
                                Points{" "}
                                {sport === "tennis"
                                  ? "Tennis"
                                  : "Padel"}{" "}
                                :{" "}
                                {playerPoints}
                              </p>

                              <p className="mt-1 text-sm font-semibold text-gray-600">
                                {division.icon}{" "}
                                Division{" "}
                                {division.name}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-gray-600">
                                #{index + 1}
                              </span>

                              {playerIsChampion && (
                                <p className="mt-2 text-xs font-black text-black">
                                  👑 CHAMPION
                                </p>
                              )}
                            </div>
                          </div>

                          {playerIsChampion && (
                            <div className="mt-4 rounded-2xl bg-black p-4 text-white">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                Streak Champion
                              </p>

                              <p className="mt-1 text-2xl font-black">
                                🔥{" "}
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

                              {getChampionStartedAt(
                                player.id
                              ) && (
                                <p className="mt-1 text-xs text-gray-400">
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

                          <div className="mt-5">
                            <h4 className="font-bold text-black">
                              10 dernières confrontations
                            </h4>

                            {playerHistory.length === 0 ? (
                              <p className="mt-4 text-sm text-gray-500">
                                Aucune confrontation enregistrée.
                              </p>
                            ) : (
                              <div className="mt-4 space-y-3">
                                {playerHistory.map(
                                  (item) => (
                                    <div
                                      key={item.match.id}
                                      className="rounded-xl bg-white p-4"
                                    >
                                      <div className="flex items-start justify-between gap-3">

                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-bold text-black">
                                              {item.match.sport ===
                                              "tennis"
                                                ? "🎾 Tennis"
                                                : "🟢 Padel"}
                                            </span>

                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                              {item.match.format ===
                                              "singles"
                                                ? "Simple"
                                                : "Double"}
                                            </span>
                                          </div>

                                          <p className="mt-2 text-sm text-gray-600">
                                            vs{" "}
                                            {item.opponentName}
                                          </p>
                                        </div>

                                        <span
                                          className={`shrink-0 text-sm font-bold ${
                                            item.result ===
                                            "Victoire"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {item.result}
                                        </span>
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {item.scores.map(
                                          (
                                            score,
                                            scoreIndex
                                          ) => (
                                            <span
                                              key={`${item.match.id}-${scoreIndex}`}
                                              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700"
                                            >
                                              Set{" "}
                                              {scoreIndex + 1} :{" "}
                                              {score}
                                            </span>
                                          )
                                        )}
                                      </div>

                                      <p className="mt-3 text-xs text-gray-400">
                                        {new Date(
                                          item.match.created_at
                                        ).toLocaleDateString(
                                          "fr-FR"
                                        )}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* POINTS EXPLANATION */}

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              💡
            </div>

            <div>
              <p className="font-bold text-black">
                Comment fonctionnent les points ?
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Une victoire rapporte{" "}
                <strong>+25 points</strong> et une
                défaite fait perdre{" "}
                <strong>20 points</strong>.
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Des bonus récompensent les grosses
                performances : bulle, double bulle,
                victoire propre, série de victoires
                et victoire contre un joueur mieux
                classé.
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Les défaites peuvent également
entraîner des malus selon le score
et le niveau de l&apos;adversaire.
              </p>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Plus tes points augmentent, plus tu
                montes dans les divisions : Bronze,
                Argent, Or, Platine puis Diamant.
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-gray-700">
                👑 Le joueur actuellement premier est
                le Champion. Son compteur indique
                combien de matchs il a conservé la
                première place.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}