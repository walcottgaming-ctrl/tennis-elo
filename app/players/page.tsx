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

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 6H3v1a4 4 0 0 0 4 4M17 6h4v1a4 4 0 0 1-4 4"
      />
    </svg>
  );
}

function TennisIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        d="M5.5 5.5c3.2 2.2 5 4.7 5 8.2s-1.8 6-5 8.2M18.5 5.5c-3.2 2.2-5 4.7-5 8.2s1.8 6 5 8.2"
      />
    </svg>
  );
}

function PadelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path
        strokeLinecap="round"
        strokeDasharray="1 3"
        d="M9 7v10M13 7v10M17 7v10"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14m-6-6 6 6-6 6"
      />
    </svg>
  );
}

export default async function PlayersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg pb-8">
          <div className="flex items-center gap-2 text-muted">
            <UsersIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Communauté
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Joueurs
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Tu dois être connecté pour voir les joueurs.
          </p>

          <Link
            href="/login"
            className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background transition active:scale-[0.99]"
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
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        <header>
          <div className="flex items-center gap-2 text-muted">
            <UsersIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Communauté
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Joueurs
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Retrouve tous les joueurs de ton application.
          </p>
        </header>

        {playersError && (
          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm leading-6 text-danger">
            Impossible de charger les joueurs :{" "}
            {playersError.message}
          </div>
        )}

        <section className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Joueurs
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight">
              {playerList.length}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Matchs enregistrés
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight">
              {Math.floor(matchPlayerList.length / 2)}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Classement
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Tous les joueurs
              </h2>
            </div>

            <span className="text-sm font-semibold text-muted">
              {playerList.length}
            </span>
          </div>

          {sortedPlayerList.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-border bg-surface p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                <UsersIcon />
              </div>

              <h3 className="mt-4 font-bold">
                Aucun joueur
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted">
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
                    href={`/ranking/player/${player.id}`}
                    className="group block rounded-3xl border border-border bg-surface p-5 transition active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-sm font-bold">
                        {getInitials(player)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-bold">
                            {getPlayerName(player)}
                          </h3>

                          {isFriend && (
                            <span className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                              Ami
                            </span>
                          )}

                          {index === 0 && (
                            <span className="flex shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 p-1.5 text-accent">
                              <TrophyIcon />
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-muted">
                          {matchCount}{" "}
                          {matchCount > 1
                            ? "matchs"
                            : "match"}
                        </p>
                      </div>

                      <span className="text-muted">
                        <ArrowIcon />
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-surface-2 p-4">
                        <div className="flex items-center gap-2 text-muted">
                          <TennisIcon />

                          <p className="text-xs font-bold uppercase tracking-widest">
                            Tennis
                          </p>
                        </div>

                        <p className="mt-2 text-2xl font-bold tracking-tight">
                          {player.points_tennis ?? 1000}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          points
                        </p>
                      </div>

                      <div className="rounded-2xl bg-surface-2 p-4">
                        <div className="flex items-center gap-2 text-muted">
                          <PadelIcon />

                          <p className="text-xs font-bold uppercase tracking-widest">
                            Padel
                          </p>
                        </div>

                        <p className="mt-2 text-2xl font-bold tracking-tight">
                          {player.points_padel ?? 1000}
                        </p>

                        <p className="mt-1 text-xs text-muted">
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

        <section className="mt-6 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
              <TrophyIcon />
            </div>

            <div>
              <p className="font-bold">
                Ton classement
              </p>

              <p className="mt-1 text-sm leading-6 text-muted">
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