"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";

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

          const profile = (profiles ?? []).find(
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
            team: row?.team === 2 ? 2 : 1,
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
                : Number(set.tie_break_team_1_score),
            tieBreakTeam2:
              set.tie_break_team_2_score === null
                ? null
                : Number(set.tie_break_team_2_score),
            isMatchTiebreak: Boolean(
              set.is_match_tiebreak
            ),
          }));

        const { data: rankingData } =
          await supabase
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

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-sm text-muted">
              Chargement du match...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() => router.push("/matches")}
            className="mb-6 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            ← Retour aux matchs
          </button>

          <section className="rounded-3xl border border-border bg-surface p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              !
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
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
              className="mt-6 flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-5 font-bold text-background transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              Retour aux matchs
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        <button
          type="button"
          onClick={() => router.push("/matches")}
          className="mb-7 flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          <span className="text-base">←</span>
          Retour aux matchs
        </button>

        {/* Header */}
        <header className="mb-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SportIcon
                sport={match.sport}
                className="h-4 w-4 text-accent"
              />

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                {sportLabel(match.sport)}
              </p>
            </div>

            <span className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-bold text-muted">
              {match.result_type === "competitive"
                ? "Compétitif"
                : "Amical"}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-muted">
            {formatLabel(match.format)}
            {match.surface
              ? ` · ${match.surface}`
              : ""}
            {match.duration_minutes
              ? ` · ${match.duration_minutes} min`
              : ""}
          </p>
        </header>

        {/* Locked */}
        {locked && (
          <section className="mb-5 rounded-3xl border border-warning/20 bg-warning/10 p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                🔒
              </div>

              <div>
                <h2 className="font-bold text-foreground">
                  Résultat verrouillé
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Ce résultat a déjà été enregistré.
                  Pour le corriger, supprime le match puis recrée-le.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <section className="mb-5 rounded-3xl border border-danger/20 bg-danger/10 p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 font-bold text-danger">
                !
              </div>

              <p className="self-center text-sm leading-6 text-foreground">
                {error}
              </p>
            </div>
          </section>
        )}

        {/* Success */}
        {message && (
          <section className="mb-5 rounded-3xl border border-accent/20 bg-accent/10 p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent">
                ✓
              </div>

              <p className="self-center text-sm leading-6 text-foreground">
                {message}
              </p>
            </div>
          </section>
        )}

        {/* Score hero */}
        <section className="mb-5 rounded-3xl border border-border bg-surface p-5">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Score du match
              </p>

              <p className="mt-1 text-4xl font-bold tracking-tight">
                {setWinsTeam1}
                <span className="mx-2 text-muted-2">—</span>
                {setWinsTeam2}
              </p>
            </div>

            {winner && (
              <div
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  userWon
                    ? "bg-accent/10 text-accent"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {userWon ? "Victoire" : "Défaite"}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {sets.map((set, index) => {
              const setWinner = getSetWinner(set);

              return (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-surface-2 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">
                        {set.isMatchTiebreak
                          ? "Super tie-break"
                          : `Set ${index + 1}`}
                      </p>

                      <p className="mt-0.5 text-xs text-muted">
                        {setWinner
                          ? setWinner === userTeam
                            ? "Vous remportez ce set"
                            : "L'adversaire remporte ce set"
                          : "En cours"}
                      </p>
                    </div>

                    {setWinner && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted">
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
                        className="h-16 w-full rounded-2xl border border-border bg-background px-3 text-center text-2xl font-bold text-foreground outline-none transition-all focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <span className="pb-5 text-lg font-bold text-muted-2">
                      —
                    </span>

                    <div>
                      <label className="mb-2 block text-right text-xs font-bold uppercase tracking-[0.14em] text-muted">
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
                        className="h-16 w-full rounded-2xl border border-border bg-background px-3 text-center text-2xl font-bold text-foreground outline-none transition-all focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                          Score du tie-break
                        </p>

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
                            className="h-12 w-full rounded-2xl border border-border bg-background px-3 text-center font-bold text-foreground outline-none transition-all focus:border-accent disabled:opacity-50"
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
                            className="h-12 w-full rounded-2xl border border-border bg-background px-3 text-center font-bold text-foreground outline-none transition-all focus:border-accent disabled:opacity-50"
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
                        className={`mt-4 min-h-12 w-full rounded-2xl border px-4 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
                          set.isMatchTiebreak
                            ? "border-accent bg-accent text-background"
                            : "border-border bg-background text-foreground hover:border-accent/40"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {set.isMatchTiebreak
                          ? "Super tie-break activé"
                          : "Utiliser un super tie-break"}
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
                className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl border border-border bg-surface-2 px-5 font-bold text-foreground transition-all duration-200 hover:border-accent/40 hover:bg-surface active:scale-[0.98]"
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
              className="mt-5 flex min-h-16 w-full items-center justify-center rounded-2xl bg-accent px-5 font-bold text-background transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {saving
                ? "Enregistrement..."
                : "Valider le résultat"}
            </button>
          )}
        </section>

        {/* Point preview */}
        {match.result_type === "competitive" &&
          preview &&
          matchFinished && (
            <section className="mb-5 rounded-3xl border border-border bg-surface p-5">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Classement
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Aperçu des points
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Estimation basée sur le barème actuel.
                </p>
              </div>

              <div className="mb-5 rounded-2xl bg-surface-2 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  Évolution estimée
                </p>

                <p
                  className={`mt-2 text-4xl font-bold tracking-tight ${
                    preview.total >= 0
                      ? "text-accent"
                      : "text-danger"
                  }`}
                >
                  {formatChange(preview.total)}
                </p>
              </div>

              <div className="space-y-1">
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
                      className="flex items-center justify-between gap-4 rounded-xl px-2 py-2.5"
                    >
                      <span className="text-sm text-muted">
                        {label}
                      </span>

                      <span
                        className={`text-sm font-bold ${
                          Number(value) >= 0
                            ? "text-accent"
                            : "text-danger"
                        }`}
                      >
                        {formatChange(Number(value))}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

        {/* Ranking detail */}
        {match.result_type === "competitive" &&
          rankingDetail && (
            <section className="mb-5 rounded-3xl border border-border bg-surface p-5">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Résultat enregistré
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Détail des points
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Calcul réellement enregistré dans le classement.
                </p>
              </div>

              <div className="mb-5 rounded-2xl bg-surface-2 p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                  Évolution
                </p>

                <p
                  className={`mt-2 text-4xl font-bold tracking-tight ${
                    rankingDetail.points_change >= 0
                      ? "text-accent"
                      : "text-danger"
                  }`}
                >
                  {formatChange(
                    rankingDetail.points_change
                  )}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {rankingDetail.old_points} →{" "}
                  {rankingDetail.new_points} points
                </p>
              </div>

              <div className="space-y-1">
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
                      className="flex items-center justify-between gap-4 rounded-xl px-2 py-2.5"
                    >
                      <span className="text-sm text-muted">
                        {label}
                      </span>

                      <span
                        className={`text-sm font-bold ${
                          Number(value) >= 0
                            ? "text-accent"
                            : "text-danger"
                        }`}
                      >
                        {formatChange(Number(value))}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

        {/* Friendly */}
        {match.result_type === "friendly" && (
          <section className="mb-5 rounded-3xl border border-border bg-surface p-5">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-lg">
                🤝
              </div>

              <div>
                <h2 className="font-bold">
                  Match amical
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Ce match est enregistré dans tes statistiques,
                  mais il ne modifie pas les points du classement.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Scoring rules */}
        <section className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Classement
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Barème des points
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted">
              Les règles utilisées pour calculer ton classement.
            </p>
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <p className="mb-3 font-bold">
                Points de base du match
              </p>

              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Victoire
                  </span>

                  <span className="font-bold text-accent">
                    +25 pts
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Défaite
                  </span>

                  <span className="font-bold text-danger">
                    -20 pts
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <p className="mb-3 font-bold">
                Bonus de performance
              </p>

              <div className="space-y-3">
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
                    className="flex justify-between gap-4"
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

            <div className="border-t border-border pt-5">
              <p className="mb-3 font-bold">
                Pénalités et atténuations
              </p>

              <div className="space-y-3">
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
                    className="flex justify-between gap-4"
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
      </div>
    </main>
  );
}