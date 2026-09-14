"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/src/supabase/client";
import RankingProgression from "@/app/components/RankingProgression";

type Sport = "tennis" | "padel" | "super_tiebreak";

type RankingHistory = {
  id: string;
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
  created_at: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  points_tennis: number | null;
  points_padel: number | null;
  points_super_tiebreak: number | null;
};

function TennisIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5 5c3 1 5 3 6 6s0 6-2 8" />
      <path d="M19 19c-3-1-5-3-6-6s0-6 2-8" />
    </svg>
  );
}

function PadelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <circle cx="9" cy="8" r="1" />
      <circle cx="15" cy="8" r="1" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
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

function getSportIcon(sport: Sport) {
  if (sport === "tennis") {
    return <TennisIcon />;
  }

  if (sport === "padel") {
    return <PadelIcon />;
  }

  return <TennisIcon />;
}

function getPositiveDetails(item: RankingHistory) {
  return [
    ["Bulle", item.bonus_bulle],
    ["Double bulle", item.bonus_double_bulle],
    ["Victoire propre", item.bonus_victoire_propre],
    ["Série", item.bonus_serie],
    ["Performer", item.bonus_performer],
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
  const [history, setHistory] = useState<RankingHistory[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sport, setSport] = useState<Sport>("tennis");
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
        setMessage("Vous devez être connecté pour voir votre historique.");
        setLoading(false);
        return;
      }

      const [
        { data: profileData, error: profileError },
        { data: historyData, error: historyError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, first_name, last_name, username, points_tennis, points_padel, points_super_tiebreak"
          )
          .eq("id", user.id)
          .single(),

        supabase
          .from("ranking_history")
          .select(
            `
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
              created_at
            `
          )
          .eq("player_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileError) {
        console.error(profileError);
      }

      if (historyError) {
        console.error(historyError);
        setMessage("Impossible de charger votre historique.");
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setHistory((historyData ?? []) as RankingHistory[]);
      setLoading(false);
    }

    loadHistory();
  }, []);

  const filteredHistory = history.filter(
    (item) => item.sport === sport
  );

  const currentPoints =
    sport === "tennis"
      ? profile?.points_tennis ?? 0
      : sport === "padel"
        ? profile?.points_padel ?? 0
        : profile?.points_super_tiebreak ?? 0;

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        {/* Header */}
        <header className="mb-7">
          <Link
            href="/ranking"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">←</span>
            Classement
          </Link>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Progression
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Historique des points
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Suivez l&apos;évolution de votre classement et découvrez pourquoi
            vos points ont changé.
          </p>
        </header>

        {/* Sport selector */}
        <div className="mb-5 grid grid-cols-3 gap-2 rounded-3xl border border-border bg-surface p-2">
          <button
            type="button"
            onClick={() => setSport("tennis")}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition ${
              sport === "tennis"
                ? "border-accent bg-accent text-background"
                : "border-border bg-surface-2 text-muted"
            }`}
          >
            <TennisIcon />
            Tennis
          </button>

          <button
            type="button"
            onClick={() => setSport("padel")}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition ${
              sport === "padel"
                ? "border-accent bg-accent text-background"
                : "border-border bg-surface-2 text-muted"
            }`}
          >
            <PadelIcon />
            Padel
          </button>

          <button
            type="button"
            onClick={() => setSport("super_tiebreak")}
            className={`flex min-h-14 items-center justify-center rounded-2xl border px-3 text-xs font-bold transition ${
              sport === "super_tiebreak"
                ? "border-accent bg-accent text-background"
                : "border-border bg-surface-2 text-muted"
            }`}
          >
            Super TB
          </button>
        </div>

        {/* Current points */}
        <section className="mb-5 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {getSportLabel(sport)}
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight">
                {currentPoints}
                <span className="ml-1 text-lg font-bold text-accent">
                  pts
                </span>
              </p>

              <p className="mt-1 text-sm text-muted">
                Total actuel
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              {getSportIcon(sport)}
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl border border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted">
              Chargement de votre historique...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && message && (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">
              {message}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !message && profile && filteredHistory.length === 0 && (
          <div className="rounded-3xl border border-border bg-surface p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
              {getSportIcon(sport)}
            </div>

            <h2 className="mt-4 text-lg font-bold">
              Aucun historique
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              Vos changements de points en{" "}
              {getSportLabel(sport).toLowerCase()} apparaîtront ici après vos
              matchs.
            </p>
          </div>
        )}

        {/* Progression */}
        {!loading && !message && profile && (
          <RankingProgression
            userId={profile.id}
            sport={sport}
            currentPoints={currentPoints}
          />
        )}

        {/* History */}
        {!loading && !message && filteredHistory.length > 0 && (
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Dernières évolutions
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Votre parcours
                </h2>
              </div>

              <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-muted">
                {filteredHistory.length}{" "}
                {filteredHistory.length > 1
                  ? "évolutions"
                  : "évolution"}
              </span>
            </div>

            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const change = item.points_change ?? 0;
                const positiveDetails = getPositiveDetails(item);
                const negativeDetails = getNegativeDetails(item);

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-border bg-surface p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            change > 0
                              ? "bg-accent/10 text-accent"
                              : change < 0
                                ? "bg-danger/10 text-danger"
                                : "bg-surface-2 text-muted"
                          }`}
                        >
                          {change > 0 ? (
                            <ArrowUpIcon />
                          ) : change < 0 ? (
                            <ArrowDownIcon />
                          ) : (
                            getSportIcon(item.sport)
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold">
                              {change > 0
                                ? "Points gagnés"
                                : change < 0
                                  ? "Points perdus"
                                  : "Évolution"}
                            </p>

                            <span className="rounded-full bg-surface-2 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                              {getSportLabel(item.sport)}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-muted">
                            {formatDate(item.created_at)} ·{" "}
                            {formatTime(item.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-xl font-bold ${
                            change > 0
                              ? "text-accent"
                              : change < 0
                                ? "text-danger"
                                : "text-muted"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          {change}
                        </p>

                        <p className="text-xs font-medium text-muted">
                          points
                        </p>
                      </div>
                    </div>

                    {/* Points before / after */}
                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-surface-2 p-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                          Avant
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {item.old_points ?? 0}
                        </p>
                      </div>

                      <div className="text-muted">→</div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                          Après
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {item.new_points ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Calculation details */}
                    {(item.base_points ||
                      positiveDetails.length > 0 ||
                      negativeDetails.length > 0 ||
                      item.amortisseur_tiebreak) && (
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
                          Détail du calcul
                        </p>

                        <div className="space-y-2">
                          {item.base_points !== null &&
                            item.base_points !== 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted">
                                  Points de base
                                </span>

                                <span className="font-bold">
                                  {item.base_points > 0 ? "+" : ""}
                                  {item.base_points}
                                </span>
                              </div>
                            )}

                          {positiveDetails.map(([label, value]) => (
                            <div
                              key={`positive-${label}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted">
                                {label}
                              </span>

                              <span className="font-bold text-accent">
                                +{value}
                              </span>
                            </div>
                          ))}

                          {negativeDetails.map(([label, value]) => (
                            <div
                              key={`negative-${label}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted">
                                {label}
                              </span>

                              <span className="font-bold text-danger">
                                {Number(value) > 0 ? "-" : ""}
                                {Math.abs(Number(value))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Back to ranking */}
        <Link
          href="/ranking"
          className="mt-5 flex min-h-14 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-bold text-foreground transition-colors hover:bg-surface-2"
        >
          Retour au classement
        </Link>
      </div>
    </main>
  );
}