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
      <main className="min-h-screen bg-[#121212] px-5 py-8 text-white">
        <div className="mx-auto max-w-lg">
          <p className="text-sm font-medium text-gray-500">
            SmashBreakPoint
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Connexion requise
          </h1>

          <p className="mt-3 text-gray-400">
            Tu dois être connecté pour accéder à ton espace.
          </p>

          <Link
            href="/login"
            className="mt-6 block rounded-2xl bg-white px-5 py-4 text-center font-bold text-black transition active:scale-[0.98]"
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

  return (
    <main className="min-h-screen bg-[#121212] px-5 py-7 text-white">
      <div className="mx-auto max-w-lg pb-8">

        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Bienvenue
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {displayName} 👋
            </h1>
          </div>

          <Link
            href="/players"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#242424] text-lg transition active:scale-95"
            aria-label="Mon profil"
          >
            👤
          </Link>
        </div>

        {/* POINTS PRINCIPAUX */}
        <div className="mt-7 rounded-[28px] bg-[#1d1d1d] p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-gray-500">
                Tes points
              </p>

              <p className="mt-3 text-5xl font-bold tracking-tight">
                {Math.max(tennisPoints, padelPoints).toLocaleString("fr-FR")}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                meilleur total
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#292929] text-xl">
              🎾
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#262626] p-4">
              <p className="text-sm text-gray-500">
                Tennis
              </p>

              <p className="mt-2 text-2xl font-bold">
                {tennisPoints.toLocaleString("fr-FR")}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                points
              </p>
            </div>

            <div className="rounded-2xl bg-[#262626] p-4">
              <p className="text-sm text-gray-500">
                Padel
              </p>

              <p className="mt-2 text-2xl font-bold">
                {padelPoints.toLocaleString("fr-FR")}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                points
              </p>
            </div>
          </div>
        </div>

        {/* NOUVEAU MATCH */}
        <Link
          href="/matches/new"
          className="mt-4 flex min-h-16 items-center justify-between rounded-2xl bg-white px-5 text-black transition active:scale-[0.98]"
        >
          <div>
            <p className="text-base font-bold">
              Nouveau match
            </p>

            <p className="mt-0.5 text-sm text-gray-500">
              Enregistre ton résultat
            </p>
          </div>

          <span className="text-2xl font-light">
            +
          </span>
        </Link>

        {/* RACCOURCIS */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/ranking"
            className="rounded-2xl bg-[#1d1d1d] p-5 transition active:scale-[0.98]"
          >
            <div className="text-2xl">
              🏆
            </div>

            <p className="mt-4 font-bold">
              Classement
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Voir les joueurs
            </p>
          </Link>

          <Link
            href="/players"
            className="rounded-2xl bg-[#1d1d1d] p-5 transition active:scale-[0.98]"
          >
            <div className="text-2xl">
              👥
            </div>

            <p className="mt-4 font-bold">
              Joueurs
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Découvrir la communauté
            </p>
          </Link>
        </div>

        {/* DERNIERS MATCHS */}
        <div className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-gray-500">
                Activité
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Derniers matchs
              </h2>
            </div>

            <Link
              href="/matches"
              className="text-sm font-semibold text-gray-400 transition hover:text-white"
            >
              Voir tout
            </Link>
          </div>

          {!matches || matches.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-[#1d1d1d] p-6">
              <p className="text-gray-400">
                Aucun match pour le moment.
              </p>

              <Link
                href="/matches/new"
                className="mt-4 inline-block font-semibold text-white"
              >
                Créer mon premier match →
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {matches.map((match: Match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center justify-between rounded-2xl bg-[#1d1d1d] p-5 transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#292929] text-lg">
                      {match.sport === "tennis"
                        ? "🎾"
                        : "🟢"}
                    </div>

                    <div>
                      <p className="font-bold">
                        {match.sport === "tennis"
                          ? "Tennis"
                          : "Padel"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {match.format === "singles"
                          ? "Simple"
                          : "Double"}
                      </p>
                    </div>
                  </div>

                  <span className="text-xl text-gray-500">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}