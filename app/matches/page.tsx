import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles:
    | {
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        points_tennis: number;
        points_padel: number;
      }
    | {
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        points_tennis: number;
        points_padel: number;
      }[]
    | null;
};

type Match = {
  id: string;
  sport: "tennis" | "padel";
  format: "singles" | "doubles";
  result_type: "competitive" | "friendly";
  created_at: string;
  match_players: MatchPlayer[];
};

type SetRow = {
  id: string;
  match_id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
  is_match_tiebreak: boolean;
};

function getProfile(
  profiles: MatchPlayer["profiles"]
) {
  if (!profiles) return null;

  return Array.isArray(profiles)
    ? profiles[0] ?? null
    : profiles;
}

function getPlayerName(player: MatchPlayer) {
  const profile = getProfile(player.profiles);

  if (!profile) {
    return player.guest_name || "Invité";
  }

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile.username || "Joueur";
}

function getWinnerTeam(sets: SetRow[]) {
  let team1Wins = 0;
  let team2Wins = 0;

  for (const set of sets) {
    if (set.team_1_score > set.team_2_score) {
      team1Wins++;
    }

    if (set.team_2_score > set.team_1_score) {
      team2Wins++;
    }
  }

  if (team1Wins >= 2) return 1;
  if (team2Wins >= 2) return 2;

  return null;
}

function formatScore(sets: SetRow[]) {
  if (sets.length === 0) {
    return "Aucun résultat";
  }

  return sets
    .map((set) => `${set.team_1_score}-${set.team_2_score}`)
    .join("  ");
}

export default async function MatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

   if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12 pb-28">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-black">
            Mes matchs
          </h1>

          <p className="mt-4 text-gray-600">
            Tu dois être connecté pour voir tes matchs.
          </p>
        </div>
      </main>
    );
  }

  const currentUserId = user.id;

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      sport,
      format,
      result_type,
      created_at,
      match_players (
        player_id,
        team,
        guest_name,
        profiles (
          first_name,
          last_name,
          username,
          points_tennis,
          points_padel
        )
      )
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const matchIds = (matches ?? []).map(
    (match) => match.id
  );

  const { data: sets } =
    matchIds.length > 0
      ? await supabase
          .from("sets")
          .select(`
            id,
            match_id,
            set_number,
            team_1_score,
            team_2_score,
            is_match_tiebreak
          `)
          .in("match_id", matchIds)
          .order("set_number", {
            ascending: true,
          })
      : { data: [] };

  const { data: rankingHistory } =
    matchIds.length > 0
      ? await supabase
          .from("ranking_history")
          .select(`
            match_id,
            player_id,
            points_change
          `)
          .in("match_id", matchIds)
      : { data: [] };

  const typedMatches = (matches ?? []) as Match[];
  const typedSets = (sets ?? []) as SetRow[];

  function getMatchSets(matchId: string) {
    return typedSets.filter(
      (set) => set.match_id === matchId
    );
  }

  function getPointsChange(matchId: string) {
    const history = (rankingHistory ?? []).filter(
      (item) =>
        item.match_id === matchId &&
        item.player_id === currentUserId
    );

    if (history.length === 0) {
      return null;
    }

    return history.reduce(
      (total, item) => total + item.points_change,
      0
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 pb-28">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-black">
              Mes matchs
            </h1>

            <p className="mt-2 text-gray-500">
              Tous tes matchs enregistrés
            </p>
          </div>

          <Link
            href="/matches/new"
            className="rounded-xl bg-black px-4 py-3 text-sm font-bold text-white"
          >
            + Match
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Erreur : {error.message}
          </div>
        )}

        {!error && typedMatches.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-sm">
            <div className="text-4xl">🎾</div>

            <p className="mt-3 font-semibold text-black">
              Aucun match pour le moment
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Enregistre ton premier match pour
              commencer ton classement.
            </p>

            <Link
              href="/matches/new"
              className="mt-5 inline-block rounded-xl bg-black px-5 py-3 font-semibold text-white"
            >
              Créer un match
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {typedMatches.map((match) => {
            const matchSets = getMatchSets(match.id);
            const winnerTeam =
              getWinnerTeam(matchSets);
            const pointsChange =
              getPointsChange(match.id);

            const team1 = match.match_players.filter(
              (player) => player.team === 1
            );

            const team2 = match.match_players.filter(
              (player) => player.team === 2
            );

            const userTeam = match.match_players.find(
  (player) => player.player_id === currentUserId
)?.team;

            const userWon =
              winnerTeam !== null &&
              userTeam === winnerTeam;

            const userLost =
              winnerTeam !== null &&
              userTeam !== winnerTeam;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md active:scale-[0.99]"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {match.sport === "tennis"
                            ? "🎾"
                            : "🟢"}
                        </span>

                        <h2 className="font-bold text-black">
                          {match.sport === "tennis"
                            ? "Tennis"
                            : "Padel"}
                        </h2>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {match.format === "singles"
                          ? "Simple"
                          : "Double"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        match.result_type ===
                        "competitive"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {match.result_type ===
                      "competitive"
                        ? "🏆 Compétitif"
                        : "🤝 Amical"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Équipe 1
                      </p>

                      <div className="mt-2 space-y-1">
                        {team1.map((player) => (
                          <p
                            key={
                              player.player_id ??
                              player.guest_name
                            }
                            className="font-semibold text-black"
                          >
                            {getPlayerName(player)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      {matchSets.length > 0 ? (
                        <p className="text-lg font-black text-black">
                          {formatScore(matchSets)}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-gray-400">
                          VS
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Équipe 2
                      </p>

                      <div className="mt-2 space-y-1">
                        {team2.map((player) => (
                          <p
                            key={
                              player.player_id ??
                              player.guest_name
                            }
                            className="font-semibold text-black"
                          >
                            {getPlayerName(player)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      {winnerTeam !== null ? (
                        <p
                          className={`text-sm font-bold ${
                            userWon
                              ? "text-green-600"
                              : userLost
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {userWon
                            ? "🏆 Victoire"
                            : userLost
                            ? "Défaite"
                            : `Équipe ${winnerTeam} gagnante`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Aucun résultat enregistré
                        </p>
                      )}

                      {pointsChange !== null && (
                        <p
                          className={`mt-1 text-xs font-semibold ${
                            pointsChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {pointsChange >= 0
                            ? "+"
                            : ""}
                          {pointsChange} points
                        </p>
                      )}
                    </div>

                    <span className="text-sm font-bold text-gray-400">
                      Voir le match →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}