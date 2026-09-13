import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  points_tennis: number | null;
  points_padel: number | null;
};

type MatchPlayer = {
  player_id: string | null;
};

type Friendship = {
  requester_id: string;
  addressee_id: string;
};

export default async function PlayersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-black">
            Joueurs
          </h1>

          <p className="mt-4 text-gray-600">
            Tu dois être connecté pour voir les joueurs.
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

  const { data: players, error: playersError } =
    await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, username, points_tennis, points_padel"
      )
      .order("points_tennis", {
        ascending: false,
      });

  const { data: matchPlayers } = await supabase
    .from("match_players")
    .select("player_id");

  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .or(
      `requester_id.eq.${user.id},addressee_id.eq.${user.id}`
    )
    .eq("status", "accepted");

  const playerList: Player[] = players ?? [];
  const matchPlayerList: MatchPlayer[] =
    matchPlayers ?? [];
  const friendshipList: Friendship[] =
    friendships ?? [];

  const friendIds = friendshipList.map(
    (friendship) =>
      friendship.requester_id === user.id
        ? friendship.addressee_id
        : friendship.requester_id
  );

  const sortedPlayerList = [
    ...playerList.filter((player) =>
      friendIds.includes(player.id)
    ),
    ...playerList.filter(
      (player) => !friendIds.includes(player.id)
    ),
  ];

  function getPlayerName(player: Player) {
    const fullName = [
      player.first_name,
      player.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    if (player.username) {
      return `@${player.username}`;
    }

    return "Joueur";
  }

  function getInitials(player: Player) {
    const name = getPlayerName(player);

    if (name.startsWith("@")) {
      return name.substring(1, 2).toUpperCase();
    }

    const parts = name.split(" ");

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  function getMatchCount(playerId: string) {
    return matchPlayerList.filter(
      (item) => item.player_id === playerId
    ).length;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-lg pb-8">

        {/* HEADER */}

        <div>
          <p className="text-sm font-medium text-gray-500">
            👥 Communauté
          </p>

          <h1 className="mt-1 text-3xl font-bold text-black">
            Joueurs
          </h1>

          <p className="mt-2 text-gray-600">
            Retrouve tous les joueurs de ton application.
          </p>
        </div>

        {/* ERROR */}

        {playersError && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Impossible de charger les joueurs :{" "}
            {playersError.message}
          </div>
        )}

        {/* SUMMARY */}

        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Joueurs
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {playerList.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Matchs enregistrés
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {Math.floor(matchPlayerList.length / 2)}
            </p>
          </div>
        </section>

        {/* PLAYER LIST */}

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">
              Tous les joueurs
            </h2>

            <span className="text-sm font-medium text-gray-500">
              {playerList.length}
            </span>
          </div>

          {sortedPlayerList.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="text-4xl">
                👥
              </div>

              <h3 className="mt-4 font-bold text-black">
                Aucun joueur
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Aucun joueur n&apos;est encore enregistré.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sortedPlayerList.map((player, index) => {
                const matchCount =
                  getMatchCount(player.id);

                const isFriend =
                  friendIds.includes(player.id);

                return (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="block rounded-2xl bg-white p-5 shadow-sm transition active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">

                      {/* AVATAR */}

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                        {getInitials(player)}
                      </div>

                      {/* NAME */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-bold text-black">
                            {getPlayerName(player)}
                          </h3>

                          {isFriend && (
                            <span className="shrink-0 text-sm">
                              ⭐
                            </span>
                          )}

                          {index === 0 && (
                            <span className="shrink-0 text-sm">
                              🏆
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {matchCount}{" "}
                          {matchCount > 1
                            ? "matchs"
                            : "match"}
                        </p>
                      </div>

                      {/* ARROW */}

                      <span className="text-xl text-gray-300">
                        →
                      </span>
                    </div>

                    {/* POINTS */}

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">
                          🎾 Tennis
                        </p>

                        <p className="mt-1 text-xl font-bold text-black">
                          {player.points_tennis ??
                            1000}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          points
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">
                          🟢 Padel
                        </p>

                        <p className="mt-1 text-xl font-bold text-black">
                          {player.points_padel ??
                            1000}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          points
                        </p>
                      </div>

                    </div>
                  </Link>
                );
              })}
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
                Ton classement
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Les points Tennis et les points Padel
                évoluent séparément selon tes résultats
                dans chaque sport.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}