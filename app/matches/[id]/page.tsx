import Link from "next/link";
import { createClient } from "@/src/supabase/server";

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  points_tennis: number;
  points_padel: number;
};

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | Profile[] | null;
};

type Match = {
  id: string;
  sport: "tennis" | "padel";
  format: "singles" | "doubles";
  match_type: "group_match" | "quick_1v1";
  result_type: "competitive" | "friendly";
  surface: string | null;
  duration_minutes: number | null;
  created_at: string;
  match_players: MatchPlayer[];
};

type SetRow = {
  id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
  tie_break_team_1_score: number | null;
  tie_break_team_2_score: number | null;
  is_match_tiebreak: boolean;
};

type RankingHistory = {
  id: string;
  player_id: string;
  sport: "tennis" | "padel";
  old_points: number;
  new_points: number;
  points_change: number;
  base_points: number;
  bonus_bulle: number;
  bonus_double_bulle: number;
  bonus_victoire_propre: number;
  bonus_serie: number;
  bonus_performer: number;
  malus_fanny: number;
  malus_double_bulle: number;
  malus_contre_performance: number;
  amortisseur_tiebreak: number;
  created_at: string;
  profiles: Profile | Profile[] | null;
};

function getProfile(
  profiles: Profile | Profile[] | null
): Profile | null {
  if (!profiles) return null;

  return Array.isArray(profiles)
    ? profiles[0] ?? null
    : profiles;
}

function getPlayerName(
  profiles: Profile | Profile[] | null,
  guestName: string | null
) {
  const profile = getProfile(profiles);

  if (!profile) {
    return guestName || "Invité";
  }

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile.username || "Joueur";
}

function getPoints(
  profile: Profile | null,
  sport: "tennis" | "padel"
) {
  if (!profile) return null;

  return sport === "tennis"
    ? profile.points_tennis
    : profile.points_padel;
}

function formatSport(sport: string) {
  return sport === "tennis" ? "🎾 Tennis" : "🟢 Padel";
}

function formatFormat(format: string) {
  return format === "singles"
    ? "1 contre 1"
    : "Double";
}

function formatMatchType(
  matchType: string,
  format: string
) {
  if (matchType === "group_match") {
    return "Match de groupe";
  }

  if (format === "doubles") {
    return "Double";
  }

  return "Simple";
}

function formatSurface(surface: string | null) {
  if (!surface) return null;

  const labels: Record<string, string> = {
    hard: "Dur",
    clay: "Terre battue",
    grass: "Gazon",
    indoor: "Indoor",
  };

  return labels[surface] ?? surface;
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

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(`
      id,
      sport,
      format,
      match_type,
      result_type,
      surface,
      duration_minutes,
      created_at,
      match_players (
        player_id,
        team,
        guest_name,
        profiles (
          id,
          username,
          first_name,
          last_name,
          points_tennis,
          points_padel
        )
      )
    `)
    .eq("id", id)
    .single();

  if (matchError || !match) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-lg">
          <Link
            href="/matches"
            className="text-sm font-medium text-gray-600"
          >
            ← Retour aux matchs
          </Link>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-black">
              Match introuvable
            </h1>
          </div>
        </div>
      </main>
    );
  }

  const typedMatch = match as Match;

  const { data: sets } = await supabase
    .from("sets")
    .select(`
      id,
      set_number,
      team_1_score,
      team_2_score,
      tie_break_team_1_score,
      tie_break_team_2_score,
      is_match_tiebreak
    `)
    .eq("match_id", id)
    .order("set_number", { ascending: true });

  const { data: rankingHistory } = await supabase
    .from("ranking_history")
    .select(`
      id,
      player_id,
      sport,
      old_points,
      new_points,
      points_change,
      base_points,
      bonus_bulle,
      bonus_double_bulle,
      bonus_victoire_propre,
      bonus_serie,
      bonus_performer,
      malus_fanny,
      malus_double_bulle,
      malus_contre_performance,
      amortisseur_tiebreak,
      created_at,
      profiles (
        id,
        username,
        first_name,
        last_name,
        points_tennis,
        points_padel
      )
    `)
    .eq("match_id", id)
    .order("created_at", { ascending: true });

  const team1 = typedMatch.match_players.filter(
    (player) => player.team === 1
  );

  const team2 = typedMatch.match_players.filter(
    (player) => player.team === 2
  );

  const typedSets = (sets ?? []) as SetRow[];
  const typedHistory = (rankingHistory ?? []) as RankingHistory[];

  const winnerTeam = getWinnerTeam(typedSets);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 pb-28">
      <div className="mx-auto max-w-lg">
        <Link
          href="/matches"
          className="text-sm font-medium text-gray-600"
        >
          ← Retour aux matchs
        </Link>

        <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-black px-5 py-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-300">
                  {formatSport(typedMatch.sport)}
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  {formatFormat(typedMatch.format)}
                </h1>
              </div>

              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                {typedMatch.result_type === "friendly"
                  ? "🤝 Amical"
                  : "🏆 Compétitif"}
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`rounded-2xl p-4 ${
                  winnerTeam === 1
                    ? "bg-green-50 ring-2 ring-green-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Équipe 1
                  </p>

                  {winnerTeam === 1 && (
                    <span className="text-sm font-bold text-green-600">
                      🏆
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-3">
                  {team1.map((player) => {
                    const profile = getProfile(player.profiles);
                    const points = getPoints(
                      profile,
                      typedMatch.sport
                    );

                    return (
                      <div
                        key={
                          player.player_id ??
                          `guest-${player.guest_name}`
                        }
                      >
                        <p className="font-semibold text-black">
                          {getPlayerName(
                            player.profiles,
                            player.guest_name
                          )}
                        </p>

                        {profile && points !== null && (
                          <p className="mt-1 text-xs text-gray-500">
                            {points} points
                          </p>
                        )}

                        {!profile && (
                          <p className="mt-1 text-xs text-gray-500">
                            Invité
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className={`rounded-2xl p-4 ${
                  winnerTeam === 2
                    ? "bg-green-50 ring-2 ring-green-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Équipe 2
                  </p>

                  {winnerTeam === 2 && (
                    <span className="text-sm font-bold text-green-600">
                      🏆
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-3">
                  {team2.map((player) => {
                    const profile = getProfile(player.profiles);
                    const points = getPoints(
                      profile,
                      typedMatch.sport
                    );

                    return (
                      <div
                        key={
                          player.player_id ??
                          `guest-${player.guest_name}`
                        }
                      >
                        <p className="font-semibold text-black">
                          {getPlayerName(
                            player.profiles,
                            player.guest_name
                          )}
                        </p>

                        {profile && points !== null && (
                          <p className="mt-1 text-xs text-gray-500">
                            {points} points
                          </p>
                        )}

                        {!profile && (
                          <p className="mt-1 text-xs text-gray-500">
                            Invité
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-black">
                  Résultat
                </h2>

                <Link
                  href={`/matches/${typedMatch.id}/result`}
                  className="text-sm font-semibold text-black underline"
                >
                  Voir / modifier
                </Link>
              </div>

              {typedSets.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  Aucun résultat enregistré.
                </p>
              ) : (
                <>
                  {winnerTeam && (
                    <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-center">
                      <p className="text-sm font-semibold text-green-700">
                        🏆 Équipe {winnerTeam} remporte le match
                      </p>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {typedSets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-gray-500">
                          {set.is_match_tiebreak
                            ? "Super tie-break"
                            : `Set ${set.set_number}`}
                        </span>

                        <span className="text-lg font-bold text-black">
                          {set.team_1_score} - {set.team_2_score}
                        </span>

                        {!set.is_match_tiebreak &&
                          set.tie_break_team_1_score !== null &&
                          set.tie_break_team_2_score !== null && (
                            <span className="text-xs text-gray-500">
                              TB{" "}
                              {set.tie_break_team_1_score}-
                              {set.tie_break_team_2_score}
                            </span>
                          )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {typedHistory.length > 0 && (
              <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                <h2 className="font-bold text-black">
                  Évolution des points
                </h2>

                <div className="mt-4 space-y-3">
                  {typedHistory.map((history) => {
                    const profile = getProfile(history.profiles);

                    const name = getPlayerName(
                      profile,
                      null
                    );

                    const positive =
                      history.points_change >= 0;

                    return (
                      <div
                        key={history.id}
                        className="rounded-xl bg-gray-50 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-black">
                              {name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {history.old_points} →{" "}
                              {history.new_points} points
                            </p>
                          </div>

                          <span
                            className={`font-bold ${
                              positive
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {positive ? "+" : ""}
                            {history.points_change}
                          </span>
                        </div>

                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <p className="text-xs font-semibold text-gray-500">
                            Détail
                          </p>

                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                            {history.base_points !== 0 && (
                              <span>
                                Base :{" "}
                                {history.base_points > 0
                                  ? "+"
                                  : ""}
                                {history.base_points}
                              </span>
                            )}

                            {history.bonus_bulle !== 0 && (
                              <span>
                                Set blanc : +
                                {history.bonus_bulle}
                              </span>
                            )}

                            {history.bonus_double_bulle !== 0 && (
                              <span>
                                Match parfait : +
                                {history.bonus_double_bulle}
                              </span>
                            )}

                            {history.bonus_victoire_propre !== 0 && (
                              <span>
                                Victoire nette : +
                                {history.bonus_victoire_propre}
                              </span>
                            )}

                            {history.bonus_serie !== 0 && (
                              <span>
                                Série : +
                                {history.bonus_serie}
                              </span>
                            )}

                            {history.bonus_performer !== 0 && (
                              <span>
                                Performance : +
                                {history.bonus_performer}
                              </span>
                            )}

                            {history.malus_fanny !== 0 && (
                              <span>
                                Set blanc concédé :{" "}
                                {history.malus_fanny}
                              </span>
                            )}

                            {history.malus_double_bulle !== 0 && (
                              <span>
                                Match sans jeu :{" "}
                                {history.malus_double_bulle}
                              </span>
                            )}

                            {history.malus_contre_performance !== 0 && (
                              <span>
                                Contre-performance :{" "}
                                {history.malus_contre_performance}
                              </span>
                            )}

                            {history.amortisseur_tiebreak !== 0 && (
                              <span>
                                Défaite serrée : +
                                {history.amortisseur_tiebreak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Type
                </p>

                <p className="mt-1 font-semibold text-black">
                  {formatMatchType(
                    typedMatch.match_type,
                    typedMatch.format
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Surface
                </p>

                <p className="mt-1 font-semibold text-black">
                  {formatSurface(typedMatch.surface) ?? "—"}
                </p>
              </div>
            </div>

            {typedMatch.duration_minutes && (
              <div className="mt-3 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Durée
                </p>

                <p className="mt-1 font-semibold text-black">
                  {typedMatch.duration_minutes} min
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}