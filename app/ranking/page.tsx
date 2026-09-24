"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";

type Sport = "tennis" | "padel" | "super_tiebreak";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
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

type ChampionHistory = {
  id: string;
  player_id: string;
  sport: Sport;
  started_at: string;
  ended_at: string | null;
  matches_as_champion: number;
};

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
  const { mode } = useSportMode();

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [championHistory, setChampionHistory] = useState<
    ChampionHistory[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [expandedPlayerId, setExpandedPlayerId] =
    useState<string | null>(null);

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
          "id, first_name, last_name, username, points_tennis, points_padel, points_super_tiebreak"
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
    if (mode === "tennis") {
      return player.points_tennis ?? 1000;
    }

    if (mode === "padel") {
      return player.points_padel ?? 1000;
    }

    return player.points_super_tiebreak ?? 1000;
  }

  function getSportLabel() {
    if (mode === "tennis") {
      return "Tennis";
    }

    if (mode === "padel") {
      return "Padel";
    }

    return "Super Tie-Break";
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
    const champion = getChampion(mode);

    return champion?.player_id === playerId;
  }

  function getChampionStreak(playerId: string) {
    const champion = championHistory.find(
      (item) =>
        item.sport === mode &&
        item.player_id === playerId &&
        item.ended_at === null
    );

    return champion?.matches_as_champion ?? 0;
  }

  function getChampionStartedAt(playerId: string) {
    const champion = championHistory.find(
      (item) =>
        item.sport === mode &&
        item.player_id === playerId &&
        item.ended_at === null
    );

    return champion?.started_at ?? null;
  }

  function getPlayerMatches(playerId: string) {
    const modeMatchIds = new Set(
      matches
        .filter((match) => match.sport === mode)
        .map((match) => match.id)
    );

    const playerMatchIds = new Set(
      matchPlayers
        .filter(
          (matchPlayer) =>
            matchPlayer.player_id === playerId &&
            modeMatchIds.has(matchPlayer.match_id)
        )
        .map((matchPlayer) => matchPlayer.match_id)
    );

    return matches
      .filter((match) => playerMatchIds.has(match.id))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
  }

  function getOpponentNames(
    playerId: string,
    matchId: string
  ) {
    const currentPlayer = matchPlayers.find(
      (matchPlayer) =>
        matchPlayer.match_id === matchId &&
        matchPlayer.player_id === playerId
    );

    if (!currentPlayer) {
      return "Adversaire";
    }

    const opponentIds = matchPlayers
      .filter(
        (matchPlayer) =>
          matchPlayer.match_id === matchId &&
          matchPlayer.player_id !== null &&
          matchPlayer.player_id !== playerId &&
          matchPlayer.team !== currentPlayer.team
      )
      .map((matchPlayer) => matchPlayer.player_id);

    const opponentNames = opponentIds
      .map((opponentId) =>
        players.find(
          (player) => player.id === opponentId
        )
      )
      .filter(Boolean)
      .map((player) => getPlayerName(player!));

    if (opponentNames.length === 0) {
      return "Adversaire";
    }

    return opponentNames.join(" & ");
  }

  function getFormatLabel(format: Match["format"]) {
    return format === "doubles" ? "Double" : "Simple";
  }

  function getRecentConfrontations(playerId: string) {
    return getPlayerMatches(playerId).slice(0, 3);
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

  const sportLabel = getSportLabel();

  const modeMatchIds = new Set(
    matches
      .filter((match) => match.sport === mode)
      .map((match) => match.id)
  );

  const activePlayerIds = new Set(
    matchPlayers
      .filter(
        (matchPlayer) =>
          matchPlayer.player_id !== null &&
          modeMatchIds.has(matchPlayer.match_id)
      )
      .map((matchPlayer) => matchPlayer.player_id)
  );

  const rankedPlayers = players
    .filter((player) => activePlayerIds.has(player.id))
    .sort(
      (a, b) =>
        getPlayerPoints(b) -
        getPlayerPoints(a)
    );

  const podium = rankedPlayers.slice(0, 3);

  const topPlayer = rankedPlayers[0] ?? null;

  /*
   * Le champion est maintenant actif dans les 3 modes :
   * Tennis, Padel et Super Tie-Break.
   */
  const currentChampion = getChampion(mode);

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
              <SportIcon
                sport={mode}
                className="h-5 w-5"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Classement
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                {sportLabel}
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted">
            Gagne des points à chaque match et grimpe
            progressivement dans le classement {sportLabel}.
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
                    N°1 {sportLabel}
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-accent/10 px-4 py-3 text-right">
                  <p className="text-2xl font-bold text-accent">
                    {getPlayerPoints(currentChampionPlayer)}
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
                <Link
                  href={`/ranking/player/${podium[1].id}`}
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
                </Link>
              )}

              {/* 1ST */}

              {podium[0] && (
                <Link
                  href={`/ranking/player/${podium[0].id}`}
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
                </Link>
              )}

              {/* 3RD */}

              {podium[2] && (
                <Link
                  href={`/ranking/player/${podium[2].id}`}
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
                </Link>
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
                const playerPoints =
                  getPlayerPoints(player);

                const division =
                  getDivision(playerPoints);

                const playerIsChampion =
                  isChampion(player.id);

                const isExpanded =
                  expandedPlayerId === player.id;

                const recentMatches =
                  isExpanded
                    ? getRecentConfrontations(player.id)
                    : [];

                return (
                  <div
                    key={player.id}
                    className="border-b border-border last:border-b-0"
                  >
                    {/* MAIN ROW */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPlayerId(
                          isExpanded
                            ? null
                            : player.id
                        )
                      }
                      className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-surface-2"
                    >
                      {/* POSITION */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-sm font-bold text-muted">
                        {index + 1}
                      </div>

                      {/* PLAYER */}

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

                      {/* POINTS */}

                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {playerPoints}
                        </p>

                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                          points
                        </p>
                      </div>

                      {/* ARROW */}

                      <div className="shrink-0 text-muted">
                        <ChevronDownIcon
                          open={isExpanded}
                        />
                      </div>
                    </button>

                    {/* EXPANDED CONTENT */}

                    {isExpanded && (
                      <div className="border-t border-border bg-surface-2 px-4 pb-4 pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                              Dernières confrontations
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {sportLabel}
                            </p>
                          </div>

                          <Link
                            href={`/ranking/player/${player.id}`}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="shrink-0 rounded-xl bg-accent/10 px-3 py-2 text-[11px] font-bold text-accent transition hover:bg-accent/20"
                          >
                            Profil complet
                          </Link>
                        </div>

                        {recentMatches.length === 0 ? (
                          <div className="mt-3 rounded-2xl bg-surface p-4">
                            <p className="text-sm text-muted">
                              Aucune confrontation récente.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {recentMatches.map((match) => (
                              <Link
                                key={match.id}
                                href={`/matches/${match.id}`}
                                className="flex items-center gap-3 rounded-2xl bg-surface p-3 transition hover:bg-background"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xs font-bold text-muted">
                                  {match.format ===
                                  "doubles"
                                    ? "D"
                                    : "S"}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">
                                    vs{" "}
                                    {getOpponentNames(
                                      player.id,
                                      match.id
                                    )}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-muted">
                                    {getFormatLabel(
                                      match.format
                                    )}{" "}
                                    ·{" "}
                                    {new Date(
                                      match.created_at
                                    ).toLocaleDateString(
                                      "fr-FR"
                                    )}
                                  </p>
                                </div>

                                <ChevronRightIcon />
                              </Link>
                            ))}
                          </div>
                        )}

                        <Link
                          href={`/ranking/player/${player.id}`}
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          className="mt-3 flex min-h-11 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-bold transition hover:bg-background"
                        >
                          Voir le profil complet →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* POINTS HISTORY */}

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

              {mode === "super_tiebreak" ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Le classement Super Tie-Break utilise
                    son propre système de points, indépendant
                    des classements Tennis et Padel.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-muted">
                    Les résultats Super Tie-Break
                    n&apos;affectent donc pas tes points
                    Tennis ou Padel.
                  </p>
                </>
              ) : (
                <>
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
                </>
              )}

              <p className="mt-3 text-sm leading-6 text-muted">
                Plus tes points augmentent, plus tu montes
                dans les divisions : Bronze, Argent, Or,
                Platine puis Diamant.
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