"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

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
  if (!isSetComplete(set.team1, set.team2, set.isMatchTiebreak)) {
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

  const [match, setMatch] = useState<Match | null>(
    null
  );

  const [players, setPlayers] = useState<
    PlayerInfo[]
  >([]);

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
        setError(
          "Impossible de charger ce match."
        );
        setLoading(false);
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
        setError(
          "Impossible de charger les joueurs."
        );
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

      const { data: profiles } =
        playerIds.length > 0
          ? await supabase
              .from("profiles")
              .select(
                "id, points_tennis, points_padel"
              )
              .in("id", playerIds)
          : { data: [] };

      const mappedPlayers: PlayerInfo[] =
        playerIds.map((playerId) => {
          const row = playerRows.find(
            (player) =>
              player.player_id === playerId
          );

          const profile = (
            profiles ?? []
          ).find(
            (item) => item.id === playerId
          );

          const points =
            typedMatch.sport === "tennis"
              ? Number(
                  profile?.points_tennis ?? 1000
                )
              : Number(
                  profile?.points_padel ?? 1000
                );

          return {
            id: playerId,
            team:
              row?.team === 2 ? 2 : 1,
            points,
          };
        });

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
        setError(
          "Impossible de charger les sets."
        );
        setLoading(false);
        return;
      }

      if (
        existingSets &&
        existingSets.length > 0
      ) {
        const loadedSets: SetScore[] =
          existingSets.map((set) => ({
            team1: Number(
              set.team_1_score
            ),
            team2: Number(
              set.team_2_score
            ),
            tieBreakTeam1:
              set.tie_break_team_1_score ===
              null
                ? null
                : Number(
                    set.tie_break_team_1_score
                  ),
            tieBreakTeam2:
              set.tie_break_team_2_score ===
              null
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
      } = await supabase
        .from("ranking_history")
        .select(
          "old_points, new_points, points_change, base_points, bonus_bulle, bonus_double_bulle, bonus_victoire_propre, bonus_serie, bonus_performer, malus_fanny, malus_double_bulle, malus_contre_performance, amortisseur_tiebreak"
        )
        .eq("match_id", matchId)
        .eq("player_id", user.id)
        .maybeSingle();

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

  const opponentPlayer = useMemo(
    () =>
      players.find(
        (player) =>
          player.team === opponentTeam
      ),
    [players, opponentTeam]
  );

  const setWinsTeam1 = getSetWins(
    sets,
    1
  );

  const setWinsTeam2 = getSetWins(
    sets,
    2
  );

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
      opponentPlayer?.points ?? 1000,
      0
    );
  }, [
    match,
    sets,
    userTeam,
    userPlayer,
    opponentPlayer,
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

  function toggleMatchTiebreak(
    index: number
  ) {
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

    const firstTwo = completed.slice(
      0,
      2
    );

    const firstWinner = getSetWinner(
      firstTwo[0]
    );

    const secondWinner = getSetWinner(
      firstTwo[1]
    );

    if (
      !firstWinner ||
      !secondWinner
    ) {
      return "Score de set invalide.";
    }

    if (
      firstWinner !== secondWinner
    ) {
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

    const validationError =
      validateSets();

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
      const {
        error: deleteError,
      } = await supabase
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

      const {
        error: insertError,
      } = await supabase
        .from("sets")
        .insert(rows);

      if (insertError) {
        throw new Error(
          `Impossible d'enregistrer les sets : ${insertError.message}`
        );
      }

      const {
        error: finishError,
      } = await supabase.rpc(
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

      const {
        error: championError,
      } = await supabase.rpc(
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

      if (!rankingDetailError && rankingData) {
        setRankingDetail(rankingData);
      }

      setLocked(true);

      setMessage(
        match.result_type ===
          "friendly"
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10">
        <div className="mx-auto max-w-lg">
          <p className="text-center text-gray-500">
            Chargement du match...
          </p>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">
              Match introuvable
            </h1>

            {error && (
              <p className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                router.push("/matches")
              }
              className="mt-6 w-full rounded-xl bg-black px-4 py-3 font-semibold text-white"
            >
              Retour aux matchs
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 pb-28">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() =>
            router.push("/matches")
          }
          className="mb-5 text-sm font-medium text-gray-600"
        >
          ← Retour aux matchs
        </button>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Résultat du match
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {match.sport === "tennis"
              ? "🎾 Tennis"
              : "🏓 Padel"}{" "}
            ·{" "}
            {match.format === "singles"
              ? "Simple"
              : "Double"}
          </p>
        </div>

        {locked && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
              🔒 Résultat verrouillé
            </p>

            <p className="mt-1 text-sm text-amber-800">
              Ce résultat a déjà été enregistré.
              Pour le corriger, supprime le match puis recrée-le.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {error}
            </p>
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              {message}
            </p>
          </div>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Score
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {setWinsTeam1} -{" "}
                {setWinsTeam2}
              </p>
            </div>

            {winner && (
              <div
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  userWon
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {userWon
                  ? "Victoire"
                  : "Défaite"}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {sets.map(
              (set, index) => {
                const setWinner =
                  getSetWinner(set);

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900">
                        {set.isMatchTiebreak
                          ? "Super tie-break"
                          : `Set ${index + 1}`}
                      </h2>

                      {setWinner && (
                        <span className="text-xs font-semibold text-gray-500">
                          {setWinner ===
                          userTeam
                            ? "Vous remportez ce set"
                            : "L'adversaire remporte ce set"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
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
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-bold outline-none focus:border-black disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
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
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-bold outline-none focus:border-black disabled:bg-gray-100"
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
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-medium text-gray-500">
                            Score du tie-break
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              min="0"
                              value={
                                set.tieBreakTeam1 ??
                                ""
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
                              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-center font-semibold disabled:bg-gray-100"
                            />

                            <input
                              type="number"
                              min="0"
                              value={
                                set.tieBreakTeam2 ??
                                ""
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
                              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-center font-semibold disabled:bg-gray-100"
                            />
                          </div>
                        </div>
                      )}

                    {match.sport ===
                      "padel" &&
                      index === 2 && (
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() =>
                            toggleMatchTiebreak(
                              index
                            )
                          }
                          className={`mt-4 w-full rounded-xl border px-4 py-2 text-sm font-semibold ${
                            set.isMatchTiebreak
                              ? "border-black bg-black text-white"
                              : "border-gray-300 bg-white text-gray-700"
                          } disabled:opacity-50`}
                        >
                          {set.isMatchTiebreak
                            ? "Super tie-break activé"
                            : "Utiliser un super tie-break"}
                        </button>
                      )}
                  </div>
                );
              }
            )}
          </div>

          {!locked &&
            sets.length < 3 &&
            setWinsTeam1 === 1 &&
            setWinsTeam2 === 1 && (
              <button
                type="button"
                onClick={addThirdSet}
                className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-800"
              >
                + Ajouter le 3e set
              </button>
            )}

          {!locked && (
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving || !matchFinished
              }
              className="mt-5 w-full rounded-xl bg-black px-4 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? "Enregistrement..."
                : "Valider le résultat"}
            </button>
          )}
        </section>

        {match.result_type ===
          "competitive" &&
          preview &&
          matchFinished && (
            <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  📊 Aperçu des points
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Ce calcul est basé sur le barème actuel.
                </p>
              </div>

              <div className="mb-5 rounded-2xl bg-gray-100 p-4 text-center">
                <p className="text-sm text-gray-500">
                  Évolution estimée
                </p>

                <p
                  className={`mt-1 text-3xl font-black ${
                    preview.total >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatChange(
                    preview.total
                  )}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    Points de base du match
                  </span>
                  <span className="font-semibold">
                    {formatChange(
                      preview.base
                    )}
                  </span>
                </div>

                {preview.bulle !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Set remporté sans concéder de jeu
                    </span>
                    <span className="font-semibold text-green-600">
                      +10
                    </span>
                  </div>
                )}

                {preview.doubleBulle !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Match parfait
                    </span>
                    <span className="font-semibold text-green-600">
                      +40
                    </span>
                  </div>
                )}

                {preview.victoireNette !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Victoire nette
                    </span>
                    <span className="font-semibold text-green-600">
                      +10
                    </span>
                  </div>
                )}

                {preview.serie !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Série de victoires
                    </span>
                    <span className="font-semibold text-green-600">
                      +{preview.serie}
                    </span>
                  </div>
                )}

                {preview.performance !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Performance
                    </span>
                    <span className="font-semibold text-green-600">
                      +15
                    </span>
                  </div>
                )}

                {preview.fanny !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Set blanc concédé
                    </span>
                    <span className="font-semibold text-red-600">
                      -5
                    </span>
                  </div>
                )}

                {preview.doubleFanny !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Match sans jeu marqué
                    </span>
                    <span className="font-semibold text-red-600">
                      -15
                    </span>
                  </div>
                )}

                {preview.contrePerformance !==
                  0 && (
                  <div className="flex justify-between">
                    <span>
                      Contre-performance
                    </span>
                    <span className="font-semibold text-red-600">
                      -10
                    </span>
                  </div>
                )}

                {preview.tiebreak !== 0 && (
                  <div className="flex justify-between">
                    <span>
                      Défaite serrée au jeu décisif
                    </span>
                    <span className="font-semibold text-green-600">
                      +10
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

                  {match.result_type === "competitive" &&
          rankingDetail && (
            <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  🎯 Détail des points
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Calcul réellement enregistré dans le classement.
                </p>
              </div>

              <div className="mb-5 rounded-2xl bg-gray-100 p-4 text-center">
                <p className="text-sm text-gray-500">
                  Évolution
                </p>

                <p
                  className={`mt-1 text-3xl font-black ${
                    rankingDetail.points_change >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatChange(
                    rankingDetail.points_change
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {rankingDetail.old_points} →{" "}
                  {rankingDetail.new_points} points
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Points de base</span>
                  <span className="font-semibold">
                    {formatChange(
                      rankingDetail.base_points
                    )}
                  </span>
                </div>

                {rankingDetail.bonus_bulle !== 0 && (
                  <div className="flex justify-between">
                    <span>🎯 Set blanc remporté</span>
                    <span className="font-semibold text-green-600">
                      +{rankingDetail.bonus_bulle}
                    </span>
                  </div>
                )}

                {rankingDetail.bonus_double_bulle !== 0 && (
                  <div className="flex justify-between">
                    <span>💎 Match parfait</span>
                    <span className="font-semibold text-green-600">
                      +{rankingDetail.bonus_double_bulle}
                    </span>
                  </div>
                )}

                {rankingDetail.bonus_victoire_propre !== 0 && (
                  <div className="flex justify-between">
                    <span>⚡ Victoire nette</span>
                    <span className="font-semibold text-green-600">
                      +{rankingDetail.bonus_victoire_propre}
                    </span>
                  </div>
                )}

                {rankingDetail.bonus_serie !== 0 && (
                  <div className="flex justify-between">
                    <span>🔥 Série de victoires</span>
                    <span className="font-semibold text-green-600">
                      +{rankingDetail.bonus_serie}
                    </span>
                  </div>
                )}

                {rankingDetail.bonus_performer !== 0 && (
                  <div className="flex justify-between">
                    <span>🚀 Performance</span>
                    <span className="font-semibold text-green-600">
                      +{rankingDetail.bonus_performer}
                    </span>
                  </div>
                )}

                {rankingDetail.malus_fanny !== 0 && (
                  <div className="flex justify-between">
                    <span>⚠️ Set blanc concédé</span>
                    <span className="font-semibold text-red-600">
                      {rankingDetail.malus_fanny}
                    </span>
                  </div>
                )}

                {rankingDetail.malus_double_bulle !== 0 && (
                  <div className="flex justify-between">
                    <span>❌ Match sans jeu marqué</span>
                    <span className="font-semibold text-red-600">
                      {rankingDetail.malus_double_bulle}
                    </span>
                  </div>
                )}

                {rankingDetail.malus_contre_performance !== 0 && (
                  <div className="flex justify-between">
                    <span>📉 Contre-performance</span>
                    <span className="font-semibold text-red-600">
                      {rankingDetail.malus_contre_performance}
                    </span>
                  </div>
                )}

                {rankingDetail.amortisseur_tiebreak !== 0 && (
                  <div className="flex justify-between">
                    <span>🛡️ Défaite serrée au tie-break</span>
                    <span className="font-semibold text-green-600">
                      +{rankingDetail.amortisseur_tiebreak}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

        {match.result_type ===
          "friendly" && (
          <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="font-bold text-blue-900">
              🤝 Match amical
            </h2>

            <p className="mt-1 text-sm text-blue-800">
              Ce match est enregistré dans tes statistiques,
              mais il ne modifie pas les points du classement.
            </p>
          </section>
        )}

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">
            Barème des points
          </h2>

          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="mb-2 font-semibold text-gray-900">
                Points de base du match
              </p>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Victoire</span>
                  <span className="font-semibold">
                    +25 pts
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Défaite</span>
                  <span className="font-semibold">
                    -20 pts
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 font-semibold text-gray-900">
                Bonus de performance
              </p>

              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <span>
                    Set remporté sans concéder de jeu (6-0)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    +10 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    Match parfait (6-0, 6-0)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    +40 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    Victoire nette (2-0 avec 4 jeux concédés maximum)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    +10 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    3 victoires consécutives
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    +10 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    5 victoires consécutives
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    +20 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    Performance (victoire face à un joueur de rang supérieur)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    +15 pts
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 font-semibold text-gray-900">
                Pénalités et atténuations
              </p>

              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <span>
                    Set blanc concédé (0-6)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    -5 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    Match sans jeu marqué (0-6, 0-6)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    -15 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    Contre-performance (défaite face à un joueur de rang inférieur)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    -10 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>
                    Défaite serrée au jeu décisif dans le dernier set
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    -10 pts au lieu de -20
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}