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

type HeadToHeadStats = {
  opponentId: string;
  opponentName: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
};

type DoublePartnerStats = {
  partnerId: string;
  partnerName: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  maxWinStreak: number;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5m6 6-6-6 6-6"
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
      className="h-5 w-5"
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

function ChartIcon() {
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
        d="M4 19V5M4 19h16"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m7 15 3-4 3 2 5-6"
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

function MatchIcon() {
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
        d="M7 3v18M17 3v18M3 7h18M3 17h18"
      />
    </svg>
  );
}

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
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg pb-8">
          <div className="flex items-center gap-2 text-muted">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
              <TrophyIcon />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Profil joueur
            </p>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Joueur
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Tu dois être connecté pour accéder à ce profil.
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

  const { data: player, error: playerError } =
    await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, username, points_tennis, points_padel"
      )
      .eq("id", id)
      .single();

  if (playerError || !player) {
    return (
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg pb-8">
          <Link
            href="/players"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted"
          >
            <ArrowLeftIcon />
            Retour aux joueurs
          </Link>

          <div className="mt-6 rounded-3xl border border-border bg-surface p-7">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
              <TrophyIcon />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              Joueur introuvable
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              Ce joueur n&apos;existe pas ou n&apos;est plus disponible.
            </p>

            <Link
              href="/players"
              className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background"
            >
              Retour aux joueurs
            </Link>
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
      .select("id, sport, format, created_at")
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
        "id, first_name, last_name, username, points_tennis, points_padel"
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

  const headToHeadMap = new Map<
    string,
    {
      wins: number;
      losses: number;
    }
  >();

  for (const item of history) {
    if (item.match.format !== "singles") {
      continue;
    }

    if (
      item.match.sport !== "tennis" &&
      item.match.sport !== "padel"
    ) {
      continue;
    }

    const playerLink =
      matchPlayers.find(
        (matchPlayer) =>
          matchPlayer.match_id === item.match.id &&
          matchPlayer.player_id === id
      );

    if (!playerLink) {
      continue;
    }

    const opponent =
      matchPlayers.find(
        (matchPlayer) =>
          matchPlayer.match_id === item.match.id &&
          matchPlayer.player_id !== id &&
          matchPlayer.team !== playerLink.team
      );

    if (!opponent) {
      continue;
    }

    const current =
      headToHeadMap.get(opponent.player_id) ?? {
        wins: 0,
        losses: 0,
      };

    if (item.result === "Victoire") {
      current.wins++;
    } else {
      current.losses++;
    }

    headToHeadMap.set(
      opponent.player_id,
      current
    );
  }

  const headToHeadStats: HeadToHeadStats[] =
    Array.from(headToHeadMap.entries())
      .map(
        ([opponentId, result]) => {
          const opponent =
            players.find(
              (playerData) =>
                playerData.id === opponentId
            );

          if (!opponent) {
            return null;
          }

          const matches =
            result.wins + result.losses;

          return {
            opponentId,
            opponentName:
              getPlayerName(opponent),
            matches,
            wins: result.wins,
            losses: result.losses,
            winRate:
              matches > 0
                ? Math.round(
                    (result.wins / matches) * 100
                  )
                : 0,
          };
        }
      )
      .filter(
        (
          item
        ): item is HeadToHeadStats =>
          item !== null
      )
      .filter(
        (item) => item.matches >= 2
      )
      .sort((a, b) => {
        if (b.matches !== a.matches) {
          return b.matches - a.matches;
        }

        return b.winRate - a.winRate;
      });

  const topHeadToHeadStats =
    headToHeadStats.slice(0, 5);

  /*
   * Partenaires de double :
   * - Tennis + Padel
   * - Double uniquement
   * - minimum 2 matchs ensemble
   * - partenaire = joueur présent dans la même équipe
   * - trié par nombre de matchs ensemble
   * - calcul de la série maximale de victoires ensemble
   */
  const doublePartnerMap = new Map<
    string,
    {
      matches: Array<{
        createdAt: string;
        won: boolean;
      }>;
    }
  >();

  for (const match of playerMatches) {
    if (match.format !== "doubles") {
      continue;
    }

    if (
      match.sport !== "tennis" &&
      match.sport !== "padel"
    ) {
      continue;
    }

    const playerLink =
      matchPlayers.find(
        (matchPlayer) =>
          matchPlayer.match_id === match.id &&
          matchPlayer.player_id === id
      );

    if (!playerLink) {
      continue;
    }

    const partnerLink =
      matchPlayers.find(
        (matchPlayer) =>
          matchPlayer.match_id === match.id &&
          matchPlayer.team === playerLink.team &&
          matchPlayer.player_id !== id
      );

    if (!partnerLink) {
      continue;
    }

    const matchSets = sets.filter(
      (set) =>
        set.match_id === match.id
    );

    if (matchSets.length === 0) {
      continue;
    }

    let ownTeamSetWins = 0;
    let opponentTeamSetWins = 0;

    for (const set of matchSets) {
      const ownTeamScore =
        playerLink.team === 1
          ? set.team_1_score
          : set.team_2_score;

      const opponentTeamScore =
        playerLink.team === 1
          ? set.team_2_score
          : set.team_1_score;

      if (ownTeamScore > opponentTeamScore) {
        ownTeamSetWins++;
      }

      if (opponentTeamScore > ownTeamScore) {
        opponentTeamSetWins++;
      }
    }

    if (
      ownTeamSetWins === opponentTeamSetWins
    ) {
      continue;
    }

    const current =
      doublePartnerMap.get(
        partnerLink.player_id
      ) ?? {
        matches: [],
      };

    current.matches.push({
      createdAt: match.created_at,
      won:
        ownTeamSetWins >
        opponentTeamSetWins,
    });

    doublePartnerMap.set(
      partnerLink.player_id,
      current
    );
  }

  const doublePartnerStats: DoublePartnerStats[] =
    Array.from(doublePartnerMap.entries())
      .map(
        ([partnerId, result]) => {
          const partner =
            players.find(
              (playerData) =>
                playerData.id === partnerId
            );

          if (!partner) {
            return null;
          }

          const orderedMatches =
            [...result.matches].sort(
              (a, b) =>
                new Date(
                  a.createdAt
                ).getTime() -
                new Date(
                  b.createdAt
                ).getTime()
            );

          let wins = 0;
          let losses = 0;
          let currentWinStreak = 0;
          let maxWinStreak = 0;

          for (const matchResult of orderedMatches) {
            if (matchResult.won) {
              wins++;
              currentWinStreak++;

              if (
                currentWinStreak >
                maxWinStreak
              ) {
                maxWinStreak =
                  currentWinStreak;
              }
            } else {
              losses++;
              currentWinStreak = 0;
            }
          }

          const matches =
            wins + losses;

          return {
            partnerId,
            partnerName:
              getPlayerName(partner),
            matches,
            wins,
            losses,
            winRate:
              matches > 0
                ? Math.round(
                    (wins / matches) * 100
                  )
                : 0,
            maxWinStreak,
          };
        }
      )
      .filter(
        (
          item
        ): item is DoublePartnerStats =>
          item !== null
      )
      .filter(
        (item) => item.matches >= 2
      )
      .sort((a, b) => {
        if (b.matches !== a.matches) {
          return b.matches - a.matches;
        }

        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate;
        }

        return a.partnerName.localeCompare(
          b.partnerName
        );
      });

  const topDoublePartnerStats =
    doublePartnerStats.slice(0, 5);

  const recentHistory =
    history.slice(0, 10);

  const name = getPlayerName(player);
  const initials = getInitials(player);

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted"
        >
          <ArrowLeftIcon />
          Retour aux joueurs
        </Link>

        <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-lg font-bold">
              {initials}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {name}
              </h1>

              {player.username && (
                <p className="mt-1 text-sm text-muted">
                  @{player.username}
                </p>
              )}

              <p className="mt-2 text-sm text-muted">
                {totalMatches}{" "}
                {totalMatches > 1
                  ? "matchs joués"
                  : "match joué"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-muted">
              <TennisIcon />

              <p className="text-xs font-bold uppercase tracking-[0.14em]">
                Tennis
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold tracking-tight">
              {player.points_tennis ?? 1000}
            </p>

            <p className="mt-1 text-xs text-muted">
              points
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-muted">
              <PadelIcon />

              <p className="text-xs font-bold uppercase tracking-[0.14em]">
                Padel
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold tracking-tight">
              {player.points_padel ?? 1000}
            </p>

            <p className="mt-1 text-xs text-muted">
              points
            </p>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2 text-muted">
            <ChartIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Performances
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Statistiques
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Matchs
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {totalMatches}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Victoire
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {winRate}%
              </p>
            </div>

            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Victoires
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {wins}
              </p>
            </div>

            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-danger">
                Défaites
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {losses}
              </p>
            </div>
          </div>
        </section>

        {topHeadToHeadStats.length > 0 && (
          <section className="mt-7">
            <div className="flex items-center gap-2 text-muted">
              <TrophyIcon />

              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Confrontations
              </p>
            </div>

            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Head-to-head
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted">
              Tes adversaires les plus affrontés en simple.
            </p>

            <div className="mt-4 space-y-3">
              {topHeadToHeadStats.map((item) => (
                <Link
                  key={item.opponentId}
                  href={`/players/${item.opponentId}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-white/15 hover:bg-surface-2 active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {item.opponentName}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {item.matches}{" "}
                      {item.matches > 1
                        ? "confrontations"
                        : "confrontation"}
                    </p>
                  </div>

                  <div className="ml-4 shrink-0 text-right">
                    <p className="text-sm font-semibold">
                      {item.wins} V · {item.losses} D
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {item.winRate}% de victoire
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {topDoublePartnerStats.length > 0 && (
          <section className="mt-7">
            <div className="flex items-center gap-2 text-muted">
              <TrophyIcon />

              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Double
              </p>
            </div>

            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Partenaires
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted">
              Tes partenaires de double les plus utilisés.
            </p>

            <div className="mt-4 space-y-3">
              {topDoublePartnerStats.map((item) => (
                <Link
                  key={item.partnerId}
                  href={`/players/${item.partnerId}`}
                  className="block rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-white/15 hover:bg-surface-2 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {item.partnerName}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {item.matches}{" "}
                        {item.matches > 1
                          ? "matchs ensemble"
                          : "match ensemble"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">
                        {item.wins} V · {item.losses} D
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {item.winRate}% de victoire
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
                    <span className="text-xs font-semibold text-muted">
                      Meilleure série
                    </span>

                    <span className="text-xs font-bold">
                      {item.maxWinStreak}{" "}
                      {item.maxWinStreak > 1
                        ? "victoires"
                        : "victoire"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
              <MatchIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Répartition
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight">
                Les matchs joués
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-surface-2 p-4">
              <div className="flex items-center gap-3">
                <TennisIcon />

                <span className="text-sm font-semibold">
                  Tennis
                </span>
              </div>

              <span className="font-bold">
                {tennisMatches}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-surface-2 p-4">
              <div className="flex items-center gap-3">
                <PadelIcon />

                <span className="text-sm font-semibold">
                  Padel
                </span>
              </div>

              <span className="font-bold">
                {padelMatches}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-surface-2 p-4">
              <span className="text-sm font-semibold">
                Simple
              </span>

              <span className="font-bold">
                {singlesMatches}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-surface-2 p-4">
              <span className="text-sm font-semibold">
                Double
              </span>

              <span className="font-bold">
                {doublesMatches}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-center gap-2 text-muted">
            <TrophyIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Historique
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Dernières confrontations
          </h2>

          {recentHistory.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-border bg-surface p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                <TennisIcon />
              </div>

              <p className="mt-4 font-bold">
                Aucun match enregistré
              </p>

              <p className="mt-2 text-sm leading-6 text-muted">
                Les résultats apparaîtront ici après les
                premiers matchs.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentHistory.map((item) => (
                <Link
                  key={item.match.id}
                  href={`/matches/${item.match.id}`}
                  className="block rounded-3xl border border-border bg-surface p-5 transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          {item.match.sport ===
                          "tennis" ? (
                            <TennisIcon />
                          ) : (
                            <PadelIcon />
                          )}

                          <span>
                            {item.match.sport ===
                            "tennis"
                              ? "Tennis"
                              : "Padel"}
                          </span>
                        </div>

                        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                          {item.match.format ===
                          "singles"
                            ? "Simple"
                            : "Double"}
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm text-muted">
                        vs {item.opponentName}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-bold uppercase tracking-wider ${
                        item.result ===
                        "Victoire"
                          ? "text-accent"
                          : "text-danger"
                      }`}
                    >
                      {item.result}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.scores.map(
                      (score, index) => (
                        <span
                          key={`${item.match.id}-${index}`}
                          className="rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold text-muted"
                        >
                          Set {index + 1} : {score}
                        </span>
                      )
                    )}
                  </div>

                  <p className="mt-3 text-xs text-muted">
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

        <Link
          href="/ranking/history"
          className="mt-6 flex min-h-14 items-center justify-center rounded-2xl border border-border bg-surface px-5 text-sm font-bold text-foreground transition active:scale-[0.99]"
        >
          Voir l&apos;historique des points
        </Link>
      </div>
    </main>
  );
}