"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";
import DeleteMatchButton from "@/app/components/DeleteMatchButton";

type Sport = "tennis" | "padel";
type MatchFormat = "singles" | "doubles";
type ResultType = "friendly" | "competitive";

type Match = {
  id: string;
  sport: Sport;
  format: MatchFormat;
  result_type: ResultType;
  surface: string | null;
  duration_minutes: number | null;
  created_at: string;
};

type MatchPlayer = {
  id: string;
  player_id: string | null;
  guest_name: string | null;
  team: 1 | 2;
};

type PlayerInfo = {
  id: string;
  team: 1 | 2;
  points: number;
};

type SetScore = {
  team1: number;
  team2: number;
  tieBreakTeam1: number | null;
  tieBreakTeam2: number | null;
  isMatchTiebreak: boolean;
};

type PointPreview = {
  total: number;
  base: number;
  bulle: number;
  doubleBulle: number;
  victoireNette: number;
  serie: number;
  performance: number;
  fanny: number;
  doubleFanny: number;
  contrePerformance: number;
  tiebreak: number;
};

type RankingDetail = {
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

const emptySet = (): SetScore => ({
  team1: 0,
  team2: 0,
  tieBreakTeam1: null,
  tieBreakTeam2: null,
  isMatchTiebreak: false,
});

function isSetComplete(
  team1: number,
  team2: number,
  isMatchTiebreak = false
): boolean {
  if (isMatchTiebreak) {
    return team1 >= 10 || team2 >= 10;
  }

  if (team1 === 6 && team2 <= 4) return true;
  if (team2 === 6 && team1 <= 4) return true;

  if (team1 === 7 && team2 === 5) return true;
  if (team2 === 7 && team1 === 5) return true;

  if (team1 === 7 && team2 === 6) return true;
  if (team2 === 7 && team1 === 6) return true;

  return false;
}

function getSetWinner(set: SetScore): 1 | 2 | null {
  if (
    !isSetComplete(
      set.team1,
      set.team2,
      set.isMatchTiebreak
    )
  ) {
    return null;
  }

  if (set.team1 > set.team2) return 1;
  if (set.team2 > set.team1) return 2;

  return null;
}

function getGamesConceded(
  sets: SetScore[],
  team: 1 | 2
): number {
  return sets.reduce((total, set) => {
    return total + (team === 1 ? set.team2 : set.team1);
  }, 0);
}

function getSetWins(
  sets: SetScore[],
  team: 1 | 2
): number {
  return sets.reduce((total, set) => {
    return total + (getSetWinner(set) === team ? 1 : 0);
  }, 0);
}

function getPointPreview(
  sets: SetScore[],
  team: 1 | 2,
  previousPoints: number,
  opponentPoints: number,
  previousWinStreak: number
): PointPreview {
  const completedSets = sets.filter(
    (set) => getSetWinner(set) !== null
  );

  const teamWins = getSetWins(completedSets, team);
  const opponentTeam = team === 1 ? 2 : 1;

  const opponentWins = getSetWins(
    completedSets,
    opponentTeam
  );

  const won = teamWins > opponentWins;

  const base = won ? 25 : -20;

  let bulle = 0;
  let doubleBulle = 0;
  let victoireNette = 0;
  let serie = 0;
  let performance = 0;
  let fanny = 0;
  let doubleFanny = 0;
  let contrePerformance = 0;
  let tiebreak = 0;

  const normalSets = completedSets.filter(
    (set) => !set.isMatchTiebreak
  );

  const hasBulle = normalSets.some((set) => {
    if (team === 1) {
      return set.team1 === 6 && set.team2 === 0;
    }

    return set.team2 === 6 && set.team1 === 0;
  });

  if (won && hasBulle) {
    bulle = 10;
  }

  const doubleBulleCondition =
    won &&
    normalSets.length === 2 &&
    normalSets.every((set) => {
      if (team === 1) {
        return set.team1 === 6 && set.team2 === 0;
      }

      return set.team2 === 6 && set.team1 === 0;
    });

  if (doubleBulleCondition) {
    bulle = 10;
    doubleBulle = 40;
  }

  const gamesConceded = getGamesConceded(
    normalSets,
    team
  );

  if (
    won &&
    teamWins === 2 &&
    opponentWins === 0 &&
    gamesConceded <= 4 &&
    !doubleBulleCondition
  ) {
    victoireNette = 10;
  }

  const newStreak = won
    ? previousWinStreak + 1
    : 0;

  if (
    won &&
    newStreak >= 5 &&
    previousWinStreak < 5
  ) {
    serie = 20;
  } else if (
    won &&
    newStreak >= 3 &&
    previousWinStreak < 3
  ) {
    serie = 10;
  }

  if (
    won &&
    opponentPoints > previousPoints
  ) {
    performance = 15;
  }

  const lostWithFanny = normalSets.some((set) => {
    if (team === 1) {
      return set.team1 === 0 && set.team2 === 6;
    }

    return set.team2 === 0 && set.team1 === 6;
  });

  if (!won && lostWithFanny) {
    fanny = -5;
  }

  const doubleFannyCondition =
    !won &&
    normalSets.length === 2 &&
    normalSets.every((set) => {
      if (team === 1) {
        return set.team1 === 0 && set.team2 === 6;
      }

      return set.team2 === 0 && set.team1 === 6;
    });

  if (doubleFannyCondition) {
    fanny = 0;
    doubleFanny = -15;
  }

  if (
    !won &&
    opponentPoints < previousPoints
  ) {
    contrePerformance = -10;
  }

  const thirdSet = completedSets[2];

  if (
    !won &&
    thirdSet &&
    !thirdSet.isMatchTiebreak &&
    (
      (
        team === 1 &&
        thirdSet.team1 === 6 &&
        thirdSet.team2 === 7
      ) ||
      (
        team === 2 &&
        thirdSet.team2 === 6 &&
        thirdSet.team1 === 7
      )
    )
  ) {
    tiebreak = 10;
  }

  const total =
    base +
    bulle +
    doubleBulle +
    victoireNette +
    serie +
    performance +
    fanny +
    doubleFanny +
    contrePerformance +
    tiebreak;

  return {
    total,
    base,
    bulle,
    doubleBulle,
    victoireNette,
    serie,
    performance,
    fanny,
    doubleFanny,
    contrePerformance,
    tiebreak,
  };
}

function formatChange(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function sportLabel(sport: Sport) {
  return sport === "tennis" ? "Tennis" : "Padel";
}

function formatLabel(format: MatchFormat) {
  return format === "singles" ? "Simple" : "Double";
}

function ArrowLeftIcon({
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
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

function CheckIcon({
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function LockIcon({
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
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function InfoIcon({
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5v5" />
      <path d="M12 7.5h.01" />
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
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const matchId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);

  const [match, setMatch] = useState<Match | null>(null);

  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  const [sets, setSets] = useState<SetScore[]>([
    emptySet(),
    emptySet(),
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [rankingDetail, setRankingDetail] =
    useState<RankingDetail | null>(null);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const {
        data: matchData,
        error: matchError,
      } = await supabase
        .from("matches")
        .select(
          "id, sport, format, result_type, surface, duration_minutes, created_at"
        )
        .eq("id", matchId)
        .single();

      if (matchError || !matchData) {
        setError("Impossible de charger ce match.");
        setLoading(false);
        return;
      }

      if (
        matchData.sport !== "tennis" &&
        matchData.sport !== "padel"
      ) {
        router.replace(
          `/supertiebreak/${matchId}/result`
        );
        return;
      }

      const typedMatch: Match = {
        id: matchData.id,
        sport: matchData.sport as Sport,
        format: matchData.format as MatchFormat,
        result_type:
          matchData.result_type as ResultType,
        surface: matchData.surface ?? null,
        duration_minutes:
          matchData.duration_minutes ?? null,
        created_at: matchData.created_at,
      };

      setMatch(typedMatch);

      const {
        data: matchPlayers,
        error: playersError,
      } = await supabase
        .from("match_players")
        .select(
          "id, player_id, guest_name, team, created_at"
        )
        .eq("match_id", matchId)
        .order("team")
        .order("created_at");

      if (playersError) {
        setError("Impossible de charger les joueurs.");
        setLoading(false);
        return;
      }

      const playerRows =
        (matchPlayers ?? []) as MatchPlayer[];

      const playerIds = playerRows
        .map((player) => player.player_id)
        .filter(
          (id): id is string =>
            typeof id === "string"
        );

      /*
       * Les points actuels ne viennent plus de profiles.points_*.
       *
       * Source de vérité :
       * dernier ranking_history.new_points pour
       * chaque joueur et le sport du match.
       */
      const { data: rankingHistoryData, error: historyError } =
        playerIds.length > 0
          ? await supabase
              .from("ranking_history")
              .select(
                "player_id, sport, new_points, created_at"
              )
              .in("player_id", playerIds)
              .eq("sport", typedMatch.sport)
              .order("created_at", {
                ascending: false,
              })
          : { data: [], error: null };

      if (historyError) {
        console.error(
          "Erreur chargement historique classement :",
          historyError
        );
      }

      /*
       * Comme les données sont triées du plus récent
       * au plus ancien, la première ligne rencontrée
       * pour chaque joueur est son classement actuel.
       */
      const latestPoints = new Map<string, number>();

      for (const history of rankingHistoryData ?? []) {
        if (!latestPoints.has(history.player_id)) {
          latestPoints.set(
            history.player_id,
            Number(history.new_points)
          );
        }
      }

      const mappedPlayers: PlayerInfo[] =
        playerRows
          .filter(
            (
              player
            ): player is MatchPlayer & {
              player_id: string;
            } =>
              typeof player.player_id === "string"
          )
          .map((player) => ({
            id: player.player_id,
            team: player.team === 2 ? 2 : 1,
            points:
              latestPoints.get(
                player.player_id
              ) ?? 1000,
          }));

      setPlayers(mappedPlayers);

      const {
        data: existingSets,
        error: setsError,
      } = await supabase
        .from("sets")
        .select(
          "id, set_number, team_1_score, team_2_score, tie_break_team_1_score, tie_break_team_2_score, is_match_tiebreak"
        )
        .eq("match_id", matchId)
        .order("set_number");

      if (setsError) {
        setError("Impossible de charger les sets.");
        setLoading(false);
        return;
      }

      if (
        existingSets &&
        existingSets.length > 0
      ) {
        const loadedSets: SetScore[] =
          existingSets.map((set) => ({
            team1: Number(set.team_1_score),
            team2: Number(set.team_2_score),
            tieBreakTeam1:
              set.tie_break_team_1_score === null
                ? null
                : Number(
                    set.tie_break_team_1_score
                  ),
            tieBreakTeam2:
              set.tie_break_team_2_score === null
                ? null
                : Number(
                    set.tie_break_team_2_score
                  ),
            isMatchTiebreak: Boolean(
              set.is_match_tiebreak
            ),
          }));

        const {
          data: rankingData,
          error: rankingError,
        } = await supabase
          .from("ranking_history")
          .select(
            "old_points, new_points, points_change, base_points, bonus_bulle, bonus_double_bulle, bonus_victoire_propre, bonus_serie, bonus_performer, malus_fanny, malus_double_bulle, malus_contre_performance, amortisseur_tiebreak"
          )
          .eq("match_id", matchId)
          .eq("player_id", user.id)
          .maybeSingle();

        if (rankingError) {
          console.error(
            "Erreur chargement détail classement :",
            rankingError
          );
        }

        if (rankingData) {
          setRankingDetail(rankingData);
        }

        setSets(loadedSets);
        setLocked(true);
      }

      setLoading(false);
    }

    loadPage();
  }, [matchId, router, supabase]);

  const userTeam = useMemo(() => {
    if (!currentUserId) {
      return 1;
    }

    const currentPlayer = players.find(
      (player) =>
        player.id === currentUserId
    );

    return currentPlayer?.team ?? 1;
  }, [currentUserId, players]);

  const opponentTeam =
    userTeam === 1 ? 2 : 1;

  const userPlayer = useMemo(
    () =>
      players.find(
        (player) =>
          player.id === currentUserId
      ),
    [players, currentUserId]
  );

  /*
   * En simple : un joueur adverse.
   * En double : les deux joueurs adverses.
   */
  const opponentPlayers = useMemo(
    () =>
      players.filter(
        (player) =>
          player.team === opponentTeam
      ),
    [players, opponentTeam]
  );

  /*
   * Pour le preview, on compare le joueur
   * à la moyenne de l'équipe adverse.
   *
   * Le calcul réel reste effectué par finish_match.
   */
  const opponentPoints = useMemo(() => {
    if (opponentPlayers.length === 0) {
      return 1000;
    }

    const total = opponentPlayers.reduce(
      (sum, player) =>
        sum + player.points,
      0
    );

    return total / opponentPlayers.length;
  }, [opponentPlayers]);

  const setWinsTeam1 = getSetWins(sets, 1);
  const setWinsTeam2 = getSetWins(sets, 2);

  const matchFinished =
    setWinsTeam1 >= 2 ||
    setWinsTeam2 >= 2;

  const winner =
    setWinsTeam1 >= 2
      ? 1
      : setWinsTeam2 >= 2
        ? 2
        : null;

  const userWon =
    winner !== null &&
    winner === userTeam;

  const preview = useMemo(() => {
    if (
      !match ||
      match.result_type === "friendly" ||
      !userPlayer
    ) {
      return null;
    }

    return getPointPreview(
      sets,
      userTeam,
      userPlayer.points,
      opponentPoints,
      0
    );
  }, [
    match,
    sets,
    userTeam,
    userPlayer,
    opponentPoints,
  ]);

  function updateSet(
    index: number,
    field: "team1" | "team2",
    value: string
  ) {
    if (locked) return;

    const numericValue =
      value === ""
        ? 0
        : Number(value);

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      return;
    }

    setSets((current) =>
      current.map((set, i) =>
        i === index
          ? {
              ...set,
              [field]: numericValue,
            }
          : set
      )
    );
  }

  function updateTieBreak(
    index: number,
    field:
      | "tieBreakTeam1"
      | "tieBreakTeam2",
    value: string
  ) {
    if (locked) return;

    const numericValue =
      value === ""
        ? null
        : Number(value);

    if (
      numericValue !== null &&
      (!Number.isFinite(numericValue) ||
        numericValue < 0)
    ) {
      return;
    }

    setSets((current) =>
      current.map((set, i) =>
        i === index
          ? {
              ...set,
              [field]: numericValue,
            }
          : set
      )
    );
  }

  function toggleMatchTiebreak(index: number) {
    if (locked) return;

    setSets((current) =>
      current.map((set, i) =>
        i === index
          ? {
              ...set,
              isMatchTiebreak:
                !set.isMatchTiebreak,
            }
          : set
      )
    );
  }

  function addThirdSet() {
    if (locked) return;
    if (sets.length >= 3) return;

    setSets((current) => [
      ...current,
      emptySet(),
    ]);
  }

  function validateSets(): string | null {
    if (sets.length < 2) {
      return "Il faut au minimum 2 sets.";
    }

    const completed = sets.filter(
      (set) =>
        isSetComplete(
          set.team1,
          set.team2,
          set.isMatchTiebreak
        )
    );

    if (completed.length < 2) {
      return "Les deux premiers sets doivent être terminés.";
    }

    const firstTwo = completed.slice(0, 2);

    const firstWinner = getSetWinner(
      firstTwo[0]
    );

    const secondWinner = getSetWinner(
      firstTwo[1]
    );

    if (!firstWinner || !secondWinner) {
      return "Score de set invalide.";
    }

    if (firstWinner !== secondWinner) {
      if (sets.length < 3) {
        return "À 1-1, il faut saisir un troisième set.";
      }

      const third = sets[2];

      if (
        !isSetComplete(
          third.team1,
          third.team2,
          third.isMatchTiebreak
        )
      ) {
        return "Le troisième set n'est pas terminé.";
      }
    }

    return null;
  }

  async function handleSave() {
    if (locked) {
      setError(
        "Ce résultat est verrouillé. Supprime le match et recrée-le pour le corriger."
      );
      return;
    }

    setError("");
    setMessage("");

    const validationError = validateSets();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!match) {
      setError("Match introuvable.");
      return;
    }

    setSaving(true);

    try {
      const { error: deleteError } =
        await supabase
          .from("sets")
          .delete()
          .eq("match_id", matchId);

      if (deleteError) {
        throw new Error(
          `Impossible de supprimer les anciens sets : ${deleteError.message}`
        );
      }

      const rows = sets.map(
        (set, index) => ({
          match_id: matchId,
          set_number: index + 1,
          team_1_score: set.team1,
          team_2_score: set.team2,
          tie_break_team_1_score:
            set.tieBreakTeam1,
          tie_break_team_2_score:
            set.tieBreakTeam2,
          is_match_tiebreak:
            set.isMatchTiebreak,
        })
      );

      const { error: insertError } =
        await supabase
          .from("sets")
          .insert(rows);

      if (insertError) {
        throw new Error(
          `Impossible d'enregistrer les sets : ${insertError.message}`
        );
      }

      /*
       * finish_match reste la source de calcul réelle.
       *
       * Cette page ne calcule pas et n'écrit pas
       * elle-même les points du classement.
       */
      const { error: finishError } =
        await supabase.rpc(
          "finish_match",
          {
            p_match_id: matchId,
          }
        );

      if (finishError) {
        throw new Error(
          `Impossible de terminer le match : ${finishError.message}`
        );
      }

      const { error: championError } =
        await supabase.rpc(
          "refresh_champion_after_match",
          {
            p_match_id: matchId,
          }
        );

      if (championError) {
        console.error(
          "Erreur actualisation champion :",
          championError
        );
      }

      /*
       * On recharge le résultat réellement enregistré
       * par finish_match.
       */
      const {
        data: rankingData,
        error: rankingDetailError,
      } = await supabase
        .from("ranking_history")
        .select(
          "old_points, new_points, points_change, base_points, bonus_bulle, bonus_double_bulle, bonus_victoire_propre, bonus_serie, bonus_performer, malus_fanny, malus_double_bulle, malus_contre_performance, amortisseur_tiebreak"
        )
        .eq("match_id", matchId)
        .eq("player_id", currentUserId)
        .maybeSingle();

      if (
        !rankingDetailError &&
        rankingData
      ) {
        setRankingDetail(rankingData);
      }

      setLocked(true);

      setMessage(
        match.result_type === "friendly"
          ? "Résultat enregistré. Match amical : aucun point gagné ou perdu."
          : "Résultat enregistré et points mis à jour."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setSaving(false);
    }
  }

  const pageBackground = {
    backgroundImage:
      "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
    backgroundAttachment: "fixed" as const,
  };

  if (loading) {
    return (
      <main
        className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
        style={pageBackground}
      >
        <div className="mx-auto max-w-lg">
          <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-7 h-3 w-32 animate-pulse rounded-full bg-surface-2" />
          <div className="mt-3 h-9 w-64 animate-pulse rounded-xl bg-surface-2" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-surface-2" />

          <div className="mt-8 space-y-3">
            <div className="h-80 animate-pulse rounded-[28px] bg-surface" />
            <div className="h-52 animate-pulse rounded-[28px] bg-surface" />
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main
        className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
        style={pageBackground}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() => router.push("/matches")}
            aria-label="Retour aux matchs"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon />
          </button>

          <section className="glass-strong mt-8 rounded-[28px] p-5 sm:p-6">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-danger/10 font-display text-lg font-bold text-danger">
              !
            </div>

            <p className="eyebrow mt-6">
              Erreur
            </p>

            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
              Match introuvable
            </h1>

            {error && (
              <p className="mt-3 text-sm leading-6 text-muted">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => router.push("/matches")}
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-[20px] bg-accent px-5 text-sm font-bold text-[#0b0d13] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              Retour aux matchs
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={pageBackground}
    >
      <div className="mx-auto max-w-lg pb-8">
        <header className="mb-7">
          <button
            type="button"
            onClick={() => router.push("/matches")}
            aria-label="Retour aux matchs"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon />
          </button>

          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
                    <SportIcon
                      sport={match.sport}
                      className="h-4 w-4"
                    />
                  </div>

                  <p className="eyebrow">
                    Résultat · {sportLabel(match.sport)}
                  </p>
                </div>

                <h1 className="mt-4 font-display text-[30px] font-bold tracking-tight">
                  {locked
                    ? "Match terminé"
                    : "Entre le résultat"}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-muted">
                    {formatLabel(match.format)}
                  </span>

                  {match.surface && (
                    <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-muted">
                      {match.surface}
                    </span>
                  )}

                  {match.duration_minutes && (
                    <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-muted">
                      {match.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] ${
                  match.result_type === "competitive"
                    ? "border-accent/20 bg-accent/10 text-accent"
                    : "border-white/8 bg-white/5 text-muted"
                }`}
              >
                {match.result_type === "competitive"
                  ? "Compétitif"
                  : "Amical"}
              </span>
            </div>
          </div>
        </header>

        {locked && (
          <section className="glass mb-4 rounded-[22px] border-warning/15 bg-warning/5 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/10 text-warning">
                <LockIcon />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold">
                  Résultat verrouillé
                </p>

                <p className="mt-0.5 text-xs leading-5 text-muted">
                  Le résultat a déjà été enregistré.
                </p>
              </div>
            </div>
          </section>
        )}

        {error && (
          <section className="glass mb-4 rounded-[22px] border-danger/15 bg-danger/5 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/10 font-display text-sm font-bold text-danger">
                !
              </div>

              <p className="pt-1 text-sm leading-6 text-foreground">
                {error}
              </p>
            </div>
          </section>
        )}

        {message && (
          <section className="glass mb-4 rounded-[22px] border-accent/15 bg-accent/5 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <CheckIcon />
              </div>

              <p className="pt-1 text-sm leading-6 text-foreground">
                {message}
              </p>
            </div>
          </section>
        )}

        <section className="glass-strong mb-4 overflow-hidden rounded-[28px] p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">
                Score du match
              </p>

              <div className="mt-2 flex items-center gap-3 font-display">
                <span
                  className={
                    userTeam === 1
                      ? "text-5xl font-bold tracking-tight text-accent"
                      : "text-5xl font-bold tracking-tight text-foreground"
                  }
                >
                  {setWinsTeam1}
                </span>

                <span className="text-2xl font-medium text-muted-2">
                  —
                </span>

                <span
                  className={
                    userTeam === 2
                      ? "text-5xl font-bold tracking-tight text-accent"
                      : "text-5xl font-bold tracking-tight text-foreground"
                  }
                >
                  {setWinsTeam2}
                </span>
              </div>
            </div>

            {winner && (
              <div
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  userWon
                    ? "border-accent/20 bg-accent/10 text-accent"
                    : "border-danger/20 bg-danger/10 text-danger"
                }`}
              >
                {userWon ? "Victoire" : "Défaite"}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {sets.map((set, index) => {
              const setWinner = getSetWinner(set);

              return (
                <div
                  key={index}
                  className={`rounded-3xl border p-4 transition-all ${
                    setWinner === userTeam
                      ? "border-accent/15 bg-accent/[0.035]"
                      : "border-white/6 bg-white/2.5"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-sm font-bold">
                          {set.isMatchTiebreak
                            ? "Super tie-break"
                            : `Set ${index + 1}`}
                        </p>

                        {set.isMatchTiebreak && (
                          <span className="rounded-full border border-accent/15 bg-accent/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-accent">
                            Décisif
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted">
                        {setWinner
                          ? setWinner === userTeam
                            ? "Vous remportez ce set"
                            : "L’adversaire remporte ce set"
                          : "Score en cours"}
                      </p>
                    </div>

                    {setWinner && (
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div>
                      <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-muted">
                        Vous
                      </label>

                      <input
                        type="number"
                        min="0"
                        max={
                          set.isMatchTiebreak
                            ? 20
                            : 7
                        }
                        value={set.team1}
                        disabled={locked}
                        onChange={(event) =>
                          updateSet(
                            index,
                            "team1",
                            event.target.value
                          )
                        }
                        className={`h-16 w-full rounded-[20px] border bg-[#0c0f17]/80 px-3 text-center font-display text-3xl font-bold text-foreground outline-none transition-all focus:border-accent/60 focus:ring-1 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 ${
                          userTeam === 1
                            ? "border-accent/20"
                            : "border-white/6"
                        }`}
                      />
                    </div>

                    <span className="pb-5 text-lg font-bold text-muted-2">
                      —
                    </span>

                    <div>
                      <label className="mb-2 block text-right text-[9px] font-bold uppercase tracking-[0.15em] text-muted">
                        Adversaire
                      </label>

                      <input
                        type="number"
                        min="0"
                        max={
                          set.isMatchTiebreak
                            ? 20
                            : 7
                        }
                        value={set.team2}
                        disabled={locked}
                        onChange={(event) =>
                          updateSet(
                            index,
                            "team2",
                            event.target.value
                          )
                        }
                        className={`h-16 w-full rounded-[20px] border bg-[#0c0f17]/80 px-3 text-center font-display text-3xl font-bold text-foreground outline-none transition-all focus:border-accent/60 focus:ring-1 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 ${
                          userTeam === 2
                            ? "border-accent/20"
                            : "border-white/6"
                        }`}
                      />
                    </div>
                  </div>

                  {!set.isMatchTiebreak &&
                    (
                      (
                        set.team1 === 7 &&
                        set.team2 === 6
                      ) ||
                      (
                        set.team2 === 7 &&
                        set.team1 === 6
                      )
                    ) && (
                      <div className="mt-4 border-t border-white/6 pt-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                            Score du tie-break
                          </p>

                          <span className="text-[9px] font-semibold text-muted-2">
                            Optionnel
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min="0"
                            value={
                              set.tieBreakTeam1 ?? ""
                            }
                            disabled={locked}
                            placeholder="Vous"
                            onChange={(event) =>
                              updateTieBreak(
                                index,
                                "tieBreakTeam1",
                                event.target.value
                              )
                            }
                            className="h-12 w-full rounded-[18px] border border-white/6 bg-[#0c0f17]/80 px-3 text-center font-display font-bold text-foreground outline-none transition-all placeholder:text-muted-2 focus:border-accent/60 focus:ring-1 focus:ring-accent/15 disabled:opacity-50"
                          />

                          <input
                            type="number"
                            min="0"
                            value={
                              set.tieBreakTeam2 ?? ""
                            }
                            disabled={locked}
                            placeholder="Adversaire"
                            onChange={(event) =>
                              updateTieBreak(
                                index,
                                "tieBreakTeam2",
                                event.target.value
                              )
                            }
                            className="h-12 w-full rounded-[18px] border border-white/6 bg-[#0c0f17]/80 px-3 text-center font-display font-bold text-foreground outline-none transition-all placeholder:text-muted-2 focus:border-accent/60 focus:ring-1 focus:ring-accent/15 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    )}

                  {match.sport === "padel" &&
                    index === 2 && (
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          toggleMatchTiebreak(index)
                        }
                        className={`mt-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-[18px] border px-4 text-left transition-all duration-200 active:scale-[0.98] ${
                          set.isMatchTiebreak
                            ? "border-accent/25 bg-accent text-[#0b0d13]"
                            : "border-white/6 bg-white/2.5 text-foreground hover:border-accent/20 hover:bg-accent/5"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <div>
                          <p className="text-sm font-bold">
                            {set.isMatchTiebreak
                              ? "Super tie-break activé"
                              : "Utiliser un super tie-break"}
                          </p>

                          {!set.isMatchTiebreak && (
                            <p className="mt-0.5 text-[10px] text-muted">
                              Pour le troisième set
                            </p>
                          )}
                        </div>

                        <ChevronDownIcon
                          className={`h-4 w-4 transition-transform ${
                            set.isMatchTiebreak
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                    )}
                </div>
              );
            })}
          </div>

          {!locked &&
            sets.length < 3 &&
            setWinsTeam1 === 1 &&
            setWinsTeam2 === 1 && (
              <button
                type="button"
                onClick={addThirdSet}
                className="mt-4 flex min-h-13 w-full items-center justify-center rounded-[20px] border border-white/6 bg-white/2.5 px-5 text-sm font-bold text-foreground transition-all duration-200 hover:border-accent/20 hover:bg-accent/5 active:scale-[0.98]"
              >
                Ajouter le 3e set
              </button>
            )}

          {!locked && (
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving || !matchFinished
              }
              className="accent-glow mt-4 flex min-h-15 w-full items-center justify-center rounded-[21px] bg-accent px-5 text-sm font-bold text-[#0b0d13] transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-25"
            >
              {saving
                ? "Enregistrement..."
                : "Valider le résultat"}
            </button>
          )}
        </section>

        {match.result_type === "competitive" &&
          preview &&
          matchFinished && (
            <section className="glass-strong mb-4 rounded-[28px] p-5">
              <div className="mb-5">
                <p className="eyebrow">
                  Classement
                </p>

                <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                  Aperçu des points
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Estimation basée sur le barème actuel.
                </p>
              </div>

              <div className="accent-glow rounded-3xl border border-accent/10 bg-accent/5 p-5 text-center">
                <p className="eyebrow">
                  Évolution estimée
                </p>

                <p
                  className={`mt-2 font-display text-5xl font-bold tracking-tight ${
                    preview.total >= 0
                      ? "text-accent"
                      : "text-danger"
                  }`}
                >
                  {formatChange(preview.total)}
                </p>

                <p className="mt-1 text-xs text-muted">
                  points
                </p>
              </div>

              <div className="mt-4 space-y-1.5">
                {[
                  [
                    "Points de base du match",
                    preview.base,
                  ],
                  [
                    "Set remporté sans concéder de jeu",
                    preview.bulle,
                  ],
                  [
                    "Match parfait",
                    preview.doubleBulle,
                  ],
                  [
                    "Victoire nette",
                    preview.victoireNette,
                  ],
                  [
                    "Série de victoires",
                    preview.serie,
                  ],
                  [
                    "Performance",
                    preview.performance,
                  ],
                  [
                    "Set blanc concédé",
                    preview.fanny,
                  ],
                  [
                    "Match sans jeu marqué",
                    preview.doubleFanny,
                  ],
                  [
                    "Contre-performance",
                    preview.contrePerformance,
                  ],
                  [
                    "Défaite serrée au jeu décisif",
                    preview.tiebreak,
                  ],
                ]
                  .filter(([, value]) => value !== 0)
                  .map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between gap-4 rounded-[17px] border border-white/5 bg-white/2.5 px-3.5 py-3"
                    >
                      <span className="min-w-0 text-sm text-muted">
                        {label}
                      </span>

                      <span
                        className={`shrink-0 text-sm font-bold ${
                          Number(value) >= 0
                            ? "text-accent"
                            : "text-danger"
                        }`}
                      >
                        {formatChange(
                          Number(value)
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

        {match.result_type === "competitive" &&
          rankingDetail && (
            <section className="glass-strong mb-4 rounded-[28px] p-5">
              <div className="mb-5">
                <p className="eyebrow">
                  Résultat enregistré
                </p>

                <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                  Détail des points
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Calcul réellement enregistré dans le classement.
                </p>
              </div>

              <div className="rounded-3xl border border-accent/10 bg-accent/5 p-5 text-center">
                <p className="eyebrow">
                  Évolution
                </p>

                <p
                  className={`mt-2 font-display text-5xl font-bold tracking-tight ${
                    rankingDetail.points_change >= 0
                      ? "text-accent"
                      : "text-danger"
                  }`}
                >
                  {formatChange(
                    rankingDetail.points_change
                  )}
                </p>

                <p className="mt-2 text-sm text-muted">
                  {rankingDetail.old_points} →{" "}
                  {rankingDetail.new_points} points
                </p>
              </div>

              <div className="mt-4 space-y-1.5">
                {[
                  [
                    "Points de base",
                    rankingDetail.base_points,
                  ],
                  [
                    "Set blanc remporté",
                    rankingDetail.bonus_bulle,
                  ],
                  [
                    "Match parfait",
                    rankingDetail.bonus_double_bulle,
                  ],
                  [
                    "Victoire nette",
                    rankingDetail.bonus_victoire_propre,
                  ],
                  [
                    "Série de victoires",
                    rankingDetail.bonus_serie,
                  ],
                  [
                    "Performance",
                    rankingDetail.bonus_performer,
                  ],
                  [
                    "Set blanc concédé",
                    rankingDetail.malus_fanny,
                  ],
                  [
                    "Match sans jeu marqué",
                    rankingDetail.malus_double_bulle,
                  ],
                  [
                    "Contre-performance",
                    rankingDetail.malus_contre_performance,
                  ],
                  [
                    "Défaite serrée au tie-break",
                    rankingDetail.amortisseur_tiebreak,
                  ],
                ]
                  .filter(([, value]) => value !== 0)
                  .map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between gap-4 rounded-[17px] border border-white/5 bg-white/2.5 px-3.5 py-3"
                    >
                      <span className="min-w-0 text-sm text-muted">
                        {label}
                      </span>

                      <span
                        className={`shrink-0 text-sm font-bold ${
                          Number(value) >= 0
                            ? "text-accent"
                            : "text-danger"
                        }`}
                      >
                        {formatChange(
                          Number(value)
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

        {match.result_type === "friendly" && (
          <section className="glass mb-4 rounded-[28px] p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/10 bg-accent/5 text-accent">
                <InfoIcon />
              </div>

              <div>
                <p className="eyebrow">
                  Match amical
                </p>

                <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
                  Aucun impact sur le classement
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Ce match reste enregistré dans tes statistiques,
                  mais il ne modifie pas tes points.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="glass rounded-[28px] p-5">
          <div className="mb-6">
            <p className="eyebrow">
              Classement
            </p>

            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
              Barème des points
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted">
              Les règles utilisées pour calculer ton classement.
            </p>
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-bold">
                  Points de base
                </p>

                <span className="rounded-full border border-accent/10 bg-accent/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
                  Base
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4 rounded-[17px] border border-white/5 bg-white/2.5 px-3.5 py-3">
                  <span className="text-muted">
                    Victoire
                  </span>

                  <span className="font-bold text-accent">
                    +25 pts
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-[17px] border border-white/5 bg-white/2.5 px-3.5 py-3">
                  <span className="text-muted">
                    Défaite
                  </span>

                  <span className="font-bold text-danger">
                    -20 pts
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/6 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-bold">
                  Bonus de performance
                </p>

                <span className="rounded-full border border-accent/10 bg-accent/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
                  Bonus
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  [
                    "Set remporté sans concéder de jeu (6-0)",
                    "+10 pts",
                  ],
                  [
                    "Match parfait (6-0, 6-0)",
                    "+40 pts",
                  ],
                  [
                    "Victoire nette (2-0 avec 4 jeux concédés maximum)",
                    "+10 pts",
                  ],
                  [
                    "3 victoires consécutives",
                    "+10 pts",
                  ],
                  [
                    "5 victoires consécutives",
                    "+20 pts",
                  ],
                  [
                    "Performance face à un joueur mieux classé",
                    "+15 pts",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-[17px] border border-white/5 bg-white/2.5 px-3.5 py-3"
                  >
                    <span className="leading-5 text-muted">
                      {label}
                    </span>

                    <span className="shrink-0 font-bold text-accent">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/6 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-bold">
                  Pénalités et atténuations
                </p>

                <span className="rounded-full border border-danger/10 bg-danger/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-danger">
                  Malus
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  [
                    "Set blanc concédé (0-6)",
                    "-5 pts",
                  ],
                  [
                    "Match sans jeu marqué (0-6, 0-6)",
                    "-15 pts",
                  ],
                  [
                    "Contre-performance face à un joueur moins bien classé",
                    "-10 pts",
                  ],
                  [
                    "Défaite serrée au jeu décisif dans le dernier set",
                    "-10 pts au lieu de -20",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-[17px] border border-white/5 bg-white/2.5 px-3.5 py-3"
                  >
                    <span className="leading-5 text-muted">
                      {label}
                    </span>

                    <span className="shrink-0 font-bold text-danger">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {locked && (
          <DeleteMatchButton matchId={match.id} />
        )}
      </div>
    </main>
  );
}