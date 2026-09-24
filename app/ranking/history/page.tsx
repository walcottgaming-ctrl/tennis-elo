"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/supabase/client";
import RankingProgression from "@/app/components/RankingProgression";
import SportIcon from "@/app/components/SportIcon";
import {
  useSportMode,
  type SportMode,
} from "@/app/context/SportModeContext";

type Sport = SportMode;

type RankingHistory = {
  id: string;
  match_id: string;
  player_id: string;
  sport: Sport;
  old_points: number | null;
  new_points: number | null;
  points_change: number | null;
  base_points: number | null;
  bonus_bulle: number | null;
  bonus_double_bulle: number | null;
  bonus_victoire_propre: number | null;
  bonus_serie: number | null;
  bonus_performer: number | null;
  malus_fanny: number | null;
  malus_double_bulle: number | null;
  malus_contre_performance: number | null;
  amortisseur_tiebreak: number | null;
  bonus_stb_large: number | null;
  bonus_stb_perfect: number | null;
  created_at: string;
};

type Match = {
  id: string;
  sport: Sport;
  created_at: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

function ArrowUpIcon({
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
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon({
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
      <path d="m18 13-6 6-6-6" />
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
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
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
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6 6" />
    </svg>
  );
}

function CalculatorIcon({
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
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2" />
    </svg>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSportLabel(sport: Sport) {
  if (sport === "tennis") {
    return "Tennis";
  }

  if (sport === "padel") {
    return "Padel";
  }

  return "Super Tie-Break";
}

function getPositiveDetails(item: RankingHistory) {
  return [
    ["Bulle", item.bonus_bulle],
    ["Double bulle", item.bonus_double_bulle],
    ["Victoire propre", item.bonus_victoire_propre],
    ["Série", item.bonus_serie],
    ["Performer", item.bonus_performer],
    ["Super Tie-Break large", item.bonus_stb_large],
    ["Super Tie-Break parfait", item.bonus_stb_perfect],
  ].filter(([, value]) => value !== null && value !== 0);
}

function getNegativeDetails(item: RankingHistory) {
  return [
    ["Fanny", item.malus_fanny],
    ["Double bulle", item.malus_double_bulle],
    ["Contre-performance", item.malus_contre_performance],
    ["Amortisseur tie-break", item.amortisseur_tiebreak],
  ].filter(([, value]) => value !== null && value !== 0);
}

const supabase = createClient();

export default function RankingHistoryPage() {
  const { mode } = useSportMode();

  const [history, setHistory] = useState<RankingHistory[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setMessage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          "Vous devez être connecté pour voir votre historique."
        );
        setLoading(false);
        return;
      }

      const [
        { data: profileData, error: profileError },
        { data: historyData, error: historyError },
        { data: matchesData, error: matchesError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, last_name, username")
          .eq("id", user.id)
          .single(),

        supabase
          .from("ranking_history")
          .select(
            `
              id,
              match_id,
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
              bonus_stb_large,
              bonus_stb_perfect,
              created_at
            `
          )
          .eq("player_id", user.id)
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("matches")
          .select("id, sport, created_at")
          .order("created_at", {
            ascending: true,
          }),
      ]);

      if (profileError) {
        console.error(profileError);
      }

      if (historyError) {
        console.error(historyError);
        setMessage(
          "Impossible de charger votre historique."
        );
        setLoading(false);
        return;
      }

      if (matchesError) {
        console.error(matchesError);
        setMessage(
          "Impossible de charger les matchs."
        );
        setLoading(false);
        return;
      }

      setProfile(profileData);

      setHistory(
        (historyData ?? []) as RankingHistory[]
      );

      setMatches(
        (matchesData ?? []) as Match[]
      );

      setLoading(false);
    }

    loadHistory();
  }, []);

  const filteredHistory = useMemo(
    () =>
      history.filter(
        (item) => item.sport === mode
      ),
    [history, mode]
  );

  /*
   * Source de vérité :
   *
   * Les points actuels viennent du dernier
   * ranking_history.new_points.
   *
   * Mais pour déterminer quel est réellement
   * le dernier résultat, on utilise :
   *
   * 1. matches.created_at
   * 2. matches.id en cas d'égalité
   */

  const currentPoints = useMemo(() => {
    const matchById = new Map(
      matches.map((match) => [
        match.id,
        match,
      ])
    );

    let latestHistory:
      | RankingHistory
      | null = null;

    let latestMatch: Match | null = null;

    for (const item of filteredHistory) {
      if (item.new_points === null) {
        continue;
      }

      const match =
        matchById.get(item.match_id);

      if (!match) {
        continue;
      }

      if (
        !latestHistory ||
        !latestMatch
      ) {
        latestHistory = item;
        latestMatch = match;
        continue;
      }

      const currentMatchTime =
        new Date(
          match.created_at
        ).getTime();

      const latestMatchTime =
        new Date(
          latestMatch.created_at
        ).getTime();

      if (
        currentMatchTime >
          latestMatchTime ||
        (
          currentMatchTime ===
            latestMatchTime &&
          match.id >
            latestMatch.id
        )
      ) {
        latestHistory = item;
        latestMatch = match;
      }
    }

    return latestHistory?.new_points ?? 1000;
  }, [filteredHistory, matches]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -right-35 top-[32%] h-80 w-80 rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute -bottom-45 left-[35%] h-96 w-96 rounded-full bg-indigo-500/10 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-lg pb-8">
        <header className="mb-6">
          <Link
            href="/ranking"
            aria-label="Retour au classement"
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow">
                Progression · {getSportLabel(mode)}
              </p>

              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-[34px]">
                Historique des points
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                Suis l&apos;évolution de ton classement et comprends chaque
                variation de points.
              </p>
            </div>

            <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent shadow-[0_0_28px_var(--accent-glow)]">
              <div className="absolute inset-0 rounded-full bg-accent/10 blur-xl" />

              <SportIcon
                sport={mode}
                className="relative h-5 w-5"
              />
            </div>
          </div>
        </header>

        <section className="glass-strong relative mb-5 overflow-hidden rounded-[28px] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-[70px]" />

          <div className="relative">
            <div className="flex items-end justify-between gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
                    <SportIcon
                      sport={mode}
                      className="h-3.5 w-3.5"
                    />
                  </div>

                  <p className="eyebrow">
                    {getSportLabel(mode)}
                  </p>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold tracking-[-0.04em]">
                    {currentPoints}
                  </span>

                  <span className="text-sm font-semibold text-accent">
                    pts
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted">
                  Total actuel
                </p>
              </div>

              <div className="hidden text-right sm:block">
                <p className="eyebrow">
                  Évolutions
                </p>

                <p className="mt-1 font-display text-2xl font-bold">
                  {filteredHistory.length}
                </p>

                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  enregistrées
                </p>
              </div>
            </div>

            <div className="mt-6 h-px bg-white/6" />

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/10 bg-accent/10 text-accent">
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                </div>

                <span className="truncate text-xs text-muted">
                  Progression du classement
                </span>
              </div>

              <span className="shrink-0 rounded-full border border-accent/10 bg-accent/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
                {getSportLabel(mode)}
              </span>
            </div>
          </div>
        </section>

        {loading && (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-[26px] border border-white/5 bg-white/4" />
            <div className="h-52 animate-pulse rounded-[26px] border border-white/5 bg-white/4" />
            <div className="h-52 animate-pulse rounded-[26px] border border-white/5 bg-white/4" />
          </div>
        )}

        {!loading && message && (
          <div className="glass rounded-[26px] border-danger/15 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                <span className="text-sm font-bold">
                  !
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Impossible de charger l&apos;historique
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          !message &&
          profile &&
          filteredHistory.length === 0 && (
            <div className="glass-strong relative overflow-hidden rounded-[28px] p-7 text-center">
              <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-accent/10 blur-[70px]" />

              <div className="relative">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
                  <SportIcon
                    sport={mode}
                    className="h-5 w-5"
                  />
                </div>

                <h2 className="mt-5 font-display text-lg font-bold">
                  Aucun historique
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                  Tes changements de points en{" "}
                  {getSportLabel(
                    mode
                  ).toLowerCase()}{" "}
                  apparaîtront ici après tes matchs.
                </p>
              </div>
            </div>
          )}

        {!loading && !message && profile && (
          <section className="glass rounded-[28px] p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">
                  Évolution
                </p>

                <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
                  Ta progression
                </h2>
              </div>

              <div className="grid h-10 w-10 place-items-center rounded-full border border-accent/10 bg-accent/10 text-accent">
                <ArrowUpIcon className="h-4 w-4" />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/10 p-1">
              <RankingProgression
                userId={profile.id}
                sport={mode}
                currentPoints={currentPoints}
              />
            </div>
          </section>
        )}

        {!loading &&
          !message &&
          filteredHistory.length > 0 && (
            <section className="mt-7">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    Dernières évolutions
                  </p>

                  <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                    Ton parcours
                  </h2>
                </div>

                <span className="shrink-0 rounded-full border border-white/8 bg-white/4.5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {filteredHistory.length}{" "}
                  {filteredHistory.length > 1
                    ? "évolutions"
                    : "évolution"}
                </span>
              </div>

              <div className="relative space-y-3">
                {filteredHistory
                  .slice()
                  .sort((a, b) => {
                    const matchA =
                      matches.find(
                        (match) =>
                          match.id ===
                          a.match_id
                      );

                    const matchB =
                      matches.find(
                        (match) =>
                          match.id ===
                          b.match_id
                      );

                    if (!matchA || !matchB) {
                      return (
                        new Date(
                          b.created_at
                        ).getTime() -
                        new Date(
                          a.created_at
                        ).getTime()
                      );
                    }

                    const timeA =
                      new Date(
                        matchA.created_at
                      ).getTime();

                    const timeB =
                      new Date(
                        matchB.created_at
                      ).getTime();

                    if (timeA !== timeB) {
                      return timeB - timeA;
                    }

                    return b.match_id.localeCompare(
                      a.match_id
                    );
                  })
                  .map((item) => {
                    const change =
                      item.points_change ?? 0;

                    const positiveDetails =
                      getPositiveDetails(item);

                    const negativeDetails =
                      getNegativeDetails(item);

                    const hasCalculationDetails =
                      (item.base_points !== null &&
                        item.base_points !== 0) ||
                      positiveDetails.length > 0 ||
                      negativeDetails.length > 0;

                    return (
                      <article
                        key={item.id}
                        className="glass group relative overflow-hidden rounded-[28px] p-4 transition-all duration-200 hover:border-white/12 sm:p-5"
                      >
                        {change > 0 && (
                          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-accent/5 blur-[60px]" />
                        )}

                        <div className="relative flex items-start gap-3">
                          <div
                            className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border ${
                              change > 0
                                ? "border-accent/15 bg-accent/10 text-accent shadow-[0_0_18px_var(--accent-glow)]"
                                : change < 0
                                  ? "border-danger/15 bg-danger/10 text-danger"
                                  : "border-white/8 bg-white/5 text-muted"
                            }`}
                          >
                            {change > 0 ? (
                              <ArrowUpIcon />
                            ) : change < 0 ? (
                              <ArrowDownIcon />
                            ) : (
                              <SportIcon
                                sport={item.sport}
                                className="h-4 w-4"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {change > 0
                                      ? "Points gagnés"
                                      : change < 0
                                        ? "Points perdus"
                                        : "Évolution"}
                                  </p>

                                  <span className="rounded-full border border-white/5 bg-white/4.5 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
                                    {getSportLabel(
                                      item.sport
                                    )}
                                  </span>
                                </div>

                                <p className="mt-1 text-[11px] text-muted">
                                  {formatDate(
                                    item.created_at
                                  )}{" "}
                                  ·{" "}
                                  {formatTime(
                                    item.created_at
                                  )}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p
                                  className={`font-display text-xl font-bold tracking-tight ${
                                    change > 0
                                      ? "text-accent"
                                      : change < 0
                                        ? "text-danger"
                                        : "text-muted"
                                  }`}
                                >
                                  {change > 0
                                    ? "+"
                                    : ""}
                                  {change}
                                </p>

                                <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
                                  points
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-white/5 bg-black/10 px-3.5 py-3.5">
                              <div>
                                <p className="eyebrow">
                                  Avant
                                </p>

                                <p className="mt-1 font-display text-lg font-bold">
                                  {item.old_points ??
                                    0}
                                </p>
                              </div>

                              <div
                                className={`grid h-8 w-8 place-items-center rounded-full border ${
                                  change > 0
                                    ? "border-accent/10 bg-accent/5 text-accent"
                                    : change < 0
                                      ? "border-danger/10 bg-danger/5 text-danger"
                                      : "border-white/5 bg-white/5 text-muted"
                                }`}
                              >
                                {change > 0 ? (
                                  <ArrowUpIcon className="h-3.5 w-3.5" />
                                ) : change < 0 ? (
                                  <ArrowDownIcon className="h-3.5 w-3.5" />
                                ) : (
                                  <span className="text-xs">
                                    —
                                  </span>
                                )}
                              </div>

                              <div className="text-right">
                                <p className="eyebrow">
                                  Après
                                </p>

                                <p className="mt-1 font-display text-lg font-bold">
                                  {item.new_points ??
                                    0}
                                </p>
                              </div>
                            </div>

                            {hasCalculationDetails && (
                              <div className="mt-4 border-t border-white/5 pt-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="grid h-8 w-8 place-items-center rounded-full border border-white/5 bg-white/5 text-muted">
                                    <CalculatorIcon className="h-3.5 w-3.5" />
                                  </div>

                                  <div>
                                    <p className="eyebrow">
                                      Détail du calcul
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 space-y-1.5">
                                  {item.base_points !== null &&
                                    item.base_points !== 0 && (
                                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2.5 px-3 py-2 text-xs">
                                        <span className="text-muted">
                                          Points de base
                                        </span>

                                        <span className="font-semibold">
                                          {item.base_points >
                                          0
                                            ? "+"
                                            : ""}
                                          {
                                            item.base_points
                                          }
                                        </span>
                                      </div>
                                    )}

                                  {positiveDetails.map(
                                    ([
                                      label,
                                      value,
                                    ]) => (
                                      <div
                                        key={`positive-${label}`}
                                        className="flex items-center justify-between rounded-xl border border-accent/5 bg-accent/5 px-3 py-2 text-xs"
                                      >
                                        <span className="text-muted">
                                          {label}
                                        </span>

                                        <span className="font-semibold text-accent">
                                          +{value}
                                        </span>
                                      </div>
                                    )
                                  )}

                                  {negativeDetails.map(
                                    ([
                                      label,
                                      value,
                                    ]) => (
                                      <div
                                        key={`negative-${label}`}
                                        className="flex items-center justify-between rounded-xl border border-danger/5 bg-danger/5 px-3 py-2 text-xs"
                                      >
                                        <span className="text-muted">
                                          {label}
                                        </span>

                                        <span className="font-semibold text-danger">
                                          {Number(
                                            value
                                          ) > 0
                                            ? "-"
                                            : ""}
                                          {Math.abs(
                                            Number(
                                              value
                                            )
                                          )}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          )}

        <Link
          href="/ranking"
          className="group mt-7 flex min-h-14 items-center gap-3 rounded-3xl border border-white/8 bg-white/4.5 px-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/10 bg-accent/10 text-accent">
            <ArrowLeftIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Retour au classement
            </p>

            <p className="mt-0.5 text-[11px] text-muted">
              Voir le classement{" "}
              {getSportLabel(mode)}
            </p>
          </div>

          <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-2 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}