"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import SportIcon from "@/app/components/SportIcon";
import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import { useSportMode } from "@/app/context/SportModeContext";

import { createClient } from "@/src/supabase/client";

type Sport =
  | "tennis"
  | "padel"
  | "super_tiebreak";

type Match = {
  id: string;
  sport: Sport;
  format: "singles" | "doubles";
  created_at: string;
};

type DashboardProfile = {
  username: string | null;
  first_name: string | null;
};

type RankingPlayer = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type RankingHistory = {
  id: string;
  match_id: string;
  player_id: string;
  sport: Sport;
  old_points: number;
  new_points: number;
  points_change: number;
  created_at: string;
};

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
};

function getPlayerName(player: RankingPlayer | null) {
  if (!player) return "Joueur";

  const fullName = [
    player.first_name,
    player.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || player.username || "Joueur";
}

/*
 * Récupère les points actuels depuis ranking_history.
 *
 * IMPORTANT :
 * On utilise new_points et non points_change.
 */
function getPlayerPoints(
  pointsByPlayerAndSport: Map<
    string,
    Map<Sport, RankingHistory>
  >,
  playerId: string,
  sport: Sport
): number | null {
  return (
    pointsByPlayerAndSport
      .get(playerId)
      ?.get(sport)
      ?.new_points ?? null
  );
}

function PlusIcon({
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function UsersIcon({
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
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2.5 20c.7-3.5 2.9-5.5 6.5-5.5s5.8 2 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 6.8" />
      <path d="M17 14.8c2.7.5 4.1 2.2 4.5 5.2" />
    </svg>
  );
}

function ChevronDownIcon({
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ArrowUpIcon({
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
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
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

function ProfileIcon({
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
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.8 3.1-5.8 7-5.8s6.2 2 7 5.8" />
    </svg>
  );
}

export default function DashboardPage() {
  const { mode } = useSportMode();

  const [matches, setMatches] = useState<Match[]>([]);
  const [rankingMatches, setRankingMatches] =
    useState<Match[]>([]);

  const [profile, setProfile] =
    useState<DashboardProfile | null>(null);

  const [rankingPlayers, setRankingPlayers] =
    useState<RankingPlayer[]>([]);

  const [rankingHistory, setRankingHistory] =
    useState<RankingHistory[]>([]);

  const [friendships, setFriendships] =
    useState<Friendship[]>([]);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [selectedFriendId, setSelectedFriendId] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setCurrentUserId(user.id);

      /*
       * PROFIL
       *
       * Les points du profil ne sont pas utilisés
       * comme source de vérité pour le classement.
       */
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "username, first_name"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Erreur récupération du profil :",
          profileError
        );
      } else {
        setProfile({
          username: profileData.username ?? null,
          first_name: profileData.first_name ?? null,
        });
      }

      /*
       * TOUS LES JOUEURS
       *
       * Les points profiles.points_xxx ne sont plus
       * nécessaires ici.
       */
      const {
        data: rankingData,
        error: rankingError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, first_name, last_name"
        );

      if (rankingError) {
        console.error(
          "Erreur récupération du classement :",
          rankingError
        );
      } else {
        setRankingPlayers(
          (rankingData ?? []) as RankingPlayer[]
        );
      }

      /*
       * HISTORIQUE DU CLASSEMENT
       *
       * ranking_history.new_points est la source
       * de vérité des points actuels.
       */
      const {
        data: rankingHistoryData,
        error: rankingHistoryError,
      } = await supabase
        .from("ranking_history")
        .select(
          "id, match_id, player_id, sport, old_points, new_points, points_change, created_at"
        )
        .order("created_at", {
          ascending: true,
        });

      if (rankingHistoryError) {
        console.error(
          "Erreur récupération de ranking_history :",
          rankingHistoryError
        );
      } else {
        setRankingHistory(
          (rankingHistoryData ?? []) as RankingHistory[]
        );
      }

      /*
       * MATCHS UTILISÉS POUR DÉTERMINER
       * LE DERNIER POINT DE CHAQUE JOUEUR.
       *
       * On utilise matches.created_at plutôt que
       * ranking_history.created_at.
       */
      const {
        data: rankingMatchesData,
        error: rankingMatchesError,
      } = await supabase
        .from("matches")
        .select(
          "id, sport, format, created_at"
        )
        .order("created_at", {
          ascending: true,
        });

      if (rankingMatchesError) {
        console.error(
          "Erreur récupération des matchs pour le classement :",
          rankingMatchesError
        );
      } else {
        setRankingMatches(
          (rankingMatchesData ?? []) as Match[]
        );
      }

      /*
       * AMIS
       */
      const {
        data: friendshipsData,
        error: friendshipsError,
      } = await supabase
        .from("friendships")
        .select(
          "id, requester_id, addressee_id, status"
        )
        .or(
          `requester_id.eq.${user.id},addressee_id.eq.${user.id}`
        )
        .eq("status", "accepted");

      if (friendshipsError) {
        console.error(
          "Erreur récupération des amis :",
          friendshipsError
        );
      } else {
        setFriendships(
          (friendshipsData ?? []) as Friendship[]
        );
      }

      /*
       * MATCHS DU JOUEUR
       */
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
        return;
      }

      const playerMatchIds =
        (playerMatches ?? []).map(
          (row) => row.match_id
        );

      if (playerMatchIds.length === 0) {
        setMatches([]);
        return;
      }

      const { data, error } = await supabase
        .from("matches")
        .select(
          "id, sport, format, created_at"
        )
        .in("id", playerMatchIds)
        .order("created_at", {
          ascending: false,
        })
        .limit(20);

      if (error) {
        console.error(
          "Erreur Dashboard matches :",
          error
        );
        return;
      }

      setMatches((data ?? []) as Match[]);
    }

    void loadDashboard();
  }, []);

  /*
   * ============================================================
   * POINTS ACTUELS PAR JOUEUR / SPORT
   * ============================================================
   *
   * On cherche le dernier match chronologique
   * de chaque joueur et de chaque sport.
   *
   * Source des points :
   *
   * ranking_history.new_points
   *
   * Chronologie :
   *
   * matches.created_at
   *
   * Départage si même timestamp :
   *
   * matches.id
   */
  const pointsByPlayerAndSport = useMemo(() => {
    const map = new Map<
      string,
      Map<Sport, RankingHistory>
    >();

    const matchById = new Map(
      rankingMatches.map((match) => [
        match.id,
        match,
      ])
    );

    for (const history of rankingHistory) {
      if (history.new_points === null) {
        continue;
      }

      let playerMap =
        map.get(history.player_id);

      if (!playerMap) {
        playerMap = new Map<Sport, RankingHistory>();

        map.set(
          history.player_id,
          playerMap
        );
      }

      const previous =
        playerMap.get(history.sport);

      const currentMatch =
        matchById.get(history.match_id);

      const previousMatch = previous
        ? matchById.get(previous.match_id)
        : null;

      /*
       * Si le match n'existe pas,
       * on ne peut pas déterminer sa position
       * chronologique.
       */
      if (!currentMatch) {
        continue;
      }

      /*
       * Premier historique pour ce joueur/sport.
       */
      if (!previous || !previousMatch) {
        playerMap.set(
          history.sport,
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

      /*
       * Le dernier match chronologique
       * donne les points actuels.
       */
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
        playerMap.set(
          history.sport,
          history
        );
      }
    }

    return map;
  }, [
    rankingHistory,
    rankingMatches,
  ]);

  /*
   * MATCHS FILTRÉS PAR SPORT
   */
  const filteredMatches = useMemo(() => {
    return matches
      .filter(
        (match) => match.sport === mode
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [matches, mode]);

  const sportLabel =
    mode === "tennis"
      ? "Tennis"
      : mode === "padel"
        ? "Padel"
        : "Super Tie-Break";

  const sportShortLabel =
    mode === "super_tiebreak"
      ? "STB"
      : sportLabel;

  /*
   * ============================================================
   * POINTS DE L'UTILISATEUR
   * ============================================================
   *
   * ranking_history.new_points
   *
   * 1000 si aucun historique.
   */
  const tennisPoints = currentUserId
    ? getPlayerPoints(
        pointsByPlayerAndSport,
        currentUserId,
        "tennis"
      ) ?? 1000
    : 1000;

  const padelPoints = currentUserId
    ? getPlayerPoints(
        pointsByPlayerAndSport,
        currentUserId,
        "padel"
      ) ?? 1000
    : 1000;

  const superTiebreakPoints = currentUserId
    ? getPlayerPoints(
        pointsByPlayerAndSport,
        currentUserId,
        "super_tiebreak"
      ) ?? 1000
    : 1000;

  const points =
    mode === "tennis"
      ? tennisPoints
      : mode === "padel"
        ? padelPoints
        : superTiebreakPoints;

  /*
   * ============================================================
   * CLASSEMENT
   * ============================================================
   */
  const rankedPlayers = useMemo(() => {
    return rankingPlayers
      .filter(
        (player) =>
          getPlayerPoints(
            pointsByPlayerAndSport,
            player.id,
            mode
          ) !== null
      )
      .sort((a, b) => {
        const aPoints =
          getPlayerPoints(
            pointsByPlayerAndSport,
            a.id,
            mode
          ) ?? 0;

        const bPoints =
          getPlayerPoints(
            pointsByPlayerAndSport,
            b.id,
            mode
          ) ?? 0;

        return bPoints - aPoints;
      });
  }, [
    rankingPlayers,
    mode,
    pointsByPlayerAndSport,
  ]);

  const currentRankIndex = currentUserId
    ? rankedPlayers.findIndex(
        (player) =>
          player.id === currentUserId
      )
    : -1;

  const currentRank =
    currentRankIndex >= 0
      ? currentRankIndex + 1
      : null;

  const totalRankedPlayers =
    rankedPlayers.length;

  /*
   * AMIS
   */
  const acceptedFriendIds = useMemo(() => {
    if (!currentUserId) return [];

    return friendships.map((friendship) =>
      friendship.requester_id === currentUserId
        ? friendship.addressee_id
        : friendship.requester_id
    );
  }, [friendships, currentUserId]);

  const friends = useMemo(() => {
    return acceptedFriendIds
      .map((friendId) =>
        rankingPlayers.find(
          (player) =>
            player.id === friendId
        )
      )
      .filter(
        (
          player
        ): player is RankingPlayer =>
          Boolean(player)
      )
      .filter(
        (player) =>
          getPlayerPoints(
            pointsByPlayerAndSport,
            player.id,
            mode
          ) !== null
      )
      .sort((a, b) => {
        const aPoints =
          getPlayerPoints(
            pointsByPlayerAndSport,
            a.id,
            mode
          ) ?? 0;

        const bPoints =
          getPlayerPoints(
            pointsByPlayerAndSport,
            b.id,
            mode
          ) ?? 0;

        return bPoints - aPoints;
      });
  }, [
    acceptedFriendIds,
    rankingPlayers,
    mode,
    pointsByPlayerAndSport,
  ]);

  const effectiveSelectedFriendId =
    useMemo(() => {
      if (friends.length === 0) return "";

      const selectedStillExists =
        friends.some(
          (friend) =>
            friend.id ===
            selectedFriendId
        );

      return selectedStillExists
        ? selectedFriendId
        : friends[0].id;
    }, [friends, selectedFriendId]);

  const selectedFriend =
    friends.find(
      (friend) =>
        friend.id ===
        effectiveSelectedFriendId
    ) ?? null;

  const selectedFriendRankIndex =
    selectedFriend
      ? rankedPlayers.findIndex(
          (player) =>
            player.id ===
            selectedFriend.id
        )
      : -1;

  const selectedFriendRank =
    selectedFriendRankIndex >= 0
      ? selectedFriendRankIndex + 1
      : null;

  const selectedFriendPoints =
    selectedFriend
      ? getPlayerPoints(
          pointsByPlayerAndSport,
          selectedFriend.id,
          mode
        ) ?? 0
      : 0;

  const pointDifference =
    selectedFriend
      ? points - selectedFriendPoints
      : 0;

  const newMatchHref =
    mode === "super_tiebreak"
      ? "/supertiebreak/new"
      : "/matches/new";

  const displayName =
    profile?.first_name ||
    profile?.username ||
    "Joueur";

  /*
   * Ce pourcentage représente la position
   * dans le classement.
   */
  const rankProgress =
    currentRank && totalRankedPlayers
      ? Math.max(
          5,
          100 -
            ((currentRank - 1) /
              Math.max(
                totalRankedPlayers - 1,
                1
              )) *
              100
        )
      : 0;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />
        <div className="absolute -right-45 top-[35%] h-96 w-96 rounded-full bg-indigo-500/8 blur-[130px]" />
        <div className="absolute -bottom-45 left-[20%] h-96 w-96 rounded-full bg-violet-500/8 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-xl">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[15px] border border-accent/20 bg-accent font-display text-lg font-bold text-[#0b0d13] shadow-[0_0_35px_var(--accent-glow)]">
              <span className="relative z-10">
                S
              </span>

              <div className="absolute inset-0 bg-white/20 blur-md" />
            </div>

            <div className="min-w-0">
              <p className="eyebrow">
                SmashBreakPoint
              </p>

              <h1 className="mt-1 truncate font-display text-lg font-semibold tracking-tight">
                Bonjour, {displayName}
              </h1>
            </div>
          </div>

          <Link
            href="/profile"
            aria-label="Mon profil"
            className="group grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/8 bg-white/4 backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/7 active:scale-95"
          >
            <ProfileIcon className="h-4.75 w-4.75 text-muted transition-colors group-hover:text-foreground" />
          </Link>
        </header>

        <div className="mb-5 flex items-center justify-between gap-3">
          <SportModeSwitcher />

          <Link
            href={newMatchHref}
            className="group flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-[12px] font-bold text-[#0b0d13] shadow-[0_8px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_10px_38px_var(--accent-glow)] active:scale-[0.97]"
          >
            <PlusIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-90" />

            <span>
              {mode === "super_tiebreak"
                ? "Nouveau duel"
                : "Nouveau match"}
            </span>
          </Link>
        </div>

        {/* RANKING HERO */}

        <section className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[#151820]/80 p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-[80px] transition-opacity duration-500 group-hover:bg-accent/15"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
          />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
                  <SportIcon
                    sport={mode}
                    className="h-4 w-4"
                  />
                </div>

                <div>
                  <p className="eyebrow">
                    Classement actuel
                  </p>

                  <p className="mt-0.5 text-[11px] font-medium text-muted">
                    {sportLabel}
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-white/7 bg-white/4 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                {sportShortLabel}
              </span>
            </div>

            <div className="mt-8 flex items-end justify-between gap-5">
              <div>
                <div className="flex items-baseline">
                  <span className="font-display text-[68px] font-bold leading-[0.82] tracking-[-0.06em]">
                    {currentRank ?? "—"}
                  </span>

                  <span className="ml-2 text-sm font-medium text-muted">
                    / {totalRankedPlayers || "—"}
                  </span>
                </div>

                <p className="mt-4 text-xs text-muted">
                  Position dans le classement
                </p>
              </div>

              <div className="text-right">
                <p className="eyebrow">
                  Points
                </p>

                <p className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight text-accent">
                  {points.toLocaleString(
                    "fr-FR"
                  )}
                </p>

                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/8 px-2 py-1 text-[10px] font-semibold text-accent">
                  <ArrowUpIcon />
                  Actuel
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted">
                  Position
                </span>

                <span className="font-display text-[10px] font-semibold text-accent">
                  {Math.round(rankProgress)}%
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-accent shadow-[0_0_18px_var(--accent-glow)] transition-all duration-700"
                  style={{
                    width: `${rankProgress}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-white/6 rounded-2xl border border-white/5 bg-white/3">
              <MiniStat
                value={filteredMatches.length}
                label="Matchs"
              />

              <MiniStat
                value={totalRankedPlayers}
                label="Joueurs"
              />

              <MiniStat
                value={friends.length}
                label="Amis"
              />
            </div>
          </div>
        </section>

        {/* PERFORMANCE GRID */}

        <section className="mt-3 grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-[25px] border border-white/8 bg-white/3.5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="eyebrow">
                Forme récente
              </p>

              <span className="text-[10px] font-semibold text-muted">
                5
              </span>
            </div>

            <div className="mt-7 flex h-12 items-end gap-1.5">
              {Array.from({
                length: 5,
              }).map((_, index) => {
                const hasMatch =
                  index <
                  filteredMatches.length;

                const heights = [
                  "h-4",
                  "h-7",
                  "h-5",
                  "h-10",
                  "h-8",
                ];

                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-md transition-all duration-500 ${
                      hasMatch
                        ? `bg-accent shadow-[0_0_14px_var(--accent-glow)] ${heights[index]}`
                        : "h-3 bg-white/7"
                    }`}
                  />
                );
              })}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              {filteredMatches.length === 0
                ? "Pas encore de match"
                : `${filteredMatches.length} récent${
                    filteredMatches.length > 1
                      ? "s"
                      : ""
                  }`}
            </p>
          </div>

          <Link
            href="/friends"
            className="group relative overflow-hidden rounded-[25px] border border-white/8 bg-white/3.5 p-5 backdrop-blur-xl transition-all duration-300 hover:border-accent/15 hover:bg-white/5 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <p className="eyebrow">
                Communauté
              </p>

              <ArrowRightIcon className="h-3.5 w-3.5 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" />
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="font-display text-3xl font-bold leading-none">
                  {friends.length}
                </p>

                <p className="mt-2 text-[11px] text-muted">
                  {friends.length > 1
                    ? "amis connectés"
                    : "ami connecté"}
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-accent/8 blur-2xl transition-opacity group-hover:bg-accent/15" />
          </Link>
        </section>

        {/* HEAD TO HEAD */}

        <section className="relative mt-3 overflow-hidden rounded-[30px] border border-white/10 bg-[#151820]/80 p-5 backdrop-blur-2xl sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/7 blur-[70px]"
          />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">
                  Face à face
                </p>

                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  Ton duel
                </h2>
              </div>

              <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/7 bg-white/4 text-muted">
                <UsersIcon className="h-4 w-4" />
              </div>
            </div>

            {friends.length === 0 ? (
              <div className="mt-6 overflow-hidden rounded-[22px] border border-white/6 bg-white/3 p-5">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <UsersIcon className="h-5 w-5" />
                </div>

                <p className="mt-5 text-sm font-semibold">
                  Aucun duel disponible
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                  Ajoute des amis pour comparer
                  vos points et vos positions.
                </p>

                <Link
                  href="/friends"
                  className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-xs font-bold text-[#0b0d13] shadow-[0_8px_25px_var(--accent-glow)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Ajouter un ami
                </Link>
              </div>
            ) : (
              <>
                <div className="relative mt-6">
                  <select
                    value={
                      effectiveSelectedFriendId
                    }
                    onChange={(event) =>
                      setSelectedFriendId(
                        event.target.value
                      )
                    }
                    className="min-h-12 w-full appearance-none rounded-2xl border border-white/8 bg-white/4 px-4 pr-11 text-sm font-medium text-foreground outline-none transition-all duration-200 hover:bg-white/6 focus:border-accent/40 focus:bg-white/6"
                  >
                    {friends.map((friend) => (
                      <option
                        key={friend.id}
                        value={friend.id}
                        className="bg-[#151820] text-foreground"
                      >
                        {getPlayerName(friend)}
                      </option>
                    ))}
                  </select>

                  <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                </div>

                {selectedFriend && (
                  <>
                    <div className="relative mt-4 grid grid-cols-2 gap-2.5">
                      <ComparisonCard
                        label="Toi"
                        name={displayName}
                        points={points}
                        rank={currentRank}
                        accent
                      />

                      <ComparisonCard
                        label="Adversaire"
                        name={getPlayerName(
                          selectedFriend
                        )}
                        points={
                          selectedFriendPoints
                        }
                        rank={selectedFriendRank}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/6 bg-white/3 px-4 py-3.5">
                      <div>
                        <p className="eyebrow">
                          Différence
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {pointDifference >= 0
                            ? "Tu as plus de points"
                            : "Ton ami a plus de points"}
                        </p>
                      </div>

                      <span
                        className={`font-display text-lg font-bold tabular-nums ${
                          pointDifference >= 0
                            ? "text-accent"
                            : "text-danger"
                        }`}
                      >
                        {pointDifference >= 0
                          ? "+"
                          : ""}
                        {pointDifference.toLocaleString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* RECENT MATCHES */}

        <section className="mt-3 overflow-hidden rounded-[30px] border border-white/8 bg-white/3.5 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">
                Activité
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Derniers matchs
              </h2>
            </div>

            <Link
              href="/matches"
              className="group flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent"
            >
              Tout voir

              <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-white/8 bg-white/2 px-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/7 bg-white/4 text-muted">
                <SportIcon sport={mode} />
              </div>

              <p className="mt-4 text-sm font-semibold">
                Aucun match enregistré
              </p>

              <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
                Ton historique apparaîtra ici
                après ton premier match.
              </p>

              <Link
                href={newMatchHref}
                className="mt-5 flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-xs font-bold text-[#0b0d13] shadow-[0_8px_25px_var(--accent-glow)] transition-all hover:brightness-105 active:scale-[0.97]"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Ajouter un match
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {filteredMatches
                .slice(0, 3)
                .map((match, index) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="group flex items-center gap-3 rounded-[20px] border border-white/5 bg-white/3 px-3.5 py-3.5 transition-all duration-200 hover:border-white/10 hover:bg-white/5"
                  >
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/8 text-accent">
                      <SportIcon
                        sport={match.sport}
                        className="h-4 w-4"
                      />

                      {index === 0 && (
                        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {match.format ===
                          "doubles"
                            ? "Match en double"
                            : "Match en simple"}
                        </p>

                        {index === 0 && (
                          <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.12em] text-accent">
                            Récent
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[10px] text-muted">
                        {new Date(
                          match.created_at
                        ).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    <div className="grid h-8 w-8 place-items-center rounded-full border border-white/6 text-muted transition-all group-hover:border-accent/20 group-hover:text-accent">
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </section>

        {/* SPORT RANKINGS */}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">
                Tes classements
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold">
                Tous tes sports
              </h2>
            </div>

            <span className="text-[10px] text-muted">
              3 disciplines
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                label: "Tennis",
                value: tennisPoints,
                sport: "tennis" as const,
              },
              {
                label: "Padel",
                value: padelPoints,
                sport: "padel" as const,
              },
              {
                label: "Super Tie-Break",
                value: superTiebreakPoints,
                sport: "super_tiebreak" as const,
              },
            ].map((item) => {
              const isActive =
                item.sport === mode;

              return (
                <div
                  key={item.sport}
                  className={`group relative overflow-hidden rounded-[22px] border p-4 transition-all duration-300 ${
                    isActive
                      ? "border-accent/20 bg-accent/6 shadow-[0_10px_35px_-20px_var(--accent-glow)]"
                      : "border-white/6 bg-white/3 hover:border-white/10 hover:bg-white/4"
                  }`}
                >
                  {isActive && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-0.5 bg-accent shadow-[0_0_15px_var(--accent)]"
                    />
                  )}

                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          isActive
                            ? "bg-accent/10 text-accent"
                            : "bg-white/4 text-muted"
                        }`}
                      >
                        <SportIcon
                          sport={item.sport}
                          className="h-4 w-4"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-[10px] text-muted">
                          {isActive
                            ? "Sport actif"
                            : "Classement disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-display text-xl font-bold tabular-nums ${
                          isActive
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        {item.value.toLocaleString(
                          "fr-FR"
                        )}
                      </p>

                      <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-muted">
                        points
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="px-3 py-3.5 text-center">
      <p className="font-display text-lg font-bold leading-none tabular-nums">
        {value}
      </p>

      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
    </div>
  );
}

function ComparisonCard({
  label,
  name,
  points,
  rank,
  accent = false,
}: {
  label: string;
  name: string;
  points: number;
  rank: number | null;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border p-4 ${
        accent
          ? "border-accent/20 bg-accent/6"
          : "border-white/6 bg-white/3"
      }`}
    >
      {accent && (
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/10 blur-2xl"
        />
      )}

      <div className="relative">
        <p className="eyebrow">
          {label}
        </p>

        <p className="mt-2 truncate text-sm font-semibold">
          {name}
        </p>

        <p
          className={`mt-5 font-display text-[25px] font-bold leading-none tabular-nums ${
            accent
              ? "text-accent"
              : "text-foreground"
          }`}
        >
          {points.toLocaleString("fr-FR")}
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-muted">
            Position
          </span>

          <span className="text-[10px] font-semibold text-foreground">
            {rank ? `#${rank}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}