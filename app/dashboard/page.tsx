"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  AnimatePresence,
  motion,
  type Variants,
} from "motion/react";

import SportIcon from "@/app/components/SportIcon";
import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import { useSportMode } from "@/app/context/SportModeContext";

import { createClient } from "@/src/supabase/client";

import EloChart from "./_components/EloChart";

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

const DEMO_USER_ID = "demo-user";

const DEMO_PLAYERS: RankingPlayer[] = [
  {
    id: DEMO_USER_ID,
    username: "alex",
    first_name: "Alex",
    last_name: null,
  },
  {
    id: "demo-lucas",
    username: "lucas",
    first_name: "Lucas",
    last_name: null,
  },
  {
    id: "demo-thomas",
    username: "thomas",
    first_name: "Thomas",
    last_name: null,
  },
  {
    id: "demo-hugo",
    username: "hugo",
    first_name: "Hugo",
    last_name: null,
  },
  {
    id: "demo-maxime",
    username: "maxime",
    first_name: "Maxime",
    last_name: null,
  },
];

const DEMO_MATCHES: Match[] = [
  {
    id: "demo-match-1",
    sport: "tennis",
    format: "singles",
    created_at: "2026-09-08T18:00:00Z",
  },
  {
    id: "demo-match-2",
    sport: "tennis",
    format: "singles",
    created_at: "2026-09-12T18:00:00Z",
  },
  {
    id: "demo-match-3",
    sport: "tennis",
    format: "singles",
    created_at: "2026-09-17T18:00:00Z",
  },
  {
    id: "demo-match-4",
    sport: "tennis",
    format: "singles",
    created_at: "2026-09-22T18:00:00Z",
  },
  {
    id: "demo-match-5",
    sport: "tennis",
    format: "singles",
    created_at: "2026-09-28T18:00:00Z",
  },

  {
    id: "demo-padel-1",
    sport: "padel",
    format: "doubles",
    created_at: "2026-09-09T18:00:00Z",
  },
  {
    id: "demo-padel-2",
    sport: "padel",
    format: "doubles",
    created_at: "2026-09-15T18:00:00Z",
  },
  {
    id: "demo-padel-3",
    sport: "padel",
    format: "doubles",
    created_at: "2026-09-21T18:00:00Z",
  },
  {
    id: "demo-padel-4",
    sport: "padel",
    format: "doubles",
    created_at: "2026-09-29T18:00:00Z",
  },

  {
    id: "demo-stb-1",
    sport: "super_tiebreak",
    format: "singles",
    created_at: "2026-09-10T18:00:00Z",
  },
  {
    id: "demo-stb-2",
    sport: "super_tiebreak",
    format: "singles",
    created_at: "2026-09-18T18:00:00Z",
  },
  {
    id: "demo-stb-3",
    sport: "super_tiebreak",
    format: "singles",
    created_at: "2026-09-27T18:00:00Z",
  },
];

const DEMO_HISTORY: RankingHistory[] = [
  {
    id: "demo-history-1",
    match_id: "demo-match-1",
    player_id: DEMO_USER_ID,
    sport: "tennis",
    old_points: 1000,
    new_points: 1018,
    points_change: 18,
    created_at: "2026-09-08T18:00:00Z",
  },
  {
    id: "demo-history-2",
    match_id: "demo-match-2",
    player_id: DEMO_USER_ID,
    sport: "tennis",
    old_points: 1018,
    new_points: 1009,
    points_change: -9,
    created_at: "2026-09-12T18:00:00Z",
  },
  {
    id: "demo-history-3",
    match_id: "demo-match-3",
    player_id: DEMO_USER_ID,
    sport: "tennis",
    old_points: 1009,
    new_points: 1031,
    points_change: 22,
    created_at: "2026-09-17T18:00:00Z",
  },
  {
    id: "demo-history-4",
    match_id: "demo-match-4",
    player_id: DEMO_USER_ID,
    sport: "tennis",
    old_points: 1031,
    new_points: 1044,
    points_change: 13,
    created_at: "2026-09-22T18:00:00Z",
  },
  {
    id: "demo-history-5",
    match_id: "demo-match-5",
    player_id: DEMO_USER_ID,
    sport: "tennis",
    old_points: 1044,
    new_points: 1061,
    points_change: 17,
    created_at: "2026-09-28T18:00:00Z",
  },

  {
    id: "demo-padel-history-1",
    match_id: "demo-padel-1",
    player_id: DEMO_USER_ID,
    sport: "padel",
    old_points: 1000,
    new_points: 1014,
    points_change: 14,
    created_at: "2026-09-09T18:00:00Z",
  },
  {
    id: "demo-padel-history-2",
    match_id: "demo-padel-2",
    player_id: DEMO_USER_ID,
    sport: "padel",
    old_points: 1014,
    new_points: 1028,
    points_change: 14,
    created_at: "2026-09-15T18:00:00Z",
  },
  {
    id: "demo-padel-history-3",
    match_id: "demo-padel-3",
    player_id: DEMO_USER_ID,
    sport: "padel",
    old_points: 1028,
    new_points: 1021,
    points_change: -7,
    created_at: "2026-09-21T18:00:00Z",
  },
  {
    id: "demo-padel-history-4",
    match_id: "demo-padel-4",
    player_id: DEMO_USER_ID,
    sport: "padel",
    old_points: 1021,
    new_points: 1062,
    points_change: 41,
    created_at: "2026-09-29T18:00:00Z",
  },

  {
    id: "demo-stb-history-1",
    match_id: "demo-stb-1",
    player_id: DEMO_USER_ID,
    sport: "super_tiebreak",
    old_points: 1000,
    new_points: 1032,
    points_change: 32,
    created_at: "2026-09-10T18:00:00Z",
  },
  {
    id: "demo-stb-history-2",
    match_id: "demo-stb-2",
    player_id: DEMO_USER_ID,
    sport: "super_tiebreak",
    old_points: 1032,
    new_points: 1057,
    points_change: 25,
    created_at: "2026-09-18T18:00:00Z",
  },
  {
    id: "demo-stb-history-3",
    match_id: "demo-stb-3",
    player_id: DEMO_USER_ID,
    sport: "super_tiebreak",
    old_points: 1057,
    new_points: 1112,
    points_change: 55,
    created_at: "2026-09-27T18:00:00Z",
  },
];


/*
 * ============================================================
 * ANIMATIONS
 * ============================================================
 */

const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

const sectionVariantsDelayed = (
  delay: number
): Variants => ({
  hidden: {
    opacity: 0,
    y: 18,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay,
      ease: "easeOut",
    },
  },
});

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getPlayerName(
  player: RankingPlayer | null
) {
  if (!player) return "Joueur";

  const fullName = [
    player.first_name,
    player.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    player.username ||
    "Joueur"
  );
}

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

/*
 * ============================================================
 * ICONS
 * ============================================================
 */

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

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function DashboardPage() {
  const { mode } = useSportMode();

  const router = useRouter();
  const searchParams = useSearchParams();

  const isDemoMode =
    searchParams.get("demo") === "true";

  const [matches, setMatches] =
    useState<Match[]>([]);

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

  /*
   * IDs de tous les matchs du joueur.
   *
   * Important :
   * matches contient uniquement les 20 derniers matchs
   * affichables sur le dashboard.
   *
   * userMatchIds permet donc de calculer les vrais totaux
   * indépendamment de cette limite de 20.
   */
  const [userMatchIds, setUserMatchIds] =
    useState<string[]>([]);

  const [selectedFriendId, setSelectedFriendId] =
    useState("");

  const [now] = useState(() => Date.now());

  /*
   * ============================================================
   * LOAD DASHBOARD
   * ============================================================
   */

  useEffect(() => {
  async function loadDashboard() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    /*
     * ==========================================================
     * MODE RÉEL
     * ==========================================================
     *
     * Si aucun utilisateur n'est connecté et que le paramètre
     * ?demo=true n'est pas présent, on retourne à la landing.
     */
    if (!user && !isDemoMode) {
      router.replace("/");
      return;
    }

    /*
     * ==========================================================
     * MODE DÉMO
     * ==========================================================
     *
     * La démo est volontairement explicite.
     *
     * Elle ne fait aucune écriture Supabase et utilise uniquement
     * les données fictives définies plus haut dans le fichier.
     */
    if (!user && isDemoMode) {
      setCurrentUserId(DEMO_USER_ID);

      setProfile({
        username: "alex",
        first_name: "Alex",
      });

      setRankingPlayers(DEMO_PLAYERS);

      setRankingHistory(DEMO_HISTORY);

      setRankingMatches(DEMO_MATCHES);

      setMatches(DEMO_MATCHES);

      setUserMatchIds(
        DEMO_MATCHES.map(
          (match) => match.id
        )
      );

      setFriendships([
        {
          id: "demo-friendship-1",
          requester_id: DEMO_USER_ID,
          addressee_id: "demo-lucas",
          status: "accepted",
        },
        {
          id: "demo-friendship-2",
          requester_id: DEMO_USER_ID,
          addressee_id: "demo-thomas",
          status: "accepted",
        },
      ]);

      return;
    }

    /*
     * ==========================================================
     * MODE UTILISATEUR CONNECTÉ
     * ==========================================================
     *
     * Même si ?demo=true est présent, un utilisateur réellement
     * connecté utilise toujours ses données réelles.
     */
    if (!user) {
      return;
    }

    setCurrentUserId(user.id);

    /*
     * PROFIL
     */
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("username, first_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "Erreur récupération du profil :",
        profileError
      );
    } else {
      setProfile({
        username:
          profileData.username ?? null,
        first_name:
          profileData.first_name ?? null,
      });
    }

    /*
     * TOUS LES JOUEURS
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
        (rankingData ??
          []) as RankingPlayer[]
      );
    }

    /*
     * HISTORIQUE DU CLASSEMENT
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
        (rankingHistoryData ??
          []) as RankingHistory[]
      );
    }

    /*
     * MATCHS UTILISÉS POUR LA CHRONOLOGIE
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
        (rankingMatchesData ??
          []) as Match[]
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
        (friendshipsData ??
          []) as Friendship[]
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

    /*
     * Tous les IDs servent aux statistiques.
     */
    setUserMatchIds(playerMatchIds);

    if (playerMatchIds.length === 0) {
      setMatches([]);
      return;
    }

    /*
     * On ne charge que les 20 derniers matchs
     * pour la liste affichée.
     */
    const {
      data,
      error,
    } = await supabase
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
}, [isDemoMode, router]);

  /*
   * ============================================================
   * POINTS ACTUELS PAR JOUEUR / SPORT
   * ============================================================
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
        playerMap =
          new Map<Sport, RankingHistory>();

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

      if (!currentMatch) {
        continue;
      }

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

      if (
        currentMatchTime >
          previousMatchTime ||
        (currentMatchTime ===
          previousMatchTime &&
          currentMatch.id >
            previousMatch.id)
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
   * ============================================================
   * MATCHS RÉCENTS PAR SPORT
   * ============================================================
   */

  const filteredMatches = useMemo(() => {
    return matches
      .filter(
        (match) => match.sport === mode
      )
      .sort(
        (a, b) =>
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
      )
      .slice(0, 5);
  }, [matches, mode]);

  /*
   * ============================================================
   * LIBELLÉS SPORT
   * ============================================================
   */

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
   * MATCHS TOTAUX DU SPORT ACTIF
   * ============================================================
   *
   * Contrairement à filteredMatches, cette valeur ne dépend
   * PAS de la limite des 20 matchs chargés pour l'affichage.
   */

  const totalMatchesForMode = useMemo(() => {
    if (
      userMatchIds.length === 0 ||
      rankingMatches.length === 0
    ) {
      return 0;
    }

    const userMatchIdSet =
      new Set(userMatchIds);

    return rankingMatches.filter(
      (match) =>
        match.sport === mode &&
        userMatchIdSet.has(match.id)
    ).length;
  }, [
    userMatchIds,
    rankingMatches,
    mode,
  ]);

  /*
   * ============================================================
   * POINTS UTILISATEUR
   * ============================================================
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

  const superTiebreakPoints =
    currentUserId
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

  const currentRankIndex =
    currentUserId
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
   * ============================================================
   * AMIS
   * ============================================================
   */

  const acceptedFriendIds = useMemo(() => {
    if (!currentUserId) return [];

    return friendships.map((friendship) =>
      friendship.requester_id ===
      currentUserId
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
      if (friends.length === 0) {
        return "";
      }

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

  const actionHref = isDemoMode
  ? "/signup"
  : newMatchHref;

  const displayName =
    profile?.first_name ||
    profile?.username ||
    "Joueur";

  /*
   * ============================================================
   * PERFORMANCE / PROGRESSION
   * ============================================================
   */

  const matchById = useMemo(() => {
    return new Map(
      rankingMatches.map((match) => [
        match.id,
        match,
      ])
    );
  }, [rankingMatches]);

  /*
   * Historique utilisateur du mode actif.
   */
  const userHistory = useMemo(() => {
    if (!currentUserId) return [];

    return rankingHistory
      .filter(
        (item) =>
          item.player_id ===
            currentUserId &&
          item.sport === mode &&
          matchById.has(item.match_id)
      )
      .sort((a, b) => {
        const matchA =
          matchById.get(a.match_id);

        const matchB =
          matchById.get(b.match_id);

        if (!matchA || !matchB) {
          return 0;
        }

        const timeA = new Date(
          matchA.created_at
        ).getTime();

        const timeB = new Date(
          matchB.created_at
        ).getTime();

        if (timeA !== timeB) {
          return timeA - timeB;
        }

        return a.match_id.localeCompare(
          b.match_id
        );
      });
  }, [
    rankingHistory,
    currentUserId,
    mode,
    matchById,
  ]);

  /*
   * ============================================================
   * GRAPHIQUE
   * ============================================================
   */

  const progressionPoints = useMemo(() => {
    return userHistory.map(
      (item, index) => {
        const match =
          matchById.get(item.match_id);

        const label = match
          ? new Date(
              match.created_at
            ).toLocaleDateString(
              "fr-FR",
              {
                day: "numeric",
                month: "short",
              }
            )
          : `Match ${index + 1}`;

        return {
          label,
          elo: item.new_points,
        };
      }
    );
  }, [userHistory, matchById]);

  const latestHistory =
    userHistory[
      userHistory.length - 1
    ] ?? null;

  const firstHistory =
    userHistory[0] ?? null;

  /*
   * Progression totale depuis le premier
   * mouvement de classement.
   */
  const totalProgression =
    latestHistory && firstHistory
      ? latestHistory.new_points -
        firstHistory.old_points
      : 0;

  /*
   * ============================================================
   * FORME RÉCENTE — VRAIES DONNÉES
   * ============================================================
   *
   * Les 5 dernières évolutions de points.
   *
   * On garde l'ordre chronologique :
   * gauche = plus ancien
   * droite = plus récent
   */

  const recentForm = useMemo(() => {
    return userHistory.slice(-5);
  }, [userHistory]);

  const recentFormMaxChange = useMemo(() => {
    if (recentForm.length === 0) {
      return 1;
    }

    return Math.max(
      ...recentForm.map((item) =>
        Math.abs(item.points_change)
      ),
      1
    );
  }, [recentForm]);

  const recentFormPoints = useMemo(() => {
    return recentForm.reduce(
      (total, item) =>
        total + item.points_change,
      0
    );
  }, [recentForm]);

  /*
   * ============================================================
   * STATISTIQUES 7 JOURS
   * ============================================================
   */

  const weekAgo =
    now -
    7 * 24 * 60 * 60 * 1000;

  const weeklyHistory =
    userHistory.filter((item) => {
      const match =
        matchById.get(item.match_id);

      if (!match) return false;

      return (
        new Date(
          match.created_at
        ).getTime() >= weekAgo
      );
    });

  const weeklyPoints =
    weeklyHistory.reduce(
      (total, item) =>
        total + item.points_change,
      0
    );

  const weeklyMatches = new Set(
    weeklyHistory.map(
      (item) => item.match_id
    )
  ).size;

  /*
   * ============================================================
   * PROCHAIN RANG
   * ============================================================
   */

  const nextRankPlayer =
    currentRankIndex > 0
      ? rankedPlayers[
          currentRankIndex - 1
        ]
      : null;

  const nextRankPoints =
    nextRankPlayer
      ? getPlayerPoints(
          pointsByPlayerAndSport,
          nextRankPlayer.id,
          mode
        ) ?? points
      : points;

  const pointsToNextRank =
    nextRankPlayer
      ? Math.max(
          nextRankPoints - points,
          0
        )
      : 0;

  const playerBelow =
    currentRankIndex >= 0
      ? rankedPlayers[
          currentRankIndex + 1
        ]
      : null;

  const pointsBelow =
    playerBelow
      ? getPlayerPoints(
          pointsByPlayerAndSport,
          playerBelow.id,
          mode
        ) ??
        Math.max(
          points - 100,
          0
        )
      : Math.max(
          points - 100,
          0
        );

  /*
   * Progression entre le joueur derrière
   * et le joueur devant.
   */
  const rankRange = Math.max(
    nextRankPoints - pointsBelow,
    1
  );

  const rankProgress =
    currentRank === 1
      ? 100
      : nextRankPlayer
        ? Math.min(
            100,
            Math.max(
              0,
              ((points - pointsBelow) /
                rankRange) *
                100
            )
          )
        : 0;

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5">
      {/* ====================================================== */}
      {/* BACKGROUND */}
      {/* ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />

        <div className="absolute -right-45 top-[35%] h-96 w-96 rounded-full bg-indigo-500/8 blur-[130px]" />

        <div className="absolute -bottom-45 left-[20%] h-96 w-96 rounded-full bg-violet-500/8 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-xl">
        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/icons/icon-192.png"
              alt="Logo SmashBreakPoint"
              width={44}
              height={44}
              priority
              className="h-11 w-11 shrink-0 rounded-[15px] border border-accent/20 object-cover shadow-[0_0_35px_var(--accent-glow)]"
            />

            <div className="min-w-0">
              <p className="eyebrow">
                SmashBreakPoint
              </p>

              <h1 className="mt-1 truncate font-display text-lg font-semibold tracking-tight">
                Bonjour, {displayName}
              </h1>
              {isDemoMode && (
  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/15 bg-accent/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-accent">
    <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
    Mode démo
  </div>
)}
            </div>
          </div>

          <Link
  href={isDemoMode ? "/signup" : "/profile"}
            aria-label="Mon profil"
            className="group grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/8 bg-white/4 backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/7 active:scale-95"
          >
            <ProfileIcon className="h-4.75 w-4.75 text-muted transition-colors group-hover:text-foreground" />
          </Link>
        </motion.header>

        {/* ==================================================== */}
        {/* MODE + NOUVEAU MATCH */}
        {/* ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.05,
          }}
          className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <SportModeSwitcher />

          <Link
            href={newMatchHref}
            className="group flex min-h-9 items-center gap-2 rounded-full bg-accent px-3.5 text-[11px] font-bold text-[#0b0d13] shadow-[0_8px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_10px_38px_var(--accent-glow)] active:scale-[0.97] sm:min-h-10 sm:px-4 sm:text-[12px]"
          >
            <PlusIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-90" />

            <span>
              {isDemoMode
  ? "Créer un compte"
  : mode === "super_tiebreak"
    ? "Nouveau duel"
    : "Nouveau match"}
            </span>
          </Link>
        </motion.div>

        {/* ==================================================== */}
        {/* CONTENU DYNAMIQUE DU MODE */}
        {/* ==================================================== */}

        <AnimatePresence
          mode="wait"
          initial={false}
        >
          <motion.div
  key={mode}
  initial={{
    opacity: 0,
    y: 6,
    filter: "blur(4px)",
  }}
  animate={{
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  }}
  exit={{
    opacity: 0,
    y: -4,
    filter: "blur(2px)",
  }}
  transition={{
    duration: 0.28,
    ease: "easeOut",
  }}
>
            {/* ================================================ */}
            {/* RANKING HERO */}
            {/* ================================================ */}

            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[#151820]/80 p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-6"
            >
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
                      <motion.span
                        key={`rank-${mode}-${currentRank}`}
                        initial={{
  opacity: 0,
  y: 10,
  scale: 0.94,
}}
animate={{
  opacity: 1,
  y: 0,
  scale: 1,
}}
transition={{
  duration: 0.35,
  ease: "easeOut",
}}
                        className="font-display text-[68px] font-bold leading-[0.82] tracking-[-0.06em]"
                      >
                        {currentRank ?? "—"}
                      </motion.span>

                      <span className="ml-2 text-sm font-medium text-muted">
                        / {totalRankedPlayers || "—"}
                      </span>
                    </div>

                    <p className="mt-4 text-xs text-muted">
  {currentRank === 1 ? (
    "Tu occupes la première place"
  ) : nextRankPlayer ? (
    <>
      Encore{" "}
      <span className="font-semibold text-accent">
        {pointsToNextRank.toLocaleString("fr-FR")} pts
      </span>{" "}
      pour atteindre le{" "}
      <span className="font-semibold text-white">
        #{currentRank ? currentRank - 1 : "—"}
      </span>
    </>
  ) : userHistory.length === 0 ? (
    "Ton classement apparaîtra après ton premier match"
  ) : (
    "Position dans le classement"
  )}
</p>
                  </div>

                  <div className="text-right">
                    <p className="eyebrow">
                      Points
                    </p>

                    <motion.p
  key={points}
  initial={{ opacity: 0.7, scale: 0.96 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    duration: 0.3,
    ease: "easeOut",
  }}
  className="mt-2 font-display text-[32px] font-bold leading-none tracking-tight text-accent"
>
  <AnimatedNumber value={points} />
</motion.p>

                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/8 px-2 py-1 text-[10px] font-semibold text-accent">
                      <ArrowUpIcon />
                      Actuel
                    </div>
                  </div>
                </div>

                {/* Progression vers le prochain rang */}
                <div className="mt-8">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted">
                      {currentRank === 1
                        ? "Première place"
                        : nextRankPlayer
                          ? `Vers le #${
                              currentRank
                                ? currentRank - 1
                                : "—"
                            }`
                          : "Progression"}
                    </span>

                    <span className="font-display text-[10px] font-semibold text-accent">
                      {Math.round(
                        rankProgress
                      )}
                      %
                    </span>
                  </div>

                  <div className="relative h-1.5 overflow-hidden rounded-full bg-white/6">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${rankProgress}%` }}
    transition={{
      duration: 0.8,
      ease: "easeOut",
    }}
    className="relative h-full"
  >
    {/* Barre */}
    <div className="absolute inset-0 rounded-full bg-accent" />

    {/* Point de progression */}
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: 0.55,
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
      className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-accent"
    />
  </motion.div>
</div>

                  {nextRankPlayer ? (
                    <div className="mt-2 flex items-center justify-between text-[9px] text-muted">
                      <span>
                        {pointsBelow.toLocaleString(
                          "fr-FR"
                        )}{" "}
                        pts
                      </span>

                      <span className="font-semibold text-accent">
                        {nextRankPoints.toLocaleString(
                          "fr-FR"
                        )}{" "}
                        pts
                      </span>
                    </div>
                  ) : currentRank === 1 ? (
                    <p className="mt-2 text-[9px] text-muted">
                      Tu es actuellement en tête du classement.
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 grid grid-cols-3 divide-x divide-white/6 rounded-2xl border border-white/5 bg-white/3">
                  <MiniStat
                    value={
                      totalMatchesForMode
                    }
                    label="Matchs"
                  />

                  <MiniStat
                    value={
                      totalRankedPlayers
                    }
                    label="Joueurs"
                  />

                  <MiniStat
                    value={friends.length}
                    label="Amis"
                  />
                </div>
              </div>
            </motion.section>

            {/* ================================================ */}
            {/* WEEKLY STATS */}
            {/* ================================================ */}

            <motion.section
              variants={sectionVariantsDelayed(
                0.05
              )}
              initial="hidden"
              animate="visible"
              className="mt-3 grid grid-cols-3 gap-2.5"
            >
              <WeeklyStat
                label="Cette semaine"
                value={
                  weeklyPoints > 0
                    ? `+${weeklyPoints}`
                    : weeklyPoints.toString()
                }
                positive={
                  weeklyPoints > 0
                }
                negative={
                  weeklyPoints < 0
                }
              />

              <WeeklyStat
                label="Matchs"
                value={weeklyMatches}
              />

              <WeeklyStat
                label="Évolution"
                value={
                  totalProgression > 0
                    ? `+${totalProgression}`
                    : totalProgression.toString()
                }
                positive={
                  totalProgression > 0
                }
                negative={
                  totalProgression < 0
                }
              />
            </motion.section>

            {/* ================================================ */}
            {/* PROGRESSION */}
            {/* ================================================ */}

            <motion.div
              variants={sectionVariantsDelayed(
                0.1
              )}
              initial="hidden"
              animate="visible"
              className="mt-3"
            >
              <EloChart
                points={progressionPoints}
                modeLabel={sportLabel}
                weeklyChange={weeklyPoints}
              />
            </motion.div>

            {/* ================================================ */}
            {/* PERFORMANCE GRID */}
            {/* ================================================ */}

            <motion.section
              variants={sectionVariantsDelayed(
                0.12
              )}
              initial="hidden"
              animate="visible"
              className="mt-3 grid grid-cols-2 gap-3"
            >
              {/* FORME RÉCENTE */}
              <div className="relative overflow-hidden rounded-[25px] border border-white/8 bg-white/3.5 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">
                    Forme récente
                  </p>

                  <span className="text-[10px] font-semibold text-muted">
                    {recentForm.length}/5
                  </span>
                </div>

                <div className="mt-7 flex h-12 items-end gap-1.5">
                  {Array.from({
                    length: 5,
                  }).map((_, index) => {
                    const item =
                      recentForm[index];

                    /*
                     * Match inexistant :
                     * barre neutre.
                     */
                    if (!item) {
                      return (
                        <motion.div
                          key={`empty-${index}`}
                          initial={{
                            scaleY: 0,
                            transformOrigin:
                              "bottom",
                          }}
                          animate={{
                            scaleY: 1,
                          }}
                          transition={{
                            duration: 0.4,
                            delay:
                              index * 0.06,
                          }}
                          className="h-3 flex-1 rounded-md bg-white/7"
                        />
                      );
                    }

                    const change =
                      item.points_change;

                    /*
                     * Hauteur proportionnelle à
                     * l'amplitude réelle du changement.
                     *
                     * Minimum visuel de 20%.
                     */
                    const intensity =
                      Math.abs(change) /
                      recentFormMaxChange;

                    const height =
                      20 +
                      intensity * 80;

                    const isPositive =
                      change >= 0;

                    return (
                      <motion.div
                        key={item.id}
                        title={`${
                          change >= 0
                            ? "+"
                            : ""
                        }${change} pts`}
                        initial={{
                          height: 0,
                        }}
                        animate={{
                          height: `${height}%`,
                        }}
                        transition={{
                          duration: 0.55,
                          delay:
                            index * 0.07,
                          ease: "easeOut",
                        }}
                        className={`flex-1 rounded-md shadow-[0_0_14px_var(--accent-glow)] ${
                          isPositive
                            ? "bg-accent"
                            : "bg-danger"
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-[11px] leading-relaxed text-muted">
                    {recentForm.length === 0
                      ? "Pas encore de match"
                      : recentForm.length ===
                          1
                        ? "1 dernier match"
                        : `${recentForm.length} derniers matchs`}
                  </p>

                  {recentForm.length >
                    0 && (
                    <span
                      className={`shrink-0 text-[10px] font-bold tabular-nums ${
                        recentFormPoints > 0
                          ? "text-accent"
                          : recentFormPoints <
                              0
                            ? "text-danger"
                            : "text-muted"
                      }`}
                    >
                      {recentFormPoints >
                      0
                        ? "+"
                        : ""}
                      {recentFormPoints} pts
                    </span>
                  )}
                </div>
              </div>

              {/* AMIS */}
              <Link
  href={isDemoMode ? "/signup" : "/friends"}
                className="group relative overflow-hidden rounded-[25px] border border-white/8 bg-white/3.5 p-5 backdrop-blur-xl transition-all duration-300 hover:border-accent/15 hover:bg-white/5 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <p className="eyebrow">
                    Tes amis
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
            </motion.section>

            {/* ================================================ */}
{/* HEAD TO HEAD */}
{/* ================================================ */}

<motion.section
  variants={sectionVariantsDelayed(0.15)}
  initial="hidden"
  animate="visible"
  className="relative mt-3 overflow-hidden rounded-[30px] border border-white/10 bg-[#151820]/80 p-5 backdrop-blur-2xl sm:p-6"
>
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
          Ajoute des amis pour comparer vos points et vos positions.
        </p>

        <Link
  href={isDemoMode ? "/signup" : "/friends"}
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
            value={effectiveSelectedFriendId}
            onChange={(event) =>
              setSelectedFriendId(event.target.value)
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

        <AnimatePresence mode="wait">
          {selectedFriend && (
            <motion.div
              key={selectedFriend.id}
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -4,
              }}
              transition={{
                duration: 0.22,
                ease: "easeOut",
              }}
            >
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
                  name={getPlayerName(selectedFriend)}
                  points={selectedFriendPoints}
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
                  {pointDifference >= 0 ? "+" : ""}
                  {pointDifference.toLocaleString("fr-FR")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )}
  </div>
</motion.section>

            {/* ================================================ */}
            {/* RECENT MATCHES */}
            {/* ================================================ */}

            <motion.section
              variants={sectionVariantsDelayed(
                0.18
              )}
              initial="hidden"
              animate="visible"
              className="mt-3 overflow-hidden rounded-[30px] border border-white/8 bg-white/3.5 p-5 backdrop-blur-xl sm:p-6"
            >
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
  href={isDemoMode ? "/signup" : "/matches"}
                  className="group flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent"
                >
                  Tout voir

                  <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {filteredMatches.length ===
              0 ? (
                <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-white/8 bg-white/2 px-6 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/7 bg-white/4 text-muted">
                    <SportIcon sport={mode} />
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Aucun match enregistré
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
                    Ton historique apparaîtra
                    ici après ton premier
                    match.
                  </p>

                  <motion.div
  whileHover={{
    y: -1,
    scale: 1.015,
  }}
  whileTap={{
    scale: 0.96,
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 25,
  }}
>
  <Link
  href={actionHref}
  className="group flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-[12px] font-bold text-[#0b0d13] shadow-[0_8px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_10px_38px_var(--accent-glow)] active:scale-[0.97] sm:w-auto"
>
    <motion.span
      whileHover={{
        rotate: 45,
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      <PlusIcon />
    </motion.span>

    Nouveau match
  </Link>
</motion.div>
                </div>
              ) : (
                <div className="mt-5 space-y-2">
                  {filteredMatches
                    .slice(0, 3)
                    .map(
                      (
                        match,
                        index
                      ) => (
                        <motion.div
  key={match.id}
  initial={{
    opacity: 0,
    x: -10,
  }}
  animate={{
    opacity: 1,
    x: 0,
  }}
  transition={{
    duration: 0.3,
    delay: index * 0.06,
  }}
  whileHover={{
    y: -1,
  }}
  whileTap={{
    scale: 0.985,
  }}
>
                          <Link
  href={
    isDemoMode
      ? "/signup"
      : `/matches/${match.id}`
  }
  className="group flex items-center gap-3 rounded-[20px] border border-white/5 bg-white/3 px-3.5 py-3.5 transition-all duration-200 hover:border-white/10 hover:bg-white/5"
>
                            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/8 text-accent">
                              <SportIcon
                                sport={
                                  match.sport
                                }
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

                                {index ===
                                  0 && (
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
                        </motion.div>
                      )
                    )}
                </div>
              )}
            </motion.section>

            {/* ================================================ */}
            {/* SPORT RANKINGS */}
            {/* ================================================ */}

            <motion.section
              variants={sectionVariantsDelayed(
                0.21
              )}
              initial="hidden"
              animate="visible"
              className="mt-8"
            >
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
                    value:
                      superTiebreakPoints,
                    sport:
                      "super_tiebreak" as const,
                  },
                ].map((item) => {
                  const isActive =
                    item.sport === mode;

                  return (
                    <motion.div
  key={item.sport}
  layout
  animate={{
    scale: isActive ? 1.01 : 1,
  }}
  whileHover={{
    y: -1,
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 28,
  }}
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
                              sport={
                                item.sport
                              }
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
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/*
 * ============================================================
 * SMALL COMPONENTS
 * ============================================================
 */

function MiniStat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value);

  return (
    <div className="px-3 py-3.5 text-center">
      <p className="font-display text-lg font-bold leading-none tabular-nums">
        {Number.isFinite(numericValue) ? (
          <AnimatedNumber
            value={numericValue}
            duration={0.5}
          />
        ) : (
          value
        )}
      </p>

      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
    </div>
  );
}

function WeeklyStat({
  label,
  value,
  positive = false,
  negative = false,
}: {
  label: string;
  value: string | number;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-white/7 bg-white/3.5 px-3 py-4 backdrop-blur-xl">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>

      <p
        className={`mt-2 font-display text-xl font-bold tabular-nums ${
          positive
            ? "text-success"
            : negative
              ? "text-danger"
              : "text-foreground"
        }`}
      >
        {typeof value === "number" ? (
          <AnimatedNumber
            value={value}
            duration={0.5}
          />
        ) : (
          value
        )}
      </p>
    </div>
  );
}



function AnimatedNumber({
  value,
  duration = 0.6,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const startValue = previousValue.current;
    const difference = value - startValue;

    if (difference === 0) return;

    const startTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      const progress = Math.min(
        (currentTime - startTime) / (duration * 1000),
        1
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round(
          startValue + difference * easedProgress
        )
      );

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span>
      {displayValue.toLocaleString("fr-FR")}
    </span>
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