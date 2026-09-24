import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type Sport = "tennis" | "padel" | "super_tiebreak";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

type MatchPlayer = {
  player_id: string | null;
};

type Match = {
  id: string;
  sport: Sport;
  created_at: string;
};

type RankingHistory = {
  id: string;
  match_id: string;
  player_id: string;
  sport: Sport;
  new_points: number | null;
  created_at: string;
};

type Friendship = {
  requester_id: string;
  addressee_id: string;
};

function UsersIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
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

function TrophyIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
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

function TennisIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
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

function PadelIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2.5"
      />
      <path
        strokeLinecap="round"
        strokeDasharray="1 3"
        d="M9 7v10M13 7v10M17 7v10"
      />
    </svg>
  );
}

function ArrowIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
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
      <main
        className="min-h-screen px-4 pb-32 pt-6 text-foreground sm:px-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto max-w-lg">
          <div className="glass-strong overflow-hidden rounded-[30px] p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accent/15 bg-accent/8 text-accent">
                <UsersIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="eyebrow">Communauté</p>

                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
                  Joueurs
                </h1>
              </div>
            </div>

            <div className="mt-8 border-t border-white/8 pt-6">
              <p className="text-sm leading-6 text-muted">
                Connecte-toi pour découvrir les joueurs
                de SmashBreakPoint et consulter leur
                profil.
              </p>

              <Link
                href="/login"
                className="mt-6 flex min-h-13 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const {
    data: players,
    error: playersError,
  } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, username"
    );

  const {
    data: matchPlayers,
    error: matchPlayersError,
  } = await supabase
    .from("match_players")
    .select("player_id");

  const {
    data: matches,
    error: matchesError,
  } = await supabase
    .from("matches")
    .select("id, sport, created_at")
    .order("created_at", {
      ascending: true,
    });

  const {
    data: rankingHistory,
    error: rankingHistoryError,
  } = await supabase
    .from("ranking_history")
    .select(
      "id, match_id, player_id, sport, new_points, created_at"
    )
    .order("created_at", {
      ascending: true,
    });

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

  const matchList: Match[] = matches ?? [];

  const rankingHistoryList: RankingHistory[] =
    rankingHistory ?? [];

  const friendshipList: Friendship[] =
    friendships ?? [];

  const errorMessage =
    playersError?.message ??
    matchPlayersError?.message ??
    matchesError?.message ??
    rankingHistoryError?.message ??
    "";

  /*
   * SOURCE DE VÉRITÉ DES POINTS
   *
   * Les points actuels viennent uniquement du dernier
   * ranking_history.new_points pour chaque joueur et
   * chaque sport.
   *
   * L'ordre réel des résultats est déterminé par :
   *
   * 1. matches.created_at
   * 2. matches.id en cas d'égalité
   *
   * On ne lit jamais :
   * - profiles.points_tennis
   * - profiles.points_padel
   * - profiles.points_super_tiebreak
   */

  const pointsByPlayerAndSport = new Map<
    string,
    Map<Sport, RankingHistory>
  >();

  const matchById = new Map(
    matchList.map((match) => [
      match.id,
      match,
    ])
  );

  for (const history of rankingHistoryList) {
    if (history.new_points === null) {
      continue;
    }

    let playerMap =
      pointsByPlayerAndSport.get(
        history.player_id
      );

    if (!playerMap) {
      playerMap = new Map<
        Sport,
        RankingHistory
      >();

      pointsByPlayerAndSport.set(
        history.player_id,
        playerMap
      );
    }

    const previous = playerMap.get(
      history.sport
    );

    const currentMatch =
      matchById.get(history.match_id);

    const previousMatch = previous
      ? matchById.get(previous.match_id)
      : null;

    if (!currentMatch) {
      continue;
    }

    if (!previous || !previousMatch) {
      playerMap.set(
        history.sport,
        history
      );

      continue;
    }

    const currentMatchTime =
      new Date(
        currentMatch.created_at
      ).getTime();

    const previousMatchTime =
      new Date(
        previousMatch.created_at
      ).getTime();

    if (
      currentMatchTime >
        previousMatchTime ||
      (
        currentMatchTime ===
          previousMatchTime &&
        currentMatch.id >
          previousMatch.id
      )
    ) {
      playerMap.set(
        history.sport,
        history
      );
    }
  }

  function getPlayerPoints(
    playerId: string,
    sport: Sport
  ): number {
    return (
      pointsByPlayerAndSport
        .get(playerId)
        ?.get(sport)
        ?.new_points ?? 1000
    );
  }

  const friendIds = friendshipList.map(
    (friendship) =>
      friendship.requester_id === user.id
        ? friendship.addressee_id
        : friendship.requester_id
  );

  /*
   * Cette page n'est plus un classement.
   *
   * On affiche simplement les amis en premier,
   * puis les autres joueurs.
   *
   * Les points Tennis et Padel sont affichés
   * séparément sur chaque profil.
   */

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
      return name
        .substring(1, 2)
        .toUpperCase();
    }

    const parts = name.split(" ");

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name
      .substring(0, 2)
      .toUpperCase();
  }

  function getMatchCount(playerId: string) {
    return matchPlayerList.filter(
      (item) => item.player_id === playerId
    ).length;
  }

  return (
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-lg">
        <header>
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="eyebrow">
                Communauté
              </p>

              <h1 className="mt-2 font-display text-[34px] font-bold leading-none tracking-[-0.035em]">
                Joueurs
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                Découvre les joueurs de SmashBreakPoint
                et consulte leurs performances.
              </p>
            </div>

            <div className="relative mt-1 shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl" />

              <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-accent/15 bg-[#15171f]/90 text-accent backdrop-blur-xl">
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="glass mt-6 rounded-2xl border-danger/25 bg-danger/8 p-4 text-sm leading-6 text-danger">
            Impossible de charger les joueurs :{" "}
            {errorMessage}
          </div>
        )}

        <section className="mt-8 grid grid-cols-2 gap-3">
          <div className="glass-strong rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">
                Joueurs
              </p>

              <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
                <UsersIcon className="h-3.5 w-3.5" />
              </div>
            </div>

            <p className="mt-5 font-display text-3xl font-bold tracking-tight">
              {playerList.length}
            </p>

            <p className="mt-1 text-xs text-muted">
              profils enregistrés
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">
                Matchs
              </p>

              <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
                <TrophyIcon className="h-3.5 w-3.5" />
              </div>
            </div>

            <p className="mt-5 font-display text-3xl font-bold tracking-tight">
              {Math.floor(
                matchPlayerList.length / 2
              )}
            </p>

            <p className="mt-1 text-xs text-muted">
              matchs enregistrés
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">
                Communauté
              </p>

              <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">
                Tous les joueurs
              </h2>
            </div>

            <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-muted">
              {playerList.length} profils
            </div>
          </div>

          {sortedPlayerList.length === 0 ? (
            <div className="glass-strong mt-4 rounded-[28px] p-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/8 bg-white/5 text-muted">
                <UsersIcon className="h-5 w-5" />
              </div>

              <h3 className="mt-5 font-display font-bold">
                Aucun joueur
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
                Aucun joueur n&apos;est encore enregistré.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sortedPlayerList.map(
                (player) => {
                  const matchCount =
                    getMatchCount(player.id);

                  const isFriend =
                    friendIds.includes(
                      player.id
                    );

                  const tennisPoints =
                    getPlayerPoints(
                      player.id,
                      "tennis"
                    );

                  const padelPoints =
                    getPlayerPoints(
                      player.id,
                      "padel"
                    );

                  return (
                    <Link
                      key={player.id}
                      href={`/ranking/player/${player.id}`}
                      className="glass group relative block overflow-hidden rounded-[28px] border p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/6 active:scale-[0.995]"
                    >
                      <div className="relative flex items-center gap-3.5">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/8 bg-white/5 text-sm font-bold text-muted">
                          {getInitials(
                            player
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate font-display font-bold">
                              {getPlayerName(
                                player
                              )}
                            </h3>

                            {isFriend && (
                              <span className="shrink-0 rounded-full border border-accent/20 bg-accent/8 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
                                Ami
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5 text-xs text-muted">
                            {matchCount}{" "}
                            {matchCount > 1
                              ? "matchs"
                              : "match"}
                          </div>
                        </div>

                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-all duration-200 group-hover:bg-white/5 group-hover:text-foreground">
                          <ArrowIcon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
                        <div className="rounded-2xl border border-white/5 bg-white/2.5 p-3.5">
                          <div className="flex items-center gap-2 text-muted">
                            <TennisIcon className="h-4 w-4" />

                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                              Tennis
                            </p>
                          </div>

                          <p className="mt-3 font-display text-[25px] font-bold leading-none tracking-tight">
                            {tennisPoints}
                          </p>

                          <p className="mt-1.5 text-[11px] text-muted">
                            points
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-white/2.5 p-3.5">
                          <div className="flex items-center gap-2 text-muted">
                            <PadelIcon className="h-4 w-4" />

                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                              Padel
                            </p>
                          </div>

                          <p className="mt-3 font-display text-[25px] font-bold leading-none tracking-tight">
                            {padelPoints}
                          </p>

                          <p className="mt-1.5 text-[11px] text-muted">
                            points
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="glass-strong relative mt-6 overflow-hidden rounded-[28px] p-5">
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-accent/6 blur-3xl" />

          <div className="relative flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/15 bg-accent/8 text-accent">
              <TrophyIcon />
            </div>

            <div className="min-w-0">
              <p className="font-display font-bold">
                Tes points
              </p>

              <p className="mt-1.5 text-sm leading-6 text-muted">
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