import Link from "next/link";
import { createClient } from "@/src/supabase/server";

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

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
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

function TennisIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5 5c3 1 5 3 6 6s0 6-2 8" />
      <path d="M19 19c-3-1-5-3-6-6s0-6 2-8" />
    </svg>
  );
}

function PadelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <circle cx="9" cy="8" r="1" />
      <circle cx="15" cy="8" r="1" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 21c4 0 7-2.8 7-7 0-3.2-1.8-5.5-4.7-8.2.1 2.3-.8 3.7-2 4.5.2-3.7-1.5-6.4-4.4-8.3.3 3.4-2 5.2-2 8.2 0 4.2 2.9 7.8 6.1 7.8Z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3.1 2.4-4.8 5.5-4.8s4.9 1.7 5.5 4.8" />
      <path d="M16 6.5a3 3 0 0 1 0 5.8" />
      <path d="M17 14.5c2 .3 3.3 1.7 3.8 4" />
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
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19H2" />
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
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Statistiques
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Mes statistiques
          </h1>

          <div className="mt-6 rounded-3xl border border-border bg-surface p-6">
            <p className="text-sm leading-6 text-muted">
              Tu dois être connecté pour voir tes statistiques.
            </p>

            <Link
              href="/login"
              className="mt-5 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, sport, format, created_at")
    .order("created_at", { ascending: false });

  if (matchesError) {
    return (
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Statistiques
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Mes statistiques
          </h1>

          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4">
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
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg pb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            ← Accueil
          </Link>

          <header className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Tes performances
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Mes statistiques
            </h1>
          </header>

          <section className="mt-6 rounded-3xl border border-border bg-surface p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <ChartIcon />
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Pas encore de statistiques
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              Joue ton premier match pour commencer à construire tes
              statistiques.
            </p>

            <Link
              href="/matches/new"
              className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background"
            >
              Créer un match
            </Link>
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
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Statistiques
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Mes statistiques
          </h1>

          <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4">
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
      "sport, old_points, new_points, points_change, created_at"
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

  const tennisPointsHistory = pointsHistory.filter(
    (item) => item.sport === "tennis"
  );

  const padelPointsHistory = pointsHistory.filter(
    (item) => item.sport === "padel"
  );

  const latestTennisPoints =
    tennisPointsHistory.length > 0
      ? tennisPointsHistory[tennisPointsHistory.length - 1].new_points ?? 0
      : 0;

  const latestPadelPoints =
    padelPointsHistory.length > 0
      ? padelPointsHistory[padelPointsHistory.length - 1].new_points ?? 0
      : 0;

  const tennisPointsChange = tennisPointsHistory.reduce(
    (total, item) => total + (item.points_change ?? 0),
    0
  );

  const padelPointsChange = padelPointsHistory.reduce(
    (total, item) => total + (item.points_change ?? 0),
    0
  );

  const recentPointsHistory = [...pointsHistory]
    .reverse()
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        {/* Header */}
        <header>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            ← Accueil
          </Link>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Tes performances
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Mes statistiques
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted">
              Une vue complète de tes résultats et de ta progression.
            </p>
          </div>
        </header>

        {/* Bilan */}
        <section className="mt-7 rounded-3xl border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <TrophyIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Ton bilan
              </p>

              <p className="mt-1 text-sm font-medium text-muted">
                Sur l&apos;ensemble de tes matchs
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted">Matchs</p>

              <p className="mt-1 text-4xl font-bold tracking-tight">
                {totalMatches}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted">
                Taux de victoire
              </p>

              <p className="mt-1 text-4xl font-bold tracking-tight text-accent">
                {winRate}%
              </p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${winRate}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs font-medium text-muted">
            <span>{wins} victoire(s)</span>
            <span>{losses} défaite(s)</span>
          </div>
        </section>

        {/* Points */}
        <section className="mt-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Classement
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Progression des points
              </h2>
            </div>

            <Link
              href="/ranking/history"
              className="text-xs font-bold text-accent"
            >
              Historique →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <TennisIcon />
                </div>

                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Tennis
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold tracking-tight">
                {latestTennisPoints}
              </p>

              <p className="text-xs text-muted">points</p>

              <p
                className={`mt-3 text-sm font-bold ${
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

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <PadelIcon />
                </div>

                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Padel
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold tracking-tight">
                {latestPadelPoints}
              </p>

              <p className="text-xs text-muted">points</p>

              <p
                className={`mt-3 text-sm font-bold ${
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

        {/* Évolutions récentes */}
        {recentPointsHistory.length > 0 && (
          <section className="mt-4 rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Dernières évolutions
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Tes points
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <ChartIcon />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentPointsHistory.map((item, index) => {
                const change = item.points_change ?? 0;

                return (
                  <div
                    key={`${item.created_at}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {item.sport === "tennis" ? "Tennis" : "Padel"}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
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

                      <p className="mt-1 text-xs text-muted">
                        {item.old_points ?? 0} → {item.new_points ?? 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tennis / Padel */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <TennisIcon />
            </div>

            <p className="mt-4 text-sm font-medium text-muted">
              Tennis
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight">
              {tennisWinRate}%
            </p>

            <p className="mt-2 text-xs leading-5 text-muted">
              {tennisWins} victoire(s) · {tennisLosses} défaite(s)
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <PadelIcon />
            </div>

            <p className="mt-4 text-sm font-medium text-muted">
              Padel
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight">
              {padelWinRate}%
            </p>

            <p className="mt-2 text-xs leading-5 text-muted">
              {padelWins} victoire(s) · {padelLosses} défaite(s)
            </p>
          </div>
        </section>

        {/* Séries */}
        <section className="mt-4">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Dynamique
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Tes séries
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <FlameIcon />
              </div>

              <p className="mt-4 text-sm text-muted">
                Série actuelle
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight">
                {currentStreak}
              </p>

              <p className="mt-1 text-xs font-medium text-muted">
                {currentStreakType === "win"
                  ? "victoire(s)"
                  : currentStreakType === "loss"
                    ? "défaite(s)"
                    : "aucune série"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <TrophyIcon />
              </div>

              <p className="mt-4 text-sm text-muted">
                Meilleure série
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight">
                {bestWinStreak}
              </p>

              <p className="mt-1 text-xs font-medium text-muted">
                victoire(s)
              </p>
            </div>
          </div>
        </section>

        {/* Adversaires */}
        <section className="mt-4 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <UsersIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Confrontations
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Tes adversaires
              </h2>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted">
            Tes confrontations joueur par joueur.
          </p>

          {opponentStats.length === 0 ? (
            <p className="mt-5 text-sm text-muted">
              Pas encore de confrontation enregistrée.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
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
                    className="rounded-2xl bg-surface-2 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {opponent.name}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {opponent.matches}{" "}
                          {opponent.matches > 1
                            ? "matchs"
                            : "match"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-accent">
                          {opponentWinRate}%
                        </p>

                        <p className="text-xs text-muted">
                          réussite
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                        {opponent.wins} victoire
                        {opponent.wins > 1 ? "s" : ""}
                      </span>

                      <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
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

        {/* Formats */}
        <section className="mt-4 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <UsersIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Formats
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Simple ou double
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-sm text-muted">Simple</p>

              <p className="mt-1 text-3xl font-bold">
                {singlesMatches}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-sm text-muted">Double</p>

              <p className="mt-1 text-3xl font-bold">
                {doublesMatches}
              </p>
            </div>
          </div>
        </section>

        {/* Sets */}
        <section className="mt-4 rounded-3xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <TargetIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Performance
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Les sets
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs text-muted">Gagnés</p>

              <p className="mt-1 text-xl font-bold text-accent">
                {setsWon}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs text-muted">Perdus</p>

              <p className="mt-1 text-xl font-bold text-danger">
                {setsLost}
              </p>
            </div>

            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs text-muted">Taux</p>

              <p className="mt-1 text-xl font-bold">
                {setWinRate}%
              </p>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-5 space-y-3">
          <Link
            href="/ranking/history"
            className="flex min-h-14 items-center justify-between rounded-2xl border border-border bg-surface px-5 text-sm font-bold transition-colors hover:bg-surface-2"
          >
            <span>Voir tout mon historique de points</span>
            <span className="text-accent">→</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex min-h-14 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-bold transition-colors hover:bg-surface-2"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}