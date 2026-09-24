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
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}

function TrophyIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v2a3 3 0 0 0 3 3" />
      <path d="M16 6h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4" />
      <path d="M8 20h8" />
      <path d="M9 17h6" />
    </svg>
  );
}

function ChartIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-4 3 2 5-7" />
    </svg>
  );
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
      <main className="min-h-screen px-4 pb-32 pt-6 text-foreground sm:px-5">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%), #0c0f17",
              backgroundAttachment: "fixed",
            }}
          />
        </div>

        <div className="mx-auto max-w-lg">
          <Link
            href="/supertiebreak"
            aria-label="Retour au Super Tie-Break"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>

          <div className="glass-strong relative mt-7 overflow-hidden rounded-[28px] p-5 sm:p-6">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 12%, transparent)",
              }}
            />

            <div className="relative flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent shadow-[0_0_20px_var(--accent-glow)]">
                <SportIcon
                  sport="super_tiebreak"
                  className="h-5 w-5"
                />
              </div>

              <div>
                <p className="eyebrow">Résultat</p>

                <h1 className="mt-1 font-display text-xl font-semibold">
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
                className="relative mt-6 flex min-h-12 items-center justify-between rounded-2xl bg-accent px-4 font-semibold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
              >
                <span>Enregistrer le résultat</span>

                <span className="text-lg">→</span>
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
    <main className="min-h-screen px-4 pb-32 pt-6 text-foreground sm:px-5">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%), #0c0f17",
            backgroundAttachment: "fixed",
          }}
        />
      </div>

      <div className="mx-auto max-w-lg pb-8">
        {/* HEADER */}
        <Link
          href="/supertiebreak"
          aria-label="Retour au Super Tie-Break"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>

        <header className="mt-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent shadow-[0_0_20px_var(--accent-glow)]">
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              />

              <SportIcon
                sport="super_tiebreak"
                className="relative h-5 w-5"
              />
            </div>

            <div className="min-w-0">
              <p className="eyebrow">Match terminé</p>

              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
                Super Tie-Break
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted">
            {formatDate(match.created_at)}
          </p>
        </header>

        {/* SCORE HERO */}
        <section className="glass-strong relative mt-7 overflow-hidden rounded-[30px]">
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 14%, transparent)",
              }}
            />

            <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
          </div>

          <div className="relative p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-white/8" />

              <p className="eyebrow text-accent">
                Super Tie-Break
              </p>

              <div className="h-px w-8 bg-white/8" />
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {/* TEAM 1 */}
              <div className="min-w-0 text-center">
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                    team1Won
                      ? "border-accent/25 bg-accent/10 text-accent shadow-[0_0_18px_var(--accent-glow)]"
                      : "border-white/8 bg-white/4.5 text-muted"
                  }`}
                >
                  <span className="text-sm font-bold">
                    1
                  </span>
                </div>

                <p className="mt-3 truncate text-sm font-semibold">
                  {playerName(team1)}
                </p>

                <p
                  className={`mt-3 font-display text-6xl font-bold leading-none tracking-tight ${
                    team1Won
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {set.team_1_score}
                </p>

                {team1Won && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />

                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      Victoire
                    </span>
                  </div>
                )}
              </div>

              {/* SEPARATOR */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-px bg-white/8" />

                <span className="font-display text-sm font-semibold text-muted">
                  VS
                </span>

                <div className="h-8 w-px bg-white/8" />
              </div>

              {/* TEAM 2 */}
              <div className="min-w-0 text-center">
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                    !team1Won
                      ? "border-accent/25 bg-accent/10 text-accent shadow-[0_0_18px_var(--accent-glow)]"
                      : "border-white/8 bg-white/4.5 text-muted"
                  }`}
                >
                  <span className="text-sm font-bold">
                    2
                  </span>
                </div>

                <p className="mt-3 truncate text-sm font-semibold">
                  {playerName(team2)}
                </p>

                <p
                  className={`mt-3 font-display text-6xl font-bold leading-none tracking-tight ${
                    !team1Won
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {set.team_2_score}
                </p>

                {!team1Won && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />

                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      Victoire
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
              <span className="h-1 w-1 rounded-full bg-accent" />

              Premier à 10 points avec 2 points d&apos;écart
            </div>
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
          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Classement</p>

                <h2 className="mt-1 font-display text-xl font-semibold">
                  Impact du match
                </h2>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                <TrophyIcon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* VAINQUEUR */}
              <div className="glass-strong rounded-3xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />

                      <p className="truncate font-semibold">
                        {playerName(winner)}
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {winnerScore}-{loserScore}
                    </p>
                  </div>

                  <p className="shrink-0 font-display text-xl font-bold text-accent">
                    {formatPointsChange(
                      winnerHistory.points_change
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
                  <p className="text-sm text-muted">
                    Nouveau classement
                  </p>

                  <p className="font-display font-semibold">
                    {winnerHistory.new_points.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    <span className="text-xs font-medium text-muted">
                      pts
                    </span>
                  </p>
                </div>
              </div>

              {/* PERDANT */}
              <div className="glass rounded-3xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-2" />

                      <p className="truncate font-semibold">
                        {playerName(loser)}
                      </p>
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {winnerScore}-{loserScore}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 font-display text-xl font-bold ${
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

                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
                  <p className="text-sm text-muted">
                    Nouveau classement
                  </p>

                  <p className="font-display font-semibold">
                    {loserHistory.new_points.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    <span className="text-xs font-medium text-muted">
                      pts
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CALCUL */}
        {winnerHistory && loserHistory && (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Calcul des points</p>

                <h2 className="mt-1 font-display text-xl font-semibold">
                  Détail du calcul
                </h2>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4.5 text-muted">
                <ChartIcon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* VAINQUEUR */}
              <div className="glass rounded-3xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate font-semibold">
                    {playerName(winner)}
                  </p>

                  <p className="shrink-0 text-sm font-bold text-accent">
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
              <div className="glass rounded-3xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate font-semibold">
                    {playerName(loser)}
                  </p>

                  <p className="shrink-0 text-sm font-bold text-danger">
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}