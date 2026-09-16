"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SportModeSwitcher from "@/app/components/SportModeSwitcher";
import SportIcon from "@/app/components/SportIcon";
import DashboardPoints from "@/app/components/DashboardPoints";
import { useSportMode } from "@/app/context/SportModeContext";
import { createClient } from "@/src/supabase/client";

type Match = {
  id: string;
  sport: "tennis" | "padel" | "super_tiebreak";
  format: "singles" | "doubles";
  created_at: string;
};

type DashboardContentProps = {
  displayName: string;
  tennisPoints: number;
  padelPoints: number;
  superTiebreakPoints: number;
  matches?: Match[];
};

export default function DashboardContent({
  displayName,
  tennisPoints,
  padelPoints,
  superTiebreakPoints,
}: DashboardContentProps) {
  const { mode } = useSportMode();

  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function loadMatches() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Utilisateur introuvable :", userError);
        return;
      }

      const { data, error } = await supabase
        .from("matches")
        .select("id, sport, format, created_at")
    
        .order("created_at", { ascending: false })
        .limit(20);


      if (error) {
        console.error("Erreur chargement matchs Dashboard :", error);
        return;
      }

      setMatches((data ?? []) as Match[]);
    }

    loadMatches();
  }, []);

  const filteredMatches = matches
    .filter((match) => match.sport === mode)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Bienvenue</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {displayName}
            </h1>
          </div>

          <SportModeSwitcher />
        </div>

        <DashboardPoints
          tennisPoints={tennisPoints}
          padelPoints={padelPoints}
          superTiebreakPoints={superTiebreakPoints}
        />

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Activité récente
            </h2>

            <Link
              href="/matches"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-500">
                Aucun match récent dans ce sport.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <SportIcon sport={match.sport} />

                    <div>
                      <p className="font-semibold text-gray-900">
                        {match.sport === "super_tiebreak"
                          ? "Super Tie-Break"
                          : match.sport === "tennis"
                            ? "Tennis"
                            : "Padel"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {match.format === "singles"
                          ? "Simple"
                          : "Double"}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    {new Date(match.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}