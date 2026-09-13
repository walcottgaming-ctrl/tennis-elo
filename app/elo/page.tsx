import { createClient } from "@/src/supabase/server";

export default async function EloPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-black">
            Historique ELO
          </h1>

          <p className="mt-4 text-gray-600">
            Tu dois être connecté.
          </p>
        </div>
      </main>
    );
  }

  const { data: history, error } = await supabase
    .from("elo_history")
    .select(
      "id, match_id, sport, old_elo, new_elo, elo_change, created_at"
    )
    .eq("player_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-black">
          Historique ELO
        </h1>

        <p className="mt-2 text-gray-600">
          L&apos;évolution de ton classement au fil de tes matchs.
        </p>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            Erreur : {error.message}
          </div>
        )}

        {!error && history?.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">
              Aucun historique ELO pour le moment.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {history?.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-black">
                    {entry.sport === "tennis"
                      ? "🎾 Tennis"
                      : "🟢 Padel"}
                  </p>

                  <p className="mt-2 text-gray-600">
                    {entry.old_elo} → {entry.new_elo}
                  </p>
                </div>

                <p
                  className={`text-xl font-bold ${
                    entry.elo_change > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {entry.elo_change > 0 ? "+" : ""}
                  {entry.elo_change}
                </p>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                {new Date(entry.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}