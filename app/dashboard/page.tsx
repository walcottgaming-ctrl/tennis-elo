import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type Match = {
  id: string;
  sport: "tennis" | "padel";
  format: "singles" | "doubles";
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground">
        <div className="mx-auto max-w-lg">
          <p className="text-sm font-semibold tracking-wide text-muted">
            SMASHBREAKPOINT
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Connexion requise
          </h1>

          <p className="mt-3 max-w-sm leading-6 text-muted">
            Connecte-toi pour accéder à ton classement, tes matchs et tes
            statistiques.
          </p>

          <Link
            href="/login"
            className="mt-7 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 font-bold text-background transition-transform duration-200 hover:brightness-95 active:scale-[0.98]"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, username, points_tennis, points_padel"
    )
    .eq("id", user.id)
    .single();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, sport, format, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const displayName =
    profile?.first_name ||
    profile?.username ||
    "Joueur";

  const tennisPoints = profile?.points_tennis ?? 0;
  const padelPoints = profile?.points_padel ?? 0;

  const bestPoints = Math.max(tennisPoints, padelPoints);

  return (
    <main className="min-h-screen bg-background px-5 py-7 text-foreground">
      <div className="mx-auto max-w-lg pb-8">

        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted">
              Bonjour
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {displayName}
            </h1>
          </div>

          <Link
            href="/profile"
            aria-label="Mon profil"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-muted transition-all duration-200 hover:text-white active:scale-95"
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
        <section className="relative mt-7 overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                  Ton niveau
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <p className="text-5xl font-bold tracking-tight">
                    {bestPoints.toLocaleString("fr-FR")}
                  </p>

                  <span className="mb-2 text-sm font-semibold text-accent">
                    pts
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted">
                  meilleur total
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-6 w-6"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <path
                    strokeLinecap="round"
                    d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c-2.5 1.5-3.5 4-3.5 5.5s1 4 3.5 5.5"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface-2 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />

                  <p className="text-sm font-medium text-muted">
                    Tennis
                  </p>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {tennisPoints.toLocaleString("fr-FR")}
                </p>

                <p className="mt-1 text-xs text-muted-2">
                  points
                </p>
              </div>

              <div className="rounded-2xl bg-surface-2 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/40" />

                  <p className="text-sm font-medium text-muted">
                    Padel
                  </p>
                </div>

                <p className="mt-3 text-2xl font-bold">
                  {padelPoints.toLocaleString("fr-FR")}
                </p>

                <p className="mt-1 text-xs text-muted-2">
                  points
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NOUVEAU MATCH */}
        <Link
          href="/matches/new"
          className="group mt-4 flex min-h-16 items-center justify-between rounded-2xl bg-accent px-5 text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
        >
          <div>
            <p className="font-bold">
              Nouveau match
            </p>

            <p className="mt-0.5 text-sm font-medium text-background/60">
              Enregistre ton résultat
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-xl transition-transform duration-200 group-hover:translate-x-0.5">
            +
          </div>
        </Link>

        {/* SUPER TIE-BREAK */}
        <Link
          href="/supertiebreak"
          className="group mt-4 flex items-center justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-white/10 hover:bg-surface-2 active:scale-[0.98]"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path
                  strokeLinecap="round"
                  d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c-2.5 1.5-3.5 4-3.5 5.5s-1 4-3.5 5.5"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="font-bold">
                Super Tie-Break
              </p>

              <p className="mt-1 text-sm text-muted">
                Ton classement indépendant
              </p>
            </div>
          </div>

          <span className="ml-4 text-lg text-muted-2 transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </Link>



        {/* RACCOURCIS */}
        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Explorer
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                La communauté
              </h2>
            </div>
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

              <p className="mt-5 font-bold">
                Classement
              </p>

              <p className="mt-1 text-sm text-muted">
                Compare ton niveau
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

              <p className="mt-5 font-bold">
                Joueurs
              </p>

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
                Derniers matchs
              </h2>
            </div>

            <Link
              href="/matches"
              className="text-sm font-semibold text-muted transition-colors hover:text-white"
            >
              Voir tout
            </Link>
          </div>

          {!matches || matches.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <path
                    strokeLinecap="round"
                    d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c-2.5 1.5-3.5 4-3.5 5.5s1 4 3.5 5.5"
                  />
                </svg>
              </div>

              <p className="mt-4 font-semibold">
                Aucun match pour le moment
              </p>

              <p className="mt-1 text-sm text-muted">
                Enregistre ton premier résultat pour commencer ton suivi.
              </p>

              <Link
                href="/matches/new"
                className="mt-5 inline-flex font-semibold text-accent"
              >
                Créer mon premier match
                <span className="ml-1">→</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {matches.map((match: Match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-white/10 hover:bg-surface-2 active:scale-[0.99]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        match.sport === "tennis"
                          ? "bg-accent/10 text-accent"
                          : "bg-white/5 text-white"
                      }`}
                    >
                      {match.sport === "tennis" ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-5 w-5"
                        >
                          <circle cx="12" cy="12" r="8.5" />
                          <path
                            strokeLinecap="round"
                            d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c-2.5 1.5-3.5 4-3.5 5.5s1 4 3.5 5.5"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">
                          P
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold">
                        {match.sport === "tennis"
                          ? "Tennis"
                          : "Padel"}
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        {match.format === "singles"
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