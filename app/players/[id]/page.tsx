import Link from "next/link";
import { createClient } from "@/src/supabase/server";
import SportIcon from "@/app/components/SportIcon";

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

function ArrowLeftIcon({
  className = "h-4 w-4",
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
        d="M19 12H5m6 6-6-6 6-6"
      />
    </svg>
  );
}

function TrophyIcon({
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

function ChartIcon({
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

function MatchIcon({
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
      <main
        className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto max-w-lg">
          <div className="glass-strong overflow-hidden rounded-[30px] p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl" />

                <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-accent/15 bg-accent/8 text-accent">
                  <TrophyIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="min-w-0">
                <p className="eyebrow">Profil joueur</p>

                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
                  Joueur
                </h1>
              </div>
            </div>

            <div className="mt-8 border-t border-white/8 pt-6">
              <p className="text-sm leading-6 text-muted">
                Connecte-toi pour accéder à ce profil et
                consulter ses statistiques.
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
      <main
        className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto max-w-lg">
          <Link
            href="/players"
            aria-label="Retour aux joueurs"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon />
          </Link>

          <div className="glass-strong mt-5 rounded-[28px] p-7">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/8 bg-white/5 text-muted">
              <TrophyIcon />
            </div>

            <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
              Joueur introuvable
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              Ce joueur n&apos;existe pas ou n&apos;est plus
              disponible.
            </p>

            <Link
              href="/players"
              className="mt-6 flex min-h-13 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
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
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-lg">
        <Link
          href="/players"
          aria-label="Retour aux joueurs"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
        >
          <ArrowLeftIcon />
        </Link>

        <section className="glass-strong relative mt-5 overflow-hidden rounded-[30px] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-accent/8 blur-3xl" />

          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-[22px] bg-accent/15 blur-xl" />

                <div className="relative grid h-17 w-17 place-items-center rounded-[22px] border border-accent/25 bg-accent/10 font-display text-xl font-bold text-accent">
                  {initials}
                </div>
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Profil joueur</p>

                  <span className="shrink-0 rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Joueur
                  </span>
                </div>

                <h1 className="mt-2 truncate font-display text-[27px] font-bold leading-tight tracking-tight">
                  {name}
                </h1>

                {player.username && (
                  <p className="mt-1 text-sm text-muted">
                    @{player.username}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/6 bg-black/10 px-3 py-3">
                <p className="eyebrow">Matchs</p>
                <p className="mt-1.5 font-display text-xl font-bold">
                  {totalMatches}
                </p>
              </div>

              <div className="rounded-2xl border border-accent/10 bg-accent/5 px-3 py-3">
                <p className="eyebrow text-accent">
                  Victoires
                </p>
                <p className="mt-1.5 font-display text-xl font-bold">
                  {wins}
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-black/10 px-3 py-3">
                <p className="eyebrow">Win rate</p>
                <p className="mt-1.5 font-display text-xl font-bold">
                  {winRate}%
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3">
          <div className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted">
                <SportIcon
                  sport="tennis"
                  className="h-4 w-4"
                />

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                  Tennis
                </p>
              </div>

              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
            </div>

            <p className="mt-4 font-display text-[28px] font-bold leading-none tracking-tight">
              {player.points_tennis ?? 1000}
            </p>

            <p className="mt-1.5 text-[11px] text-muted">
              points
            </p>
          </div>

          <div className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted">
                <SportIcon
                  sport="padel"
                  className="h-4 w-4"
                />

                <p className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                  Padel
                </p>
              </div>

              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            </div>

            <p className="mt-4 font-display text-[28px] font-bold leading-none tracking-tight">
              {player.points_padel ?? 1000}
            </p>

            <p className="mt-1.5 text-[11px] text-muted">
              points
            </p>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
              <ChartIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="eyebrow">Performances</p>

              <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                Statistiques
              </h2>
            </div>
          </div>

          <div className="glass-strong mt-4 overflow-hidden rounded-[26px]">
            <div className="grid grid-cols-2 divide-x divide-white/6 border-b border-white/6">
              <div className="p-5">
                <p className="eyebrow">Total</p>

                <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                  {totalMatches}
                </p>

                <p className="mt-1 text-xs text-muted">
                  matchs joués
                </p>
              </div>

              <div className="p-5">
                <p className="eyebrow">Réussite</p>

                <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                  {winRate}%
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${winRate}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/6">
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />

                  <p className="text-xs font-semibold text-muted">
                    Victoires
                  </p>
                </div>

                <p className="mt-2 font-display text-2xl font-bold">
                  {wins}
                </p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-danger" />

                  <p className="text-xs font-semibold text-muted">
                    Défaites
                  </p>
                </div>

                <p className="mt-2 font-display text-2xl font-bold">
                  {losses}
                </p>
              </div>
            </div>
          </div>
        </section>

        {topHeadToHeadStats.length > 0 && (
          <section className="mt-9">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
                  <TrophyIcon className="h-4 w-4" />
                </div>

                <div>
                  <p className="eyebrow">
                    Confrontations
                  </p>

                  <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                    Head-to-head
                  </h2>
                </div>
              </div>

              <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted">
                {topHeadToHeadStats.length}
              </span>
            </div>

            <p className="mt-2 text-sm leading-5 text-muted">
              Tes adversaires les plus affrontés en simple.
            </p>

            <div className="mt-4 space-y-2.5">
              {topHeadToHeadStats.map((item) => (
                <Link
                  key={item.opponentId}
                  href={`/players/${item.opponentId}`}
                  className="glass group block rounded-3xl p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.995]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/8 bg-white/5 font-display text-xs font-bold text-muted">
                      {item.opponentName
                        .replace("@", "")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-bold">
                        {item.opponentName}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {item.matches}{" "}
                        {item.matches > 1
                          ? "confrontations"
                          : "confrontation"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-bold">
                        {item.winRate}%
                      </p>

                      <p className="mt-0.5 text-[10px] text-muted">
                        {item.wins} V · {item.losses} D
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {topDoublePartnerStats.length > 0 && (
          <section className="mt-9">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
                <TrophyIcon className="h-4 w-4" />
              </div>

              <div>
                <p className="eyebrow">Double</p>

                <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                  Partenaires
                </h2>
              </div>
            </div>

            <p className="mt-2 text-sm leading-5 text-muted">
              Tes partenaires de double les plus utilisés.
            </p>

            <div className="mt-4 space-y-2.5">
              {topDoublePartnerStats.map((item) => (
                <Link
                  key={item.partnerId}
                  href={`/players/${item.partnerId}`}
                  className="glass group block rounded-3xl p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.995]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/8 bg-white/5 font-display text-xs font-bold text-muted">
                      {item.partnerName
                        .replace("@", "")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-bold">
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
                      <p className="font-display text-lg font-bold">
                        {item.winRate}%
                      </p>

                      <p className="mt-0.5 text-[10px] text-muted">
                        {item.wins} V · {item.losses} D
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/2.5 px-3 py-2.5">
                    <span className="text-xs font-semibold text-muted">
                      Meilleure série
                    </span>

                    <span className="font-display text-xs font-bold">
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

        <section className="mt-9">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
              <MatchIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="eyebrow">Répartition</p>

              <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                Les matchs joués
              </h2>
            </div>
          </div>

          <div className="glass-strong mt-4 overflow-hidden rounded-[26px]">
            <div className="grid grid-cols-2 divide-x divide-white/6 border-b border-white/6">
              <div className="p-4">
                <div className="flex items-center gap-2 text-muted">
                  <SportIcon
                    sport="tennis"
                    className="h-4 w-4"
                  />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                    Tennis
                  </span>
                </div>

                <p className="mt-2 font-display text-2xl font-bold">
                  {tennisMatches}
                </p>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-muted">
                  <SportIcon
                    sport="padel"
                    className="h-4 w-4"
                  />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                    Padel
                  </span>
                </div>

                <p className="mt-2 font-display text-2xl font-bold">
                  {padelMatches}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/6">
              <div className="p-4">
                <p className="eyebrow">Simple</p>

                <p className="mt-2 font-display text-2xl font-bold">
                  {singlesMatches}
                </p>
              </div>

              <div className="p-4">
                <p className="eyebrow">Double</p>

                <p className="mt-2 font-display text-2xl font-bold">
                  {doublesMatches}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
                <TrophyIcon className="h-4 w-4" />
              </div>

              <div>
                <p className="eyebrow">Historique</p>

                <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                  Dernières confrontations
                </h2>
              </div>
            </div>

            {recentHistory.length > 0 && (
              <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted">
                {recentHistory.length}
              </span>
            )}
          </div>

          {recentHistory.length === 0 ? (
            <div className="glass-strong mt-4 rounded-[26px] p-7 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/8 bg-white/5 text-muted">
                <SportIcon
                  sport="tennis"
                  className="h-5 w-5"
                />
              </div>

              <p className="mt-4 font-display font-bold">
                Aucun match enregistré
              </p>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
                Les résultats apparaîtront ici après les
                premiers matchs.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {recentHistory.map((item) => (
                <Link
                  key={item.match.id}
                  href={`/matches/${item.match.id}`}
                  className="glass group block rounded-[26px] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.995]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <SportIcon
                            sport={item.match.sport}
                            className="h-4 w-4"
                          />

                          <span>
                            {item.match.sport ===
                            "tennis"
                              ? "Tennis"
                              : "Padel"}
                          </span>
                        </div>

                        <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
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
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                        item.result ===
                        "Victoire"
                          ? "border-accent/20 bg-accent/10 text-accent"
                          : "border-danger/20 bg-danger/10 text-danger"
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
                          className="rounded-xl border border-white/5 bg-white/2.5 px-3 py-2 text-xs font-semibold text-muted"
                        >
                          Set {index + 1} : {score}
                        </span>
                      )
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-muted">
                      {new Date(
                        item.match.created_at
                      ).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>

                    <span className="text-[10px] font-semibold text-muted transition-colors group-hover:text-foreground">
                      Voir le match
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/ranking/history"
          className="glass mt-6 flex min-h-13 items-center justify-center rounded-2xl border-white/8 px-5 text-sm font-bold text-foreground transition-all duration-200 hover:border-white/12 hover:bg-white/5 active:scale-[0.995]"
        >
          Voir l&apos;historique des points
        </Link>
      </div>
    </main>
  );
}