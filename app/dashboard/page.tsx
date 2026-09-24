"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/src/supabase/client";
import DashboardPoints from "@/app/components/DashboardPoints";
import SportIcon from "@/app/components/SportIcon";
import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import { useSportMode } from "@/app/context/SportModeContext";

type Match = {
  id: string;
  sport: "tennis" | "padel" | "super_tiebreak";
  format: "singles" | "doubles";
  created_at: string;
};

export default function DashboardPage() {
  const { mode } = useSportMode();

  const [matches, setMatches] = useState<Match[]>([]);

  const [tennisPoints, setTennisPoints] = useState(1000);
  const [padelPoints, setPadelPoints] = useState(1000);
  const [superTiebreakPoints, setSuperTiebreakPoints] = useState(1000);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Récupération des points du joueur
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "points_tennis, points_padel, points_super_tiebreak"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Erreur récupération des points :",
          profileError
        );
      } else {
        setTennisPoints(profile.points_tennis ?? 1000);
        setPadelPoints(profile.points_padel ?? 1000);
        setSuperTiebreakPoints(
          profile.points_super_tiebreak ?? 1000
        );
      }

      // Récupération des matchs du joueur
      const { data: playerMatches, error: playerMatchesError } =
        await supabase
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

      const playerMatchIds = (playerMatches ?? []).map(
        (row) => row.match_id
      );

      if (playerMatchIds.length === 0) {
        setMatches([]);
        return;
      }

      const { data, error } = await supabase
        .from("matches")
        .select("id, sport, format, created_at")
        .in("id", playerMatchIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Erreur Dashboard matches :", error);
        return;
      }

      setMatches((data ?? []) as Match[]);
    }

    void loadDashboard();
  }, []);

  const filteredMatches = matches
    .filter((match) => match.sport === mode)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const sportLabel =
    mode === "tennis"
      ? "Tennis"
      : mode === "padel"
        ? "Padel"
        : "Super Tie-Break";

  return (
    <main className="min-h-screen bg-background px-5 py-7 text-foreground">
      <div className="mx-auto max-w-lg pb-8">

        {/* HEADER */}
        <header className="flex items-center justify-between gap-3">
          <SportModeSwitcher />

          <Link
            href="/profile"
            aria-label="Mon profil"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition-all duration-200 hover:text-white active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path
                strokeLinecap="round"
                d="M5 20c.8-3.8 3.1-5.8 7-5.8s6.2 2 7 5.8"
              />
            </svg>
          </Link>
        </header>

        {/* POINTS */}
        <DashboardPoints
          tennisPoints={tennisPoints}
          padelPoints={padelPoints}
          superTiebreakPoints={superTiebreakPoints}
        />

        {/* NOUVEAU MATCH */}
        <Link
          href={
  mode === "super_tiebreak"
    ? "/supertiebreak/new"
    : "/matches/new"
}
          
          className="group mt-4 flex min-h-16 items-center justify-between rounded-2xl bg-accent px-5 text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
        >
          <div>
            <p className="font-bold">
              {mode === "super_tiebreak"
                ? "Nouveau Super Tie-Break"
                : "Nouveau match"}
            </p>

            <p className="mt-0.5 text-sm font-medium text-background/60">
              {mode === "super_tiebreak"
                ? "Lance un nouveau duel"
                : `Enregistre ton résultat ${sportLabel}`}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-xl">
            +
          </div>
        </Link>

        {/* EXPLORER */}
        <section className="mt-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Explorer
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {sportLabel}
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/ranking"
              className="group rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-white/10 hover:bg-surface-2 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 20V10M12 20V4M19 20v-7"
                  />
                </svg>
              </div>

              <p className="mt-5 font-bold">Classement</p>

              <p className="mt-1 text-sm text-muted">
                Ton classement {sportLabel}
              </p>
            </Link>

            <Link
              href="/players"
              className="group rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-white/10 hover:bg-surface-2 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <circle cx="9" cy="8" r="3" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.5 19c.7-3.2 2.5-5 5.5-5s4.8 1.8 5.5 5"
                  />
                  <path
                    strokeLinecap="round"
                    d="M16 11c2.5.2 4.2 1.7 4.7 4"
                  />
                </svg>
              </div>

              <p className="mt-5 font-bold">Joueurs</p>

              <p className="mt-1 text-sm text-muted">
                Découvre la communauté
              </p>
            </Link>
          </div>
        </section>

        {/* ACTIVITÉ */}
        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Activité
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Derniers matchs {sportLabel}
              </h2>
            </div>

            <Link
              href={
                mode === "super_tiebreak"
                  ? "/supertiebreak"
                  : "/matches"
              }
              className="text-sm font-semibold text-muted transition-colors hover:text-white"
            >
              Voir tout
            </Link>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <SportIcon
                  sport={mode}
                  className="h-5 w-5"
                />
              </div>

              <p className="mt-4 font-semibold">
                Aucun match {sportLabel} pour le moment
              </p>

              <p className="mt-1 text-sm text-muted">
                Enregistre ton premier résultat pour commencer ton suivi.
              </p>

              <Link
                href={
                  mode === "super_tiebreak"
                    ? "/supertiebreak/new"
                    : "/matches/new"
                }
                className="mt-5 inline-flex font-semibold text-accent"
              >
                Créer mon premier{" "}
                {mode === "super_tiebreak"
                  ? "Super Tie-Break"
                  : "match"}
                <span className="ml-1">→</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredMatches.map((match) => (
                <Link
                  key={match.id}
                  href={
                    match.sport === "super_tiebreak"
                      ? `/supertiebreak/${match.id}`
                      : `/matches/${match.id}`
                  }
                  className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-white/10 hover:bg-surface-2 active:scale-[0.99]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <SportIcon
                        sport={match.sport}
                        className="h-5 w-5"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold">
                        {sportLabel}
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        {mode === "super_tiebreak"
                          ? "Super Tie-Break"
                          : match.format === "singles"
                            ? "Simple"
                            : "Double"}
                      </p>
                    </div>
                  </div>

                  <span className="ml-4 text-lg text-muted-2 transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}