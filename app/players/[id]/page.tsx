import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  elo_tennis: number | null;
  elo_padel: number | null;
};

type Match = {
  id: string;
  sport: "tennis" | "padel";
  format: "singles" | "doubles";
  created_at: string;
};

type MatchPlayer = {
  match_id: string;
  player_id: string;
  team: number;
};

type SetScore = {
  match_id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
};

type MatchResult = {
  match: Match;
  opponentName: string;
  result: "Victoire" | "Défaite";
  scores: string[];
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlayerPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-black">
            Joueur
          </h1>

          <p className="mt-4 text-gray-600">
            Tu dois être connecté.
          </p>

          <Link
            href="/login"
            className="mt-6 block rounded-xl bg-black px-5 py-4 text-center font-bold text-white"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const { data: player, error: playerError } =
    await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, username, elo_tennis, elo_padel"
      )
      .eq("id", id)
      .single();

  if (playerError || !player) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <Link
            href="/players"
            className="text-sm font-medium text-gray-500"
          >
            ← Retour aux joueurs
          </Link>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-4xl">
              👤
            </div>

            <h1 className="mt-4 text-2xl font-bold text-black">
              Joueur introuvable
            </h1>

            <p className="mt-2 text-gray-500">
              Ce joueur n&apos;existe pas ou n&apos;est plus disponible.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: matchPlayersData } =
    await supabase
      .from("match_players")
      .select("match_id, player_id, team");

  const { data: matchesData } =
    await supabase
      .from("matches")
      .select(
        "id, sport, format, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

  const { data: setsData } =
    await supabase
      .from("sets")
      .select(
        "match_id, set_number, team_1_score, team_2_score"
      )
      .order("set_number", {
        ascending: true,
      });

  const { data: profilesData } =
    await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, username, elo_tennis, elo_padel"
      );

  const matchPlayers: MatchPlayer[] =
    matchPlayersData ?? [];

  const matches: Match[] =
    matchesData ?? [];

  const sets: SetScore[] =
    setsData ?? [];

  const players: Player[] =
    profilesData ?? [];

  function getPlayerName(
    playerData: Player
  ) {
    const fullName = [
      playerData.first_name,
      playerData.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    if (playerData.username) {
      return `@${playerData.username}`;
    }

    return "Joueur";
  }

  function getInitials(
    playerData: Player
  ) {
    const name = getPlayerName(playerData);

    if (name.startsWith("@")) {
      return name.substring(1, 2).toUpperCase();
    }

    const parts = name.split(" ");

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  const playerMatchLinks =
    matchPlayers.filter(
      (item) => item.player_id === id
    );

  const playerMatches: Match[] =
    playerMatchLinks
      .map((item) =>
        matches.find(
          (match) => match.id === item.match_id
        )
      )
      .filter(
        (match): match is Match =>
          Boolean(match)
      );

  let wins = 0;
  let losses = 0;
  let tennisMatches = 0;
  let padelMatches = 0;
  let singlesMatches = 0;
  let doublesMatches = 0;

  const history: MatchResult[] = [];

  for (const match of playerMatches) {
    const playerLink =
      playerMatchLinks.find(
        (item) =>
          item.match_id === match.id
      );

    if (!playerLink) {
      continue;
    }

    if (match.sport === "tennis") {
      tennisMatches++;
    } else {
      padelMatches++;
    }

    if (match.format === "singles") {
      singlesMatches++;
    } else {
      doublesMatches++;
    }

    const opponents =
      matchPlayers.filter(
        (item) =>
          item.match_id === match.id &&
          item.team !== playerLink.team
      );

    const opponentNames =
      opponents.map((opponent) => {
        const opponentProfile =
          players.find(
            (item) =>
              item.id === opponent.player_id
          );

        return opponentProfile
          ? getPlayerName(opponentProfile)
          : "Joueur";
      });

    const matchSets = sets.filter(
      (set) =>
        set.match_id === match.id
    );

    let playerSetWins = 0;
    let opponentSetWins = 0;

    const scores = matchSets.map(
      (set) => {
        const playerScore =
          playerLink.team === 1
            ? set.team_1_score
            : set.team_2_score;

        const opponentScore =
          playerLink.team === 1
            ? set.team_2_score
            : set.team_1_score;

        if (playerScore > opponentScore) {
          playerSetWins++;
        }

        if (opponentScore > playerScore) {
          opponentSetWins++;
        }

        return `${set.team_1_score}-${set.team_2_score}`;
      }
    );

    if (scores.length === 0) {
      continue;
    }

    const result =
      playerSetWins > opponentSetWins
        ? "Victoire"
        : "Défaite";

    if (result === "Victoire") {
      wins++;
    } else {
      losses++;
    }

    history.push({
      match,
      opponentName:
        opponentNames.join(" / ") ||
        "Joueur",
      result,
      scores,
    });
  }

  const totalMatches =
    wins + losses;

  const winRate =
    totalMatches > 0
      ? Math.round(
          (wins / totalMatches) * 100
        )
      : 0;

  const recentHistory =
    history.slice(0, 10);

  const name = getPlayerName(player);
  const initials = getInitials(player);

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-lg pb-8">

        {/* BACK */}

        <Link
          href="/players"
          className="text-sm font-medium text-gray-500"
        >
          ← Retour aux joueurs
        </Link>

        {/* PROFILE HEADER */}

        <section className="mt-5 rounded-2xl bg-white p-6 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-xl font-bold text-white">
            {initials}
          </div>

          <h1 className="mt-4 text-2xl font-bold text-black">
            {name}
          </h1>

          {player.username && (
            <p className="mt-1 text-sm text-gray-500">
              @{player.username}
            </p>
          )}

          <p className="mt-3 text-sm text-gray-500">
            {totalMatches}{" "}
            {totalMatches > 1
              ? "matchs joués"
              : "match joué"}
          </p>
        </section>

        {/* ELO */}

        <section className="mt-4 grid grid-cols-2 gap-3">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              🎾 Tennis
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {player.elo_tennis ??
                1000}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              ELO actuel
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              🟢 Padel
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {player.elo_padel ??
                1000}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              ELO actuel
            </p>
          </div>

        </section>

        {/* MAIN STATS */}

        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">

          <h2 className="text-xl font-bold text-black">
            📊 Statistiques
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Matchs
              </p>

              <p className="mt-1 text-2xl font-bold text-black">
                {totalMatches}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Taux de victoire
              </p>

              <p className="mt-1 text-2xl font-bold text-black">
                {winRate}%
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-xs text-green-700">
                Victoires
              </p>

              <p className="mt-1 text-2xl font-bold text-green-700">
                {wins}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs text-red-700">
                Défaites
              </p>

              <p className="mt-1 text-2xl font-bold text-red-700">
                {losses}
              </p>
            </div>

          </div>
        </section>

        {/* MATCH BREAKDOWN */}

        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">

          <h2 className="text-xl font-bold text-black">
            🎾 Répartition des matchs
          </h2>

          <div className="mt-5 space-y-3">

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="font-medium text-gray-700">
                🎾 Tennis
              </span>

              <span className="font-bold text-black">
                {tennisMatches}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="font-medium text-gray-700">
                🟢 Padel
              </span>

              <span className="font-bold text-black">
                {padelMatches}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="font-medium text-gray-700">
                Simple
              </span>

              <span className="font-bold text-black">
                {singlesMatches}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <span className="font-medium text-gray-700">
                Double
              </span>

              <span className="font-bold text-black">
                {doublesMatches}
              </span>
            </div>

          </div>
        </section>

        {/* RECENT MATCHES */}

        <section className="mt-4">

          <h2 className="text-xl font-bold text-black">
            📋 Dernières confrontations
          </h2>

          {recentHistory.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="text-4xl">
                🎾
              </div>

              <p className="mt-3 font-bold text-black">
                Aucun match enregistré
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Les résultats apparaîtront ici
                après les premiers matchs.
              </p>

            </div>
          ) : (
            <div className="mt-4 space-y-3">

              {recentHistory.map((item) => (
                <Link
                  key={item.match.id}
                  href={`/matches/${item.match.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-sm"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="text-sm font-bold text-black">
                          {item.match.sport ===
                          "tennis"
                            ? "🎾 Tennis"
                            : "🟢 Padel"}
                        </span>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          {item.match.format ===
                          "singles"
                            ? "Simple"
                            : "Double"}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        vs {item.opponentName}
                      </p>

                    </div>

                    <span
                      className={`shrink-0 text-sm font-bold ${
                        item.result ===
                        "Victoire"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.result}
                    </span>

                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {item.scores.map(
                      (score, index) => (
                        <span
                          key={`${item.match.id}-${index}`}
                          className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700"
                        >
                          Set {index + 1} :{" "}
                          {score}
                        </span>
                      )
                    )}

                  </div>

                  <p className="mt-3 text-xs text-gray-400">
                    {new Date(
                      item.match.created_at
                    ).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>

                </Link>
              ))}

            </div>
          )}

        </section>

        {/* INFO */}

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="text-2xl">
              💡
            </div>

            <div>
              <p className="font-bold text-black">
                À propos de l&apos;ELO
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                L&apos;ELO évolue après chaque résultat.
                Une victoire contre un joueur mieux
                classé rapporte davantage de points.
              </p>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}