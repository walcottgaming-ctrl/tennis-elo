"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import SportIcon from "@/app/components/SportIcon";
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

type RankingPlayer = {
  id: string;
  points_tennis: number | null;
  points_padel: number | null;
  points_super_tiebreak: number | null;
};

type DashboardContentProps = {
  displayName: string;
  tennisPoints: number;
  padelPoints: number;
  superTiebreakPoints: number;
};

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

export default function DashboardContent({
  displayName,
  tennisPoints,
  padelPoints,
  superTiebreakPoints,
}: DashboardContentProps) {
  const { mode } = useSportMode();

  const [matches, setMatches] = useState<Match[]>([]);
  const [rankingPlayers, setRankingPlayers] =
    useState<RankingPlayer[]>([]);
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(
          "Utilisateur introuvable :",
          userError
        );
        return;
      }

      setCurrentUserId(user.id);

      const { data: matchesData, error: matchesError } =
        await supabase
          .from("matches")
          .select("id, sport, format, created_at")
          .order("created_at", {
            ascending: false,
          })
          .limit(20);

      if (matchesError) {
        console.error(
          "Erreur chargement matchs Dashboard :",
          matchesError
        );
      } else {
        setMatches(
          (matchesData ?? []) as Match[]
        );
      }

      /*
       * On récupère les points de tous les profils
       * afin de calculer le rang du joueur connecté.
       */
      const {
        data: rankingData,
        error: rankingError,
      } = await supabase
        .from("profiles")
        .select(
          "id, points_tennis, points_padel, points_super_tiebreak"
        );

      if (rankingError) {
        console.error(
          "Erreur chargement classement Dashboard :",
          rankingError
        );
        return;
      }

      setRankingPlayers(
        (rankingData ?? []) as RankingPlayer[]
      );
    }

    void loadDashboardData();
  }, []);

  const filteredMatches = matches
    .filter((match) => match.sport === mode)
    .slice(0, 5);

  const sportLabel =
    mode === "super_tiebreak"
      ? "Super Tie-Break"
      : mode === "tennis"
        ? "Tennis"
        : "Padel";

  const sportPoints =
    mode === "super_tiebreak"
      ? superTiebreakPoints
      : mode === "tennis"
        ? tennisPoints
        : padelPoints;

  /*
   * Classement dynamique selon le sport sélectionné.
   */
  const rankedPlayers = [...rankingPlayers].sort(
    (a, b) => {
      const pointsA =
        mode === "tennis"
          ? a.points_tennis ?? 0
          : mode === "padel"
            ? a.points_padel ?? 0
            : a.points_super_tiebreak ?? 0;

      const pointsB =
        mode === "tennis"
          ? b.points_tennis ?? 0
          : mode === "padel"
            ? b.points_padel ?? 0
            : b.points_super_tiebreak ?? 0;

      return pointsB - pointsA;
    }
  );

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

  const newMatchHref =
    mode === "super_tiebreak"
      ? "/supertiebreak/new"
      : "/matches/new";

  const sportPointsList = [
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
  ];

  return (
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow">
                Tableau de bord
              </p>

              <h1 className="mt-2 truncate font-display text-[30px] font-semibold tracking-[-0.035em] sm:text-4xl">
                Bonjour, {displayName}
              </h1>

              <p className="mt-2 text-sm text-muted">
                Ton espace {sportLabel.toLowerCase()}.
              </p>
            </div>

            <div className="shrink-0">
              <SportModeSwitcher />
            </div>
          </div>
        </header>

        <section className="glass-strong relative overflow-hidden rounded-[30px]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                    <SportIcon
                      sport={mode}
                      className="h-4 w-4"
                    />
                  </div>

                  <p className="eyebrow">
                    Classement actuel
                  </p>
                </div>

                <div className="mt-4 flex items-end gap-3">
                  <span className="font-display text-5xl font-semibold tracking-tighter text-accent sm:text-6xl">
                    {sportPoints.toLocaleString(
                      "fr-FR"
                    )}
                  </span>

                  <span className="mb-2.5 text-sm text-muted">
                    points
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                    #{currentRank ?? "—"}
                  </span>

                  <span className="text-sm text-muted">
                    sur {totalRankedPlayers || "—"} joueurs
                  </span>

                  <span className="h-1 w-1 rounded-full bg-muted-2" />

                  <span className="text-sm text-muted">
                    {sportLabel}
                  </span>
                </div>
              </div>

              <Link
                href={newMatchHref}
                className="group inline-flex min-h-12 items-center justify-between gap-4 rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_12px_34px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_16px_40px_var(--accent-glow)] active:scale-[0.985] lg:min-w-47.5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10">
                    <PlusIcon className="h-4 w-4" />
                  </span>

                  Nouveau match
                </span>

                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">
                Historique
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Activité récente
              </h2>
            </div>

            <Link
              href="/matches"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              <span>Voir tout</span>

              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="glass rounded-[26px] p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-accent">
                <SportIcon
                  sport={mode}
                  className="h-5 w-5"
                />
              </div>

              <p className="mt-4 font-semibold">
                Aucun match récent
              </p>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
                Aucun match récent n&apos;a été enregistré dans ce sport.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMatches.map((match) => {
                const matchSportLabel =
                  match.sport ===
                  "super_tiebreak"
                    ? "Super Tie-Break"
                    : match.sport === "tennis"
                      ? "Tennis"
                      : "Padel";

                return (
                  <div
                    key={match.id}
                    className="glass group rounded-3xl p-3.5 transition-all duration-200 hover:border-white/12 hover:bg-white/5 sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-accent transition-colors duration-200 group-hover:border-accent/20 group-hover:bg-accent/10">
                          <SportIcon
                            sport={match.sport}
                            className="h-5 w-5"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">
                              {matchSportLabel}
                            </p>
                          </div>

                          <p className="mt-0.5 text-sm text-muted">
                            {match.format ===
                            "singles"
                              ? "Simple"
                              : "Double"}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-xs font-medium text-muted">
                          {new Date(
                            match.created_at
                          ).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>

                        <ArrowRightIcon className="h-3.5 w-3.5 text-muted-2 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-3">
            <p className="eyebrow">
              Tes classements
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {sportPointsList.map((item) => {
              const isActive =
                item.sport === mode;

              return (
                <div
                  key={item.sport}
                  className={`relative overflow-hidden rounded-[22px] border p-4 transition-all duration-200 ${
                    isActive
                      ? "border-accent/20 bg-accent/5 shadow-[0_12px_35px_color-mix(in_srgb,var(--accent)_6%,transparent)]"
                      : "border-white/6 bg-white/2.5"
                  }`}
                >
                  {isActive && (
                    <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/10 blur-2xl" />
                  )}

                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-accent/10 text-accent"
                            : "bg-white/5 text-muted"
                        }`}
                      >
                        <SportIcon
                          sport={item.sport}
                          className="h-4 w-4"
                        />
                      </div>

                      <span className="truncate text-sm font-medium">
                        {item.label}
                      </span>
                    </div>

                    <span
                      className={`font-display text-lg font-semibold ${
                        isActive
                          ? "text-accent"
                          : "text-foreground"
                      }`}
                    >
                      {item.value.toLocaleString(
                        "fr-FR"
                      )}
                    </span>
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