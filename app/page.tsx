import Link from "next/link";

const features = [
  {
    href: "/dashboard",
    emoji: "🏠",
    title: "Tableau de bord",
    description: "Retrouve ton activité et tes derniers matchs.",
  },
  {
    href: "/matches/new",
    emoji: "🎾",
    title: "Nouveau match",
    description: "Enregistre un match de tennis ou de padel.",
  },
  {
    href: "/matches",
    emoji: "📋",
    title: "Mes matchs",
    description: "Consulte tous tes matchs enregistrés.",
  },
  {
    href: "/ranking",
    emoji: "🏆",
    title: "Classement",
    description: "Consulte le classement tennis et padel.",
  },
  {
    href: "/players",
    emoji: "👥",
    title: "Joueurs",
    description: "Retrouve les joueurs et leurs points.",
  },
  {
    href: "/stats",
    emoji: "📊",
    title: "Statistiques",
    description: "Analyse tes performances.",
  },
  {
    href: "/profile",
    emoji: "👤",
    title: "Mon profil",
    description: "Modifie ton profil et consulte tes informations.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🎾</div>

          <h1 className="text-3xl font-black text-gray-900">
            Tennis & Padel
          </h1>

          <p className="mt-2 text-gray-500">
            Ton application de suivi de matchs
          </p>
        </div>

        <div className="grid gap-4">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                {feature.emoji}
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-gray-900">
                  {feature.title}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>

              <div className="ml-auto text-xl text-gray-400">
                →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-center font-semibold text-gray-800"
          >
            Se connecter
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-black px-4 py-3 text-center font-semibold text-white"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}