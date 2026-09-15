import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/src/supabase/server";
import MatchReactions from "@/app/components/MatchReactions";
import SportIcon from "@/app/components/SportIcon";

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | null;
};

type Match = {
  id: string;
  created_by: string;
  created_at: string;
  sport: string;
  format: string;
  result_type: string;
  match_players: MatchPlayer[];
};

type Set = {
  id: string;
  team_1_score: number;
  team_2_score: number;
  is_match_tiebreak: boolean;
};

type RankingHistory = {
  player_id: string;
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

type MatchReaction = {
  id: string;
  user_id: string;
  reaction: string;
};

function playerName(player: MatchPlayer | null) {
  if (!player) return "Joueur";

  if (player.profiles) {
    const fullName = [
      player.profiles.first_name,
      player.profiles.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || player.profiles.username || "Joueur";
  }

  return player.guest_name || "Joueur";
}

function formatPointsChange(points: number) {
  if (points > 0) return `+${points}`;
  return `${points}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function SuperTieBreakMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(
      `
        id,
        created_by,
        created_at,
        sport,
        format,
        result_type,
        match_players (
          player_id,
          team,
          guest_name,
          profiles (
            id,
            username,
            first_name,
            last_name
          )
        )
      `
    )
    .eq("id", id)
    .eq("sport", "super_tiebreak")
    .single();

  if (matchError || !matchData) {
    notFound();
  }

  const match: Match = {
    id: matchData.id,
    created_by: matchData.created_by,
    created_at: matchData.created_at,
    sport: matchData.sport,
    format: matchData.format,
    result_type: matchData.result_type,
    match_players: (matchData.match_players ?? []).map(
      (player) => ({
        player_id: player.player_id,
        team: player.team,
        guest_name: player.guest_name,
        profiles: Array.isArray(player.profiles)
          ? player.profiles[0] ?? null
          : player.profiles ?? null,
      })
    ),
  };

  if (match.match_players.length !== 2) {
    notFound();
  }

  const { data: setData, error: setError } = await supabase
    .from("sets")
    .select(
      `
        id,
        team_1_score,
        team_2_score,
        is_match_tiebreak
      `
    )
    .eq("match_id", id)
    .eq("set_number", 1)
    .eq("is_match_tiebreak", true)
    .single();

  if (setError || !setData) {
    return (
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <Link
            href="/supertiebreak"
            className="inline-flex min-h-10 items-center text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            ← Super Tie-Break
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <SportIcon
                  sport="super_tiebreak"
                  className="h-5 w-5"
                />
              </div>

              <div>
                <h1 className="font-bold">
                  Résultat non enregistré
                </h1>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Le résultat de ce match n&apos;a pas encore été
                  enregistré.
                </p>
              </div>
            </div>

            {match.created_by === user.id && (
              <Link
                href={`/supertiebreak/${id}/result`}
                className="mt-5 inline-flex min-h-10 items-center font-semibold text-accent"
              >
                Enregistrer le résultat →
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  const set: Set = {
    id: setData.id,
    team_1_score: setData.team_1_score,
    team_2_score: setData.team_2_score,
    is_match_tiebreak: setData.is_match_tiebreak,
  };

  const { data: historyData } = await supabase
    .from("ranking_history")
    .select(
      `
        player_id,
        old_points,
        new_points,
        points_change,
        base_points,
        bonus_bulle,
        bonus_double_bulle,
        bonus_victoire_propre,
        bonus_serie,
        bonus_performer,
        malus_fanny,
        malus_double_bulle,
        malus_contre_performance,
        amortisseur_tiebreak
      `
    )
    .eq("match_id", id)
    .eq("sport", "super_tiebreak");

  const { data: matchReactions } = await supabase
    .from("match_reactions")
    .select("id, user_id, reaction")
    .eq("match_id", id)
    .order("created_at", {
      ascending: true,
    });

  const history: RankingHistory[] = historyData ?? [];

  const typedReactions =
    (matchReactions ?? []) as MatchReaction[];

  const team1 = match.match_players.find(
    (player) => player.team === 1
  );

  const team2 = match.match_players.find(
    (player) => player.team === 2
  );

  if (!team1 || !team2) {
    notFound();
  }

  const team1Won =
    set.team_1_score > set.team_2_score;

  const winner = team1Won ? team1 : team2;
  const loser = team1Won ? team2 : team1;

  const winnerScore = Math.max(
    set.team_1_score,
    set.team_2_score
  );

  const loserScore = Math.min(
    set.team_1_score,
    set.team_2_score
  );

  const winnerHistory = history.find(
    (entry) => entry.player_id === winner.player_id
  );

  const loserHistory = history.find(
    (entry) => entry.player_id === loser.player_id
  );

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg">
        <Link
          href="/supertiebreak"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          ← Super Tie-Break
        </Link>

        <header className="mt-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <SportIcon
                sport="super_tiebreak"
                className="h-5 w-5"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Match terminé
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Super Tie-Break
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted">
            {formatDate(match.created_at)}
          </p>
        </header>

        {/* SCORE */}
        <section className="mt-7 overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-6">
            <div className="min-w-0 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <span className="text-sm font-bold">
                  1
                </span>
              </div>

              <p className="mt-3 truncate text-sm font-bold">
                {playerName(team1)}
              </p>

              <p className="mt-3 text-5xl font-bold tracking-tight">
                {set.team_1_score}
              </p>

              {team1Won && (
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  Victoire
                </p>
              )}
            </div>

            <div className="text-sm font-bold text-muted">
              —
            </div>

            <div className="min-w-0 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-muted">
                <span className="text-sm font-bold">
                  2
                </span>
              </div>

              <p className="mt-3 truncate text-sm font-bold">
                {playerName(team2)}
              </p>

              <p className="mt-3 text-5xl font-bold tracking-tight">
                {set.team_2_score}
              </p>

              {!team1Won && (
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  Victoire
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-surface-2 px-5 py-3 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Super Tie-Break
            </p>
          </div>
        </section>

        {/* REACTIONS */}
        <MatchReactions
          matchId={match.id}
          currentUserId={user.id}
          initialReactions={typedReactions}
        />

        {/* POINTS */}
        {winnerHistory && loserHistory && (
          <section className="mt-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Classement
            </p>

            <div className="mt-3 space-y-3">
              {/* VAINQUEUR */}
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {playerName(winner)}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {winnerScore}-{loserScore}
                    </p>
                  </div>

                  <p className="shrink-0 text-xl font-bold text-accent">
                    {formatPointsChange(
                      winnerHistory.points_change
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted">
                    Nouveau classement
                  </p>

                  <p className="font-bold">
                    {winnerHistory.new_points.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    pts
                  </p>
                </div>
              </div>

              {/* PERDANT */}
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {playerName(loser)}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {winnerScore}-{loserScore}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 text-xl font-bold ${
                      loserHistory.points_change >= 0
                        ? "text-accent"
                        : "text-danger"
                    }`}
                  >
                    {formatPointsChange(
                      loserHistory.points_change
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted">
                    Nouveau classement
                  </p>

                  <p className="font-bold">
                    {loserHistory.new_points.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    pts
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CALCUL */}
        {winnerHistory && loserHistory && (
          <section className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Calcul des points
            </p>

            {/* VAINQUEUR */}
            <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="font-bold">
                  {playerName(winner)}
                </p>

                <p className="text-sm font-bold text-accent">
                  {formatPointsChange(
                    winnerHistory.points_change
                  )}
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Base victoire
                  </span>

                  <span className="font-semibold">
                    +{winnerHistory.base_points}
                  </span>
                </div>

                {winnerHistory.bonus_bulle > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Victoire propre
                    </span>

                    <span className="font-semibold">
                      +{winnerHistory.bonus_bulle}
                    </span>
                  </div>
                )}

                {winnerHistory.bonus_double_bulle > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      10-0
                    </span>

                    <span className="font-semibold">
                      +{winnerHistory.bonus_double_bulle}
                    </span>
                  </div>
                )}

                {winnerHistory.bonus_serie > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Série
                    </span>

                    <span className="font-semibold">
                      +{winnerHistory.bonus_serie}
                    </span>
                  </div>
                )}

                {winnerHistory.bonus_performer > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Performance
                    </span>

                    <span className="font-semibold">
                      +{winnerHistory.bonus_performer}
                    </span>
                  </div>
                )}

                {winnerHistory.amortisseur_tiebreak > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Amortisseur
                    </span>

                    <span className="font-semibold">
                      +{winnerHistory.amortisseur_tiebreak}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PERDANT */}
            <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="font-bold">
                  {playerName(loser)}
                </p>

                <p className="text-sm font-bold text-danger">
                  {formatPointsChange(
                    loserHistory.points_change
                  )}
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">
                    Base défaite
                  </span>

                  <span className="font-semibold">
                    {loserHistory.base_points}
                  </span>
                </div>

                {loserHistory.malus_fanny > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Fanny
                    </span>

                    <span className="font-semibold">
                      -{loserHistory.malus_fanny}
                    </span>
                  </div>
                )}

                {loserHistory.malus_double_bulle > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Double bulle
                    </span>

                    <span className="font-semibold">
                      -{loserHistory.malus_double_bulle}
                    </span>
                  </div>
                )}

                {loserHistory.malus_contre_performance > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Contre-performance
                    </span>

                    <span className="font-semibold">
                      -{loserHistory.malus_contre_performance}
                    </span>
                  </div>
                )}

                {loserHistory.amortisseur_tiebreak > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">
                      Défaite serrée
                    </span>

                    <span className="font-semibold">
                      +{loserHistory.amortisseur_tiebreak}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <Link
          href="/supertiebreak"
          className="mt-8 flex min-h-14 items-center justify-center rounded-2xl border border-border bg-surface px-5 font-bold transition-all duration-200 hover:bg-surface-2 active:scale-[0.98]"
        >
          Retour au Super Tie-Break
        </Link>
      </div>
    </main>
  );
}