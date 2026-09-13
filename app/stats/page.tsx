import Link from "next/link";
import { createClient } from "@/src/supabase/server";
import EloChart from "../components/EloChart";

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

type EloHistory = {
  old_elo: number;
  new_elo: number;
  created_at: string;
};

type OpponentStats = {
  playerId: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
};

export default async function StatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-black">
            Statistiques
          </h1>

          <p className="mt-4 text-gray-600">
            Tu dois être connecté pour voir tes statistiques.
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

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, sport, format, created_at")
    .order("created_at", { ascending: false });

  if (matchesError) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-black">
            Statistiques
          </h1>

          <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
            Impossible de charger les matchs.
          </p>
        </div>
      </main>
    );
  }

  const allMatches: Match[] = matches ?? [];

  const matchIds = allMatches.map((match) => match.id);

  if (matchIds.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg pb-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-gray-500"
          >
            ← Accueil
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-black">
            Mes statistiques
          </h1>

          <section className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm">
            <div className="text-4xl">📊</div>

            <h2 className="mt-4 text-xl font-bold text-black">
              Pas encore de statistiques
            </h2>

            <p className="mt-2 text-gray-600">
              Joue ton premier match pour commencer à construire
              tes statistiques.
            </p>

            <Link
              href="/matches/new"
              className="mt-6 block rounded-xl bg-black px-5 py-4 font-bold text-white"
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
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-black">
            Statistiques
          </h1>

          <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
            Impossible de charger les joueurs des matchs.
          </p>
        </div>
      </main>
    );
  }

  const { data: sets } = await supabase
    .from("sets")
    .select(
      "match_id, set_number, team_1_score, team_2_score"
    )
    .in("match_id", matchIds);

  const { data: eloHistory } = await supabase
    .from("elo_history")
    .select("old_elo, new_elo, created_at")
    .eq("player_id", user.id)
    .eq("sport", "tennis")
    .order("created_at", { ascending: true });

  const players: MatchPlayer[] = matchPlayers ?? [];
  const scores: SetScore[] = sets ?? [];
  const history: EloHistory[] = eloHistory ?? [];

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

  const eloPoints = [
    ...(history.length > 0
      ? [
          {
            label: "Début",
            elo: history[0].old_elo,
          },
        ]
      : []),
    ...history.map((item) => ({
      label: new Date(item.created_at).toLocaleDateString(
        "fr-FR",
        {
          day: "2-digit",
          month: "2-digit",
        }
      ),
      elo: item.new_elo,
    })),
  ];

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

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-lg pb-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-500"
        >
          ← Accueil
        </Link>

        <div className="mt-5">
          <p className="text-sm font-medium text-gray-500">
            📊 Tes performances
          </p>

          <h1 className="mt-1 text-3xl font-bold text-black">
            Mes statistiques
          </h1>
        </div>

        {/* BILAN */}
        <section className="mt-6 rounded-2xl bg-black p-5 text-white shadow-sm">
          <p className="text-sm font-medium text-gray-300">
            📊 Ton bilan
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">
                Matchs
              </p>

              <p className="mt-1 text-3xl font-bold">
                {totalMatches}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">
                Taux de victoire
              </p>

              <p className="mt-1 text-3xl font-bold">
                {winRate}%
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-white"
              style={{
                width: `${winRate}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-gray-400">
            <span>{wins} victoire(s)</span>

            <span>{losses} défaite(s)</span>
          </div>
        </section>

        {/* TENNIS / PADEL */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              🎾 Tennis
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {tennisWinRate}%
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {tennisWins} victoire(s) · {tennisLosses} défaite(s)
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              🟢 Padel
            </p>

            <p className="mt-2 text-2xl font-bold text-black">
              {padelWinRate}%
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {padelWins} victoire(s) · {padelLosses} défaite(s)
            </p>
          </div>
        </section>

        {/* SERIES */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              🔥 Série actuelle
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {currentStreak}
            </p>

            <p className="mt-1 text-sm font-medium text-gray-500">
              {currentStreakType === "win"
                ? "victoire(s)"
                : currentStreakType === "loss"
                  ? "défaite(s)"
                  : "aucune série"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              🏆 Meilleure série
            </p>

            <p className="mt-2 text-3xl font-bold text-black">
              {bestWinStreak}
            </p>

            <p className="mt-1 text-sm font-medium text-gray-500">
              victoire(s)
            </p>
          </div>
        </section>

        {/* ELO */}
        <EloChart points={eloPoints} />

        {/* ADVERSAIRES */}
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-black">
            🤝 Tes adversaires
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tes confrontations joueur par joueur
          </p>

          {opponentStats.length === 0 ? (
            <p className="mt-5 text-gray-500">
              Pas encore de confrontation enregistrée.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {opponentStats.map((opponent) => {
                const opponentWinRate =
                  opponent.matches > 0
                    ? Math.round(
                        (opponent.wins /
                          opponent.matches) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={opponent.playerId}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-black">
                          {opponent.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {opponent.matches}{" "}
                          {opponent.matches > 1
                            ? "matchs"
                            : "match"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-black">
                          {opponentWinRate}%
                        </p>

                        <p className="text-xs text-gray-500">
                          réussite
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        {opponent.wins} victoire
                        {opponent.wins > 1 ? "s" : ""}
                      </span>

                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
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

        {/* TENNIS */}
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-black">
            🎾 Tennis
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Matchs
              </p>

              <p className="mt-1 text-xl font-bold text-black">
                {tennisMatches}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Victoires
              </p>

              <p className="mt-1 text-xl font-bold text-green-600">
                {tennisWins}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Défaites
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                {tennisLosses}
              </p>
            </div>
          </div>
        </section>

        {/* PADEL */}
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-black">
            🟢 Padel
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Matchs
              </p>

              <p className="mt-1 text-xl font-bold text-black">
                {padelMatches}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Victoires
              </p>

              <p className="mt-1 text-xl font-bold text-green-600">
                {padelWins}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Défaites
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                {padelLosses}
              </p>
            </div>
          </div>
        </section>

        {/* FORMAT */}
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-black">
            👤 Format
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Simple
              </p>

              <p className="mt-1 text-2xl font-bold text-black">
                {singlesMatches}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Double
              </p>

              <p className="mt-1 text-2xl font-bold text-black">
                {doublesMatches}
              </p>
            </div>
          </div>
        </section>

        {/* SETS */}
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-black">
            🎯 Sets
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Gagnés
              </p>

              <p className="mt-1 text-xl font-bold text-green-600">
                {setsWon}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Perdus
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                {setsLost}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Taux
              </p>

              <p className="mt-1 text-xl font-bold text-black">
                {setWinRate}%
              </p>
            </div>
          </div>
        </section>

        {/* RETOUR */}
        <Link
          href="/dashboard"
          className="mt-6 block min-h-14 rounded-xl border-2 border-black bg-white px-5 py-4 text-center font-bold text-black"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}