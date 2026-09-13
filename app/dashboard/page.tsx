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
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-black">
            Tennis & Padel
          </h1>

          <p className="mt-3 text-gray-600">
            Tu dois être connecté pour accéder à ton espace.
          </p>

          <Link
            href="/login"
            className="mt-6 block rounded-xl bg-black px-5 py-4 text-center font-semibold text-white"
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
      "first_name, last_name, username, elo_tennis, elo_padel"
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

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-lg pb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Bienvenue
          </p>

          <h1 className="mt-1 text-3xl font-bold text-black">
            {displayName} 👋
          </h1>
        </div>

        <Link
          href="/matches/new"
          className="mt-7 flex min-h-16 items-center justify-center rounded-2xl bg-black px-5 text-lg font-bold text-white shadow-sm"
        >
          + Nouveau match
        </Link>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              🎾 Tennis
            </p>

            <p className="mt-2 text-4xl font-bold text-black">
              {profile?.elo_tennis ?? 1000}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              ELO
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              🟢 Padel
            </p>

            <p className="mt-2 text-4xl font-bold text-black">
              {profile?.elo_padel ?? 1000}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              ELO
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link
            href="/ranking"
            className="rounded-2xl bg-white p-5 shadow-sm active:scale-[0.98]"
          >
            <p className="text-2xl">🏆</p>

            <p className="mt-3 font-bold text-black">
              Classement
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Voir les joueurs
            </p>
          </Link>

          <Link
            href="/players"
            className="rounded-2xl bg-white p-5 shadow-sm active:scale-[0.98]"
          >
            <p className="text-2xl">👥</p>

            <p className="mt-3 font-bold text-black">
              Joueurs
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Voir les profils
            </p>
          </Link>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">
              Mes derniers matchs
            </h2>

            <Link
              href="/matches"
              className="text-sm font-semibold text-gray-600"
            >
              Voir tout
            </Link>
          </div>

          {!matches || matches.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-gray-600">
                Aucun match pour le moment.
              </p>

              <Link
                href="/matches/new"
                className="mt-4 inline-block font-semibold text-black"
              >
                Créer mon premier match →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {matches.map((match: Match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-black">
                        {match.sport === "tennis"
                          ? "🎾 Tennis"
                          : "🟢 Padel"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {match.format === "singles"
                          ? "Simple"
                          : "Double"}
                      </p>
                    </div>

                    <span className="text-gray-400">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}