import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  points_tennis: number;
  points_padel: number;
};

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | Profile[] | null;
};

type Match = {
  id: string;
  sport: "tennis" | "padel";
  format: "singles" | "doubles";
  match_type: "group_match" | "quick_1v1";
  result_type: "competitive" | "friendly";
  surface: string | null;
  duration_minutes: number | null;
  created_at: string;
  match_players: MatchPlayer[];
};

type SetRow = {
  id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
  tie_break_team_1_score: number | null;
  tie_break_team_2_score: number | null;
  is_match_tiebreak: boolean;
};

type RankingHistory = {
  id: string;
  player_id: string;
  sport: "tennis" | "padel";
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
  created_at: string;
  profiles: Profile | Profile[] | null;
};

function getProfile(
  profiles: Profile | Profile[] | null
): Profile | null {
  if (!profiles) return null;

  return Array.isArray(profiles)
    ? profiles[0] ?? null
    : profiles;
}

function getPlayerName(
  profiles: Profile | Profile[] | null,
  guestName: string | null
) {
  const profile = getProfile(profiles);

  if (!profile) {
    return guestName || "Invité";
  }

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile.username || "Joueur";
}

function getPoints(
  profile: Profile | null,
  sport: "tennis" | "padel"
) {
  if (!profile) return null;

  return sport === "tennis"
    ? profile.points_tennis
    : profile.points_padel;
}

function formatSport(sport: string) {
  return sport === "tennis" ? "Tennis" : "Padel";
}

function formatFormat(format: string) {
  return format === "singles" ? "1 contre 1" : "Double";
}

function formatMatchType(
  matchType: string,
  format: string
) {
  if (matchType === "group_match") {
    return "Match de groupe";
  }

  if (format === "doubles") {
    return "Double";
  }

  return "Simple";
}

function formatSurface(surface: string | null) {
  if (!surface) return null;

  const labels: Record<string, string> = {
    hard: "Dur",
    clay: "Terre battue",
    grass: "Gazon",
    indoor: "Indoor",
  };

  return labels[surface] ?? surface;
}

function getWinnerTeam(sets: SetRow[]) {
  let team1Wins = 0;
  let team2Wins = 0;

  for (const set of sets) {
    if (set.team_1_score > set.team_2_score) {
      team1Wins++;
    }

    if (set.team_2_score > set.team_1_score) {
      team2Wins++;
    }
  }

  if (team1Wins >= 2) return 1;
  if (team2Wins >= 2) return 2;

  return null;
}

function SportIcon({
  sport,
  className = "h-5 w-5",
}: {
  sport: "tennis" | "padel";
  className?: string;
}) {
  if (sport === "tennis") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M6.5 5.5c2.8 1.4 4.5 3.6 5.1 6.3.6 2.8-.1 5.2-2 7.2M17.5 5.5c-2.8 1.4-4.5 3.6-5.1 6.3-.6 2.8.1 5.2 2 7.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 8h16M4 16h16M8 3v5M16 3v5M8 16v5M16 16v5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="currentColor"
      />
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
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 6H5.5v1.5A3.5 3.5 0 0 0 9 11M16 6h2.5v1.5A3.5 3.5 0 0 1 15 11M12 12.5V17M8.5 20h7M10 17h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 12H5M11 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      className={className}
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5 20c.8-3.5 3.1-5.5 7-5.5s6.2 2 7 5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SurfaceIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 17c2.5-3 5-4.5 8-4.5S17.5 14 20 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M4 12c2.5-3 5-4.5 8-4.5s5.5 1.5 8 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(`
      id,
      sport,
      format,
      match_type,
      result_type,
      surface,
      duration_minutes,
      created_at,
      match_players (
        player_id,
        team,
        guest_name,
        profiles (
          id,
          username,
          first_name,
          last_name,
          points_tennis,
          points_padel
        )
      )
    `)
    .eq("id", id)
    .single();

  if (matchError || !match) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon />
            Retour aux matchs
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-surface p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              Match introuvable
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              Ce match n&apos;existe plus ou n&apos;est pas accessible.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const typedMatch = match as Match;

  const { data: sets } = await supabase
    .from("sets")
    .select(`
      id,
      set_number,
      team_1_score,
      team_2_score,
      tie_break_team_1_score,
      tie_break_team_2_score,
      is_match_tiebreak
    `)
    .eq("match_id", id)
    .order("set_number", { ascending: true });

  const { data: rankingHistory } = await supabase
    .from("ranking_history")
    .select(`
      id,
      player_id,
      sport,
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
      amortisseur_tiebreak,
      created_at,
      profiles (
        id,
        username,
        first_name,
        last_name,
        points_tennis,
        points_padel
      )
    `)
    .eq("match_id", id)
    .order("created_at", { ascending: true });

  const team1 = typedMatch.match_players.filter(
    (player) => player.team === 1
  );

  const team2 = typedMatch.match_players.filter(
    (player) => player.team === 2
  );

  const typedSets = (sets ?? []) as SetRow[];
  const typedHistory = (rankingHistory ?? []) as RankingHistory[];

  const winnerTeam = getWinnerTeam(typedSets);

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon />
          Retour aux matchs
        </Link>

        {/* Header */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <SportIcon sport={typedMatch.sport} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                    {formatSport(typedMatch.sport)}
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight">
                    {formatFormat(typedMatch.format)}
                  </h1>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  typedMatch.result_type === "friendly"
                    ? "bg-white/5 text-muted"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {typedMatch.result_type === "friendly"
                  ? "Amical"
                  : "Compétitif"}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">
                {formatMatchType(
                  typedMatch.match_type,
                  typedMatch.format
                )}
              </span>

              {typedMatch.surface && (
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">
                  {formatSurface(typedMatch.surface)}
                </span>
              )}

              {typedMatch.duration_minutes && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {typedMatch.duration_minutes} min
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Players */}
        <section className="mt-8">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Participants
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Les équipes
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[team1, team2].map((team, index) => {
              const teamNumber = index + 1;
              const isWinner = winnerTeam === teamNumber;

              return (
                <div
                  key={teamNumber}
                  className={`rounded-2xl border p-4 transition-colors ${
                    isWinner
                      ? "border-accent/30 bg-accent/5"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                      Équipe {teamNumber}
                    </p>

                    {isWinner && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <TrophyIcon className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-4">
                    {team.map((player) => {
                      const profile = getProfile(player.profiles);
                      const points = getPoints(
                        profile,
                        typedMatch.sport
                      );

                      return (
                        <div
                          key={
                            player.player_id ??
                            `guest-${player.guest_name}`
                          }
                          className="min-w-0"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                              <UserIcon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {getPlayerName(
                                  player.profiles,
                                  player.guest_name
                                )}
                              </p>

                              {profile && points !== null ? (
                                <p className="mt-1 text-xs text-muted">
                                  {points} pts
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-muted">
                                  Invité
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Result */}
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Score
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Résultat
              </h2>
            </div>

            <Link
              href={`/matches/${typedMatch.id}/result`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
            >
              Modifier
              <ChevronRightIcon />
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5">
            {typedSets.length === 0 ? (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <TrophyIcon />
                </div>

                <p className="mt-4 text-sm font-medium text-muted">
                  Aucun résultat enregistré.
                </p>

                <Link
                  href={`/matches/${typedMatch.id}/result`}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-background transition hover:brightness-105 active:scale-[0.98]"
                >
                  Ajouter le résultat
                </Link>
              </div>
            ) : (
              <>
                {winnerTeam && (
                  <div className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <TrophyIcon className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                        Victoire
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        Équipe {winnerTeam} remporte le match
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {typedSets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-surface-2 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted">
                          {set.is_match_tiebreak
                            ? "Super tie-break"
                            : `Set ${set.set_number}`}
                        </p>

                        {!set.is_match_tiebreak &&
                          set.tie_break_team_1_score !== null &&
                          set.tie_break_team_2_score !== null && (
                            <p className="mt-1 text-[11px] text-muted-2">
                              Tie-break{" "}
                              {set.tie_break_team_1_score}-
                              {set.tie_break_team_2_score}
                            </p>
                          )}
                      </div>

                      <span className="shrink-0 text-xl font-bold tracking-tight">
                        {set.team_1_score}
                        <span className="mx-1.5 text-muted-2">
                          -
                        </span>
                        {set.team_2_score}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Ranking history */}
        {typedHistory.length > 0 && (
          <section className="mt-8">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Classement
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Évolution des points
              </h2>
            </div>

            <div className="space-y-3">
              {typedHistory.map((history) => {
                const profile = getProfile(history.profiles);

                const name = getPlayerName(
                  profile,
                  null
                );

                const positive =
                  history.points_change >= 0;

                const details = [
                  history.base_points !== 0 && {
                    label: "Base",
                    value: history.base_points,
                  },
                  history.bonus_bulle !== 0 && {
                    label: "Set blanc",
                    value: history.bonus_bulle,
                  },
                  history.bonus_double_bulle !== 0 && {
                    label: "Match parfait",
                    value: history.bonus_double_bulle,
                  },
                  history.bonus_victoire_propre !== 0 && {
                    label: "Victoire nette",
                    value: history.bonus_victoire_propre,
                  },
                  history.bonus_serie !== 0 && {
                    label: "Série",
                    value: history.bonus_serie,
                  },
                  history.bonus_performer !== 0 && {
                    label: "Performance",
                    value: history.bonus_performer,
                  },
                  history.malus_fanny !== 0 && {
                    label: "Set blanc concédé",
                    value: history.malus_fanny,
                  },
                  history.malus_double_bulle !== 0 && {
                    label: "Match sans jeu",
                    value: history.malus_double_bulle,
                  },
                  history.malus_contre_performance !== 0 && {
                    label: "Contre-performance",
                    value: history.malus_contre_performance,
                  },
                  history.amortisseur_tiebreak !== 0 && {
                    label: "Défaite serrée",
                    value: history.amortisseur_tiebreak,
                  },
                ].filter(Boolean) as {
                  label: string;
                  value: number;
                }[];

                return (
                  <div
                    key={history.id}
                    className="rounded-3xl border border-border bg-surface p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                          <UserIcon />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {name}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {history.old_points} →{" "}
                            {history.new_points} pts
                          </p>
                        </div>
                      </div>

                      <div
                        className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold ${
                          positive
                            ? "bg-accent/10 text-accent"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {history.points_change}
                      </div>
                    </div>

                    {details.length > 0 && (
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                          Détail
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                          {details.map((detail) => (
                            <div
                              key={`${history.id}-${detail.label}`}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-muted">
                                {detail.label}
                              </span>

                              <span
                                className={
                                  detail.value >= 0
                                    ? "font-semibold text-foreground"
                                    : "font-semibold text-danger"
                                }
                              >
                                {detail.value > 0 ? "+" : ""}
                                {detail.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Match information */}
        <section className="mt-8">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Informations
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Détails du match
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <TrophyIcon className="h-4 w-4" />
              </div>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Type
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatMatchType(
                  typedMatch.match_type,
                  typedMatch.format
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-muted">
                <SurfaceIcon />
              </div>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Surface
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatSurface(typedMatch.surface) ?? "—"}
              </p>
            </div>
          </div>

          {typedMatch.duration_minutes && (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-muted">
                  <ClockIcon />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    Durée
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {typedMatch.duration_minutes} min
                  </p>
                </div>
              </div>

              <CheckIcon className="text-accent" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}