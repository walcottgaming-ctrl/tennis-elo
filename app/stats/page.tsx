import Link from "next/link";
import { createClient } from "@/src/supabase/server";
import SportIcon from "@/app/components/SportIcon";

type Match = {
  id: string;
  sport: "tennis" | "padel";
  format: "singles" | "doubles";
  created_at: string;
};

type MatchPlayer = {
  match_id: string;
  player_id: string | null;
  team: number;
  guest_name: string | null;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

type SetScore = {
  match_id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
};

type MatchResult = {
  match: Match;
  won: boolean;
};

type RankingHistory = {
  match_id: string;
  sport: "tennis" | "padel";
  old_points: number | null;
  new_points: number | null;
  points_change: number | null;
  created_at: string;
};

type OpponentStats = {
  playerId: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
};

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
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v2a3 3 0 0 0 3 3" />
      <path d="M16 6h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4" />
      <path d="M8 20h8" />
      <path d="M9 17h6" />
    </svg>
  );
}

function FlameIcon({
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21c4 0 7-2.8 7-7 0-3.2-1.8-5.5-4.7-8.2.1 2.3-.8 3.7-2 4.5.2-3.7-1.5-6.4-4.4-8.3.3 3.4-2 5.2-2 8.2 0 4.2 2.9 7.8 6.1 7.8Z" />
    </svg>
  );
}

function TargetIcon({
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

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
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3.1 2.4-4.8 5.5-4.8s4.9 1.7 5.5 4.8" />
      <path d="M16 6.5a3 3 0 0 1 0 5.8" />
      <path d="M17 14.5c2 .3 3.3 1.7 3.8 4" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19H2" />
    </svg>
  );
}

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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon({
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function StatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5 sm:pt-6">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%), #0c0f17",
              backgroundAttachment: "fixed",
            }}
          />
        </div>

        <div className="mx-auto max-w-lg pb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl">
            <ChartIcon className="h-4 w-4" />
          </div>

          <header className="mt-8">
            <p className="eyebrow text-accent">Statistiques</p>

            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Mes statistiques
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted">
              Analyse tes résultats, tes séries et ta progression.
            </p>
          </header>

          <section className="glass-strong relative mt-7 overflow-hidden rounded-[28px] p-6">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 10%, transparent)",
              }}
            />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <ChartIcon className="h-5 w-5" />
              </div>

              <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">
                Connexion nécessaire
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Tu dois être connecté pour voir tes statistiques.
              </p>

              <Link
                href="/login"
                className="group mt-6 flex min-h-14 items-center justify-between rounded-2xl bg-accent px-5 text-sm font-semibold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
              >
                <span>Se connecter</span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b0d13]/10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { data: matches, error: matchesError } =
    await supabase
      .from("matches")
      .select("id, sport, format, created_at")
      .order("created_at", { ascending: false });

  if (matchesError) {
    return (
      <main className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5 sm:pt-6">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%), #0c0f17",
              backgroundAttachment: "fixed",
            }}
          />
        </div>

        <div className="mx-auto max-w-lg">
          <Link
            href="/dashboard"
            aria-label="Retour à l'accueil"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon />
          </Link>

          <header className="mt-8">
            <p className="eyebrow text-accent">Statistiques</p>

            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Mes statistiques
            </h1>
          </header>

          <div className="mt-7 rounded-2xl border border-danger/20 bg-danger/5 p-4 backdrop-blur-xl">
            <p className="text-sm font-medium text-danger">
              Impossible de charger les matchs.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const allMatches: Match[] = matches ?? [];
  const matchIds = allMatches.map((match) => match.id);

  if (matchIds.length === 0) {
    return (
      <main className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5 sm:pt-6">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%), #0c0f17",
              backgroundAttachment: "fixed",
            }}
          />
        </div>

        <div className="mx-auto max-w-lg pb-8">
          <Link
            href="/dashboard"
            aria-label="Retour à l'accueil"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon />
          </Link>

          <header className="mt-8">
            <p className="eyebrow text-accent">Tes performances</p>

            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Mes statistiques
            </h1>
          </header>

          <section className="glass-strong relative mt-7 overflow-hidden rounded-[28px] p-6 text-center">
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 10%, transparent)",
              }}
            />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <ChartIcon className="h-6 w-6" />
              </div>

              <p className="eyebrow mt-6">Première étape</p>

              <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
                Pas encore de statistiques
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Joue ton premier match pour commencer à construire tes
                statistiques.
              </p>

              <Link
                href="/matches/new"
                className="group mt-6 flex min-h-14 items-center justify-between rounded-2xl bg-accent px-5 text-left text-sm font-semibold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
              >
                <span>Créer un match</span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b0d13]/10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRightIcon />
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { data: matchPlayers, error: matchPlayersError } =
    await supabase
      .from("match_players")
      .select("match_id, player_id, team, guest_name")
      .in("match_id", matchIds);

  if (matchPlayersError) {
    return (
      <main className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5 sm:pt-6">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%), #0c0f17",
              backgroundAttachment: "fixed",
            }}
          />
        </div>

        <div className="mx-auto max-w-lg">
          <Link
            href="/dashboard"
            aria-label="Retour à l'accueil"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon />
          </Link>

          <header className="mt-8">
            <p className="eyebrow text-accent">Statistiques</p>

            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Mes statistiques
            </h1>
          </header>

          <div className="mt-7 rounded-2xl border border-danger/20 bg-danger/5 p-4 backdrop-blur-xl">
            <p className="text-sm font-medium text-danger">
              Impossible de charger les joueurs des matchs.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: sets } = await supabase
    .from("sets")
    .select("match_id, set_number, team_1_score, team_2_score")
    .in("match_id", matchIds);

  const { data: rankingHistory } = await supabase
    .from("ranking_history")
    .select(
      "match_id, sport, old_points, new_points, points_change, created_at"
    )
    .eq("player_id", user.id)
    .order("created_at", { ascending: true });

  const players: MatchPlayer[] = matchPlayers ?? [];
  const scores: SetScore[] = sets ?? [];
  const pointsHistory: RankingHistory[] = rankingHistory ?? [];

  const playerIds = [
    ...new Set(
      players
        .map((player) => player.player_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  let profileList: Profile[] = [];

  if (playerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, username")
      .in("id", playerIds);

    profileList = profiles ?? [];
  }

  const getPlayerName = (player: MatchPlayer) => {
    if (player.player_id === null) {
      return player.guest_name || "Invité";
    }

    const profile = profileList.find(
      (item) => item.id === player.player_id
    );

    if (!profile) {
      return "Joueur";
    }

    const fullName = [
      profile.first_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    if (profile.username) {
      return `@${profile.username}`;
    }

    return "Joueur";
  };

  const matchesPlayed = allMatches.filter((match) =>
    players.some(
      (player) =>
        player.match_id === match.id &&
        player.player_id === user.id
    )
  );

  let wins = 0;
  let losses = 0;

  let tennisMatches = 0;
  let padelMatches = 0;

  let singlesMatches = 0;
  let doublesMatches = 0;

  let setsWon = 0;
  let setsLost = 0;

  let tennisWins = 0;
  let tennisLosses = 0;

  let padelWins = 0;
  let padelLosses = 0;

  const matchResults: MatchResult[] = [];

  const opponentMap = new Map<string, OpponentStats>();

  for (const match of matchesPlayed) {
    const matchPlayersForMatch = players.filter(
      (player) => player.match_id === match.id
    );

    const myPlayer = matchPlayersForMatch.find(
      (player) => player.player_id === user.id
    );

    if (!myPlayer) {
      continue;
    }

    const myTeam = myPlayer.team;
    const opponentTeam = myTeam === 1 ? 2 : 1;

    const opponentPlayers = matchPlayersForMatch.filter(
      (player) =>
        player.team === opponentTeam &&
        player.player_id !== user.id
    );

    const matchSets = scores.filter(
      (set) => set.match_id === match.id
    );

    let mySets = 0;
    let opponentSets = 0;

    for (const set of matchSets) {
      if (set.team_1_score === set.team_2_score) {
        continue;
      }

      const myScore =
        myTeam === 1
          ? set.team_1_score
          : set.team_2_score;

      const opponentScore =
        opponentTeam === 1
          ? set.team_1_score
          : set.team_2_score;

      if (myScore > opponentScore) {
        mySets++;
        setsWon++;
      } else {
        opponentSets++;
        setsLost++;
      }
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

    let matchWon = false;
    let matchLost = false;

    if (mySets > opponentSets) {
      wins++;
      matchWon = true;

      if (match.sport === "tennis") {
        tennisWins++;
      } else {
        padelWins++;
      }

      matchResults.push({
        match,
        won: true,
      });
    } else if (opponentSets > mySets) {
      losses++;
      matchLost = true;

      if (match.sport === "tennis") {
        tennisLosses++;
      } else {
        padelLosses++;
      }

      matchResults.push({
        match,
        won: false,
      });
    }

    if (matchWon || matchLost) {
      for (const opponent of opponentPlayers) {
        const opponentKey = opponent.player_id
          ? `player:${opponent.player_id}`
          : `guest:${match.id}:${opponent.guest_name ?? "invite"}`;

        const existing = opponentMap.get(opponentKey);

        if (existing) {
          existing.matches++;

          if (matchWon) {
            existing.wins++;
          } else {
            existing.losses++;
          }
        } else {
          opponentMap.set(opponentKey, {
            playerId: opponentKey,
            name: getPlayerName(opponent),
            matches: 1,
            wins: matchWon ? 1 : 0,
            losses: matchLost ? 1 : 0,
          });
        }
      }
    }
  }

  const totalMatches = wins + losses;

  const winRate =
    totalMatches > 0
      ? Math.round((wins / totalMatches) * 100)
      : 0;

  const setTotal = setsWon + setsLost;

  const setWinRate =
    setTotal > 0
      ? Math.round((setsWon / setTotal) * 100)
      : 0;

  const tennisWinRate =
    tennisMatches > 0
      ? Math.round((tennisWins / tennisMatches) * 100)
      : 0;

  const padelWinRate =
    padelMatches > 0
      ? Math.round((padelWins / padelMatches) * 100)
      : 0;

  let currentStreakType: "win" | "loss" | null = null;
  let currentStreak = 0;

  for (const result of matchResults) {
    const type = result.won ? "win" : "loss";

    if (currentStreakType === null) {
      currentStreakType = type;
      currentStreak = 1;
      continue;
    }

    if (type === currentStreakType) {
      currentStreak++;
    } else {
      break;
    }
  }

  let bestWinStreak = 0;
  let currentWinStreak = 0;

  for (const result of [...matchResults].reverse()) {
    if (result.won) {
      currentWinStreak++;

      bestWinStreak = Math.max(
        bestWinStreak,
        currentWinStreak
      );
    } else {
      currentWinStreak = 0;
    }
  }

  const opponentStats = [...opponentMap.values()].sort(
    (a, b) => {
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }

      return b.wins - a.wins;
    }
  );

  /*
   * POINTS DE CLASSEMENT
   *
   * ranking_history.new_points = source de vérité.
   *
   * Pour retrouver le dernier état, on utilise la date réelle
   * du match via matches.created_at et match_id comme départage.
   *
   * On ne se base PAS sur ranking_history.created_at car un
   * recompute peut recréer toutes les lignes avec le même timestamp.
   */

  const matchById = new Map(
    allMatches.map((match) => [match.id, match])
  );

  const getMatchTime = (item: RankingHistory) => {
    const match = matchById.get(item.match_id);

    if (!match) {
      return 0;
    }

    return new Date(match.created_at).getTime();
  };

  const sortedPointsHistory = [...pointsHistory].sort(
    (a, b) => {
      const aTime = getMatchTime(a);
      const bTime = getMatchTime(b);

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return a.match_id.localeCompare(b.match_id);
    }
  );

  const tennisPointsHistory = sortedPointsHistory.filter(
    (item) => item.sport === "tennis"
  );

  const padelPointsHistory = sortedPointsHistory.filter(
    (item) => item.sport === "padel"
  );

  const latestTennisHistory =
    tennisPointsHistory.length > 0
      ? tennisPointsHistory[
          tennisPointsHistory.length - 1
        ]
      : null;

  const latestPadelHistory =
    padelPointsHistory.length > 0
      ? padelPointsHistory[
          padelPointsHistory.length - 1
        ]
      : null;

  const latestTennisPoints =
    latestTennisHistory?.new_points ?? 1000;

  const latestPadelPoints =
    latestPadelHistory?.new_points ?? 1000;

  const tennisPointsChange =
    latestTennisPoints - 1000;

  const padelPointsChange =
    latestPadelPoints - 1000;

  const recentPointsHistory = [
    ...sortedPointsHistory,
  ]
    .reverse()
    .slice(0, 5);

  return (
    <main className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5 sm:pt-6">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%), #0c0f17",
            backgroundAttachment: "fixed",
          }}
        />

        <div
          className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full blur-[100px]"
          style={{
            background:
              "color-mix(in srgb, var(--accent) 6%, transparent)",
          }}
        />
      </div>

      <div className="mx-auto max-w-lg pb-8">
        {/* HEADER */}
        <header>
          <Link
            href="/dashboard"
            aria-label="Retour à l'accueil"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>

          <div className="mt-8">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-accent">
                Tes performances
              </span>

              <span className="h-1 w-1 rounded-full bg-accent/60" />

              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-2">
                Analyse
              </span>
            </div>

            <h1 className="mt-2 font-display text-[2.15rem] font-bold leading-none tracking-[-0.04em] sm:text-4xl">
              Mes statistiques
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              Une vue complète de tes résultats, de ta progression
              et de tes confrontations.
            </p>
          </div>
        </header>

        {/* BILAN */}
        <section className="glass-strong relative mt-8 overflow-hidden rounded-[30px]">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-[80px]"
            style={{
              background:
                "color-mix(in srgb, var(--accent) 11%, transparent)",
            }}
          />

          <div className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-[0_0_20px_var(--accent-glow)]">
                  <TrophyIcon />
                </div>

                <div>
                  <p className="eyebrow">Ton bilan</p>

                  <p className="mt-1 text-xs text-muted">
                    Tous tes matchs enregistrés
                  </p>
                </div>
              </div>

              <div className="hidden rounded-full border border-white/8 bg-white/4 px-3 py-1.5 sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {totalMatches} match
                  {totalMatches > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/6 bg-white/3 p-4">
                <p className="text-xs font-medium text-muted">
                  Matchs disputés
                </p>

                <p className="mt-2 font-display text-4xl font-bold tracking-[-0.04em]">
                  {totalMatches}
                </p>

                <p className="mt-1 text-xs text-muted-2">
                  {wins} victoire{wins > 1 ? "s" : ""}
                </p>
              </div>

              <div className="rounded-[22px] border border-accent/12 bg-accent/5 p-4">
                <p className="text-xs font-medium text-muted">
                  Taux de victoire
                </p>

                <p className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] text-accent">
                  {winRate}%
                </p>

                <p className="mt-1 text-xs text-muted-2">
                  {losses} défaite{losses > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-accent shadow-[0_0_16px_var(--accent-glow)] transition-all"
                  style={{
                    width: `${winRate}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-muted-2">
                <span>Défaites</span>
                <span>Victoires</span>
              </div>
            </div>
          </div>
        </section>

        {/* POINTS */}
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Classement</p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Progression des points
              </h2>
            </div>

            <Link
              href="/ranking/history"
              className="group flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-foreground"
            >
              Historique
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/8 blur-2xl" />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                  <SportIcon
                    sport="tennis"
                    className="h-5 w-5"
                  />
                </div>

                <span className="eyebrow">Tennis</span>
              </div>

              <p className="relative mt-6 font-display text-3xl font-bold tracking-[-0.04em]">
                {latestTennisPoints}
              </p>

              <p className="text-xs text-muted">
                points
              </p>

              <p
                className={`mt-4 text-xs font-semibold ${
                  tennisPointsChange > 0
                    ? "text-accent"
                    : tennisPointsChange < 0
                      ? "text-danger"
                      : "text-muted"
                }`}
              >
                {tennisPointsChange > 0 ? "+" : ""}
                {tennisPointsChange} depuis le début
              </p>
            </div>

            <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/8 blur-2xl" />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                  <SportIcon
                    sport="padel"
                    className="h-5 w-5"
                  />
                </div>

                <span className="eyebrow">Padel</span>
              </div>

              <p className="relative mt-6 font-display text-3xl font-bold tracking-[-0.04em]">
                {latestPadelPoints}
              </p>

              <p className="text-xs text-muted">
                points
              </p>

              <p
                className={`mt-4 text-xs font-semibold ${
                  padelPointsChange > 0
                    ? "text-accent"
                    : padelPointsChange < 0
                      ? "text-danger"
                      : "text-muted"
                }`}
              >
                {padelPointsChange > 0 ? "+" : ""}
                {padelPointsChange} depuis le début
              </p>
            </div>
          </div>
        </section>

        {/* HISTORIQUE RÉCENT */}
        {recentPointsHistory.length > 0 && (
          <section className="glass mt-5 rounded-[26px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Dernières évolutions</p>

                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                  Activité récente
                </h2>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-muted">
                <ChartIcon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {recentPointsHistory.map((item, index) => {
                const change = item.points_change ?? 0;

                const matchDate =
                  matchById.get(item.match_id)?.created_at ??
                  item.created_at;

                return (
                  <div
                    key={`${item.match_id}-${item.sport}-${index}`}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/2.5 p-3.5 transition-all duration-200 hover:border-white/9 hover:bg-white/4.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/6 bg-white/5 text-muted">
                        <SportIcon
                          sport={item.sport}
                          className="h-4 w-4"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.sport === "tennis"
                            ? "Tennis"
                            : "Padel"}
                        </p>

                        <p className="mt-0.5 text-[11px] text-muted">
                          {formatDate(matchDate)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-bold ${
                          change > 0
                            ? "text-accent"
                            : change < 0
                              ? "text-danger"
                              : "text-muted"
                        }`}
                      >
                        {change > 0 ? "+" : ""}
                        {change} pts
                      </p>

                      <p className="mt-0.5 text-[11px] text-muted-2">
                        {item.old_points ?? 0} →{" "}
                        {item.new_points ?? 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SPORTS */}
        <section className="mt-7">
          <div className="mb-3">
            <p className="eyebrow">Répartition</p>

            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              Tennis & Padel
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                  <SportIcon
                    sport="tennis"
                    className="h-5 w-5"
                  />
                </div>

                <span className="eyebrow">
                  {tennisMatches} match
                  {tennisMatches > 1 ? "s" : ""}
                </span>
              </div>

              <p className="mt-5 text-xs font-medium text-muted">
                Tennis
              </p>

              <p className="mt-1 font-display text-3xl font-bold tracking-[-0.04em]">
                {tennisWinRate}%
              </p>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${tennisWinRate}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-[11px] leading-5 text-muted">
                {tennisWins} victoire
                {tennisWins > 1 ? "s" : ""} · {tennisLosses} défaite
                {tennisLosses > 1 ? "s" : ""}
              </p>
            </div>

            <div className="glass rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                  <SportIcon
                    sport="padel"
                    className="h-5 w-5"
                  />
                </div>

                <span className="eyebrow">
                  {padelMatches} match
                  {padelMatches > 1 ? "s" : ""}
                </span>
              </div>

              <p className="mt-5 text-xs font-medium text-muted">
                Padel
              </p>

              <p className="mt-1 font-display text-3xl font-bold tracking-[-0.04em]">
                {padelWinRate}%
              </p>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${padelWinRate}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-[11px] leading-5 text-muted">
                {padelWins} victoire
                {padelWins > 1 ? "s" : ""} · {padelLosses} défaite
                {padelLosses > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </section>

        {/* SÉRIES */}
        <section className="mt-7">
          <div className="mb-3">
            <p className="eyebrow">Dynamique</p>

            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              Tes séries
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/7 blur-2xl" />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                <FlameIcon />
              </div>

              <p className="mt-5 text-xs font-medium text-muted">
                Série actuelle
              </p>

              <p className="mt-1 font-display text-4xl font-bold tracking-[-0.04em]">
                {currentStreak}
              </p>

              <p className="mt-1 text-xs font-medium text-muted-2">
                {currentStreakType === "win"
                  ? `victoire${currentStreak > 1 ? "s" : ""}`
                  : currentStreakType === "loss"
                    ? `défaite${currentStreak > 1 ? "s" : ""}`
                    : "aucune série"}
              </p>
            </div>

            <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/7 blur-2xl" />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                <TrophyIcon />
              </div>

              <p className="mt-5 text-xs font-medium text-muted">
                Meilleure série
              </p>

              <p className="mt-1 font-display text-4xl font-bold tracking-[-0.04em]">
                {bestWinStreak}
              </p>

              <p className="mt-1 text-xs font-medium text-muted-2">
                victoire
                {bestWinStreak > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </section>

        {/* ADVERSAIRES */}
        <section className="glass mt-7 rounded-[26px] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
              <UsersIcon />
            </div>

            <div>
              <p className="eyebrow">Confrontations</p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Tes adversaires
              </h2>
            </div>
          </div>

          <p className="mt-2 text-sm leading-5 text-muted">
            Ton historique face à chaque adversaire.
          </p>

          {opponentStats.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/5 bg-white/2.5 p-4">
              <p className="text-sm leading-5 text-muted">
                Pas encore de confrontation enregistrée.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {opponentStats.map((opponent) => {
                const opponentWinRate =
                  opponent.matches > 0
                    ? Math.round(
                        (opponent.wins / opponent.matches) * 100
                      )
                    : 0;

                return (
                  <div
                    key={opponent.playerId}
                    className="rounded-2xl border border-white/5 bg-white/2.5 p-4 transition-all duration-200 hover:border-white/9 hover:bg-white/4.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {opponent.name}
                        </p>

                        <p className="mt-1 text-[11px] text-muted">
                          {opponent.matches} match
                          {opponent.matches > 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-display text-xl font-bold text-accent">
                          {opponentWinRate}%
                        </p>

                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-2">
                          victoires
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${opponentWinRate}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full border border-accent/10 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent">
                        {opponent.wins} victoire
                        {opponent.wins > 1 ? "s" : ""}
                      </span>

                      <span className="rounded-full border border-danger/10 bg-danger/10 px-3 py-1 text-[11px] font-semibold text-danger">
                        {opponent.losses} défaite
                        {opponent.losses > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* FORMATS */}
        <section className="glass mt-5 rounded-[26px] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
              <UsersIcon />
            </div>

            <div>
              <p className="eyebrow">Formats</p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Simple ou double
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">
                  Simple
                </p>

                <span className="eyebrow">
                  {singlesMatches}
                </span>
              </div>

              <p className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">
                {singlesMatches}
              </p>

              <p className="mt-1 text-[11px] text-muted-2">
                match{singlesMatches > 1 ? "s" : ""}
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted">
                  Double
                </p>

                <span className="eyebrow">
                  {doublesMatches}
                </span>
              </div>

              <p className="mt-3 font-display text-3xl font-bold tracking-[-0.04em]">
                {doublesMatches}
              </p>

              <p className="mt-1 text-[11px] text-muted-2">
                match{doublesMatches > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </section>

        {/* SETS */}
        <section className="glass mt-5 rounded-[26px] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
              <TargetIcon />
            </div>

            <div>
              <p className="eyebrow">Performance</p>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                Les sets
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4 text-center">
              <p className="text-[11px] font-medium text-muted">
                Gagnés
              </p>

              <p className="mt-2 font-display text-2xl font-bold text-accent">
                {setsWon}
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4 text-center">
              <p className="text-[11px] font-medium text-muted">
                Perdus
              </p>

              <p className="mt-2 font-display text-2xl font-bold text-danger">
                {setsLost}
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4 text-center">
              <p className="text-[11px] font-medium text-muted">
                Taux
              </p>

              <p className="mt-2 font-display text-2xl font-bold">
                {setWinRate}%
              </p>
            </div>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-accent shadow-[0_0_12px_var(--accent-glow)]"
              style={{
                width: `${setWinRate}%`,
              }}
            />
          </div>
        </section>

        {/* NAVIGATION */}
        <div className="mt-5 space-y-2.5">
          <Link
            href="/ranking/history"
            className="glass group flex min-h-14 items-center justify-between rounded-2xl px-5 text-sm font-semibold transition-all duration-200 hover:border-white/9 hover:bg-white/5"
          >
            <span>Voir mon historique de points</span>

            <ArrowRightIcon className="text-accent transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/dashboard"
            className="glass flex min-h-14 items-center justify-center rounded-2xl text-sm font-semibold text-muted transition-all duration-200 hover:border-white/9 hover:bg-white/5 hover:text-foreground"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}