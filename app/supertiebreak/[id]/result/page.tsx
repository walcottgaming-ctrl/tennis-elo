"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type MatchPlayer = {
  player_id: string | null;
  team: number;
  guest_name: string | null;
  profiles: Profile | null;
};

type Match = {
  id: string;
  created_by: string;
  sport: string;
  format: string;
  result_type: string;
  match_players: MatchPlayer[];
};

function playerName(player: MatchPlayer | null) {
  if (!player) return "Joueur";

  if (player.profiles) {
    const fullName = [
      player.profiles.first_name,
      player.profiles.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      player.profiles.username ||
      "Joueur"
    );
  }

  return player.guest_name || "Joueur";
}

export default function SuperTieBreakResultPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const supabase = useMemo(() => createClient(), []);

  const [match, setMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatch() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data, error: matchError } = await supabase
        .from("matches")
        .select(
          `
            id,
            created_by,
            sport,
            format,
            result_type,
            match_players (
              player_id,
              team,
              guest_name,
              profiles (
                id,
                username,
                first_name,
                last_name
              )
            )
          `
        )
        .eq("id", matchId)
        .eq("sport", "super_tiebreak")
        .single();

      if (matchError || !data) {
        setError("Impossible de charger ce match.");
        setLoading(false);
        return;
      }

      const normalizedMatch: Match = {
        id: data.id,
        created_by: data.created_by,
        sport: data.sport,
        format: data.format,
        result_type: data.result_type,
        match_players: (data.match_players ?? []).map((player) => ({
          player_id: player.player_id,
          team: player.team,
          guest_name: player.guest_name,
          profiles: Array.isArray(player.profiles)
            ? player.profiles[0] ?? null
            : player.profiles ?? null,
        })),
      };

      if (normalizedMatch.result_type !== "competitive") {
        setError("Ce match n'est pas un Super Tie-Break compétitif.");
        setLoading(false);
        return;
      }

      if (normalizedMatch.match_players.length !== 2) {
        setError(
          "Ce Super Tie-Break doit opposer exactement deux joueurs."
        );
        setLoading(false);
        return;
      }

      if (
        normalizedMatch.match_players.some(
          (player) => !player.player_id
        )
      ) {
        setError(
          "Les deux joueurs doivent être des comptes enregistrés."
        );
        setLoading(false);
        return;
      }

      setMatch(normalizedMatch);
      setLoading(false);
    }

    loadMatch();
  }, [matchId, router, supabase]);

  function validateScore() {
    const score1 = Number(team1Score);
    const score2 = Number(team2Score);

    if (
      team1Score.trim() === "" ||
      team2Score.trim() === ""
    ) {
      return "Saisis les deux scores.";
    }

    if (
      !Number.isInteger(score1) ||
      !Number.isInteger(score2) ||
      score1 < 0 ||
      score2 < 0
    ) {
      return "Les scores doivent être des nombres entiers positifs.";
    }

    if (score1 === score2) {
      return "Un Super Tie-Break ne peut pas être à égalité.";
    }

    const winnerScore = Math.max(score1, score2);
    const difference = Math.abs(score1 - score2);

    if (winnerScore < 10) {
      return "Le vainqueur doit atteindre au moins 10 points.";
    }

    if (difference < 2) {
      return "Il faut au moins 2 points d'écart pour gagner.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!match || !currentUserId) return;

    setError("");

    const validationError = validateScore();

    if (validationError) {
      setError(validationError);
      return;
    }

    const score1 = Number(team1Score);
    const score2 = Number(team2Score);

    setSaving(true);

    try {
      /*
       * On supprime d'abord une éventuelle ligne existante.
       * Cela évite de créer plusieurs sets si le formulaire est
       * réutilisé après une tentative précédente.
       */
      const { error: deleteError } = await supabase
        .from("sets")
        .delete()
        .eq("match_id", match.id)
        .eq("set_number", 1);

      if (deleteError) {
        throw new Error(
          "Impossible de préparer l'enregistrement du score."
        );
      }

      const { error: setError } = await supabase.from("sets").insert({
        match_id: match.id,
        set_number: 1,
        team_1_score: score1,
        team_2_score: score2,
        tie_break_team_1_score: null,
        tie_break_team_2_score: null,
        is_match_tiebreak: true,
      });

      if (setError) {
        throw new Error("Impossible d'enregistrer le score.");
      }

      /*
       * finish_match se charge ensuite du calcul du classement
       * Super Tie-Break et de l'insertion dans ranking_history.
       */
      const { error: finishError } = await supabase.rpc("finish_match", {
        p_match_id: match.id,
      });

      if (finishError) {
        /*
         * Si finish_match échoue, on retire le score que nous venons
         * d'insérer afin d'éviter de laisser un match partiellement
         * enregistré.
         */
        await supabase
          .from("sets")
          .delete()
          .eq("match_id", match.id)
          .eq("set_number", 1);

        throw new Error(
          finishError.message ||
            "Impossible de finaliser le Super Tie-Break."
        );
      }

      router.push(`/supertiebreak/${match.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground">
        <div className="mx-auto max-w-lg">
          <p className="text-sm text-muted">Chargement du match…</p>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground">
        <div className="mx-auto max-w-lg">
          <Link
            href="/supertiebreak"
            className="text-sm font-medium text-accent"
          >
            ← Retour au Super Tie-Break
          </Link>

          <div className="mt-8 rounded-3xl border border-border bg-surface p-6">
            <p className="text-sm leading-6 text-danger">
              {error || "Match introuvable."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const team1 = match.match_players.find(
    (player) => player.team === 1
  );

  const team2 = match.match_players.find(
    (player) => player.team === 2
  );

  const isCreator = currentUserId === match.created_by;

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg">
        <Link
          href="/supertiebreak"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          ← Super Tie-Break
        </Link>

        <header className="mt-7">
          <div className="flex items-center gap-2">
            <SportIcon
              sport="super_tiebreak"
              className="h-4 w-4 text-accent"
            />

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Résultat
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Super Tie-Break
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Saisis le score final du duel.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {playerName(team1 ?? null)}
                </p>

                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={team1Score}
                  onChange={(event) => {
                    setTeam1Score(event.target.value);
                    setError("");
                  }}
                  className="mt-3 h-20 w-full rounded-2xl border border-border bg-surface-2 text-center text-4xl font-bold outline-none transition-colors focus:border-accent"
                  placeholder="0"
                  aria-label={`Score de ${playerName(team1 ?? null)}`}
                  disabled={saving || !isCreator}
                />
              </div>

              <div className="pt-7 text-sm font-bold text-muted">
                —
              </div>

              <div className="min-w-0">
                <p className="truncate text-right text-sm font-semibold">
                  {playerName(team2 ?? null)}
                </p>

                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={team2Score}
                  onChange={(event) => {
                    setTeam2Score(event.target.value);
                    setError("");
                  }}
                  className="mt-3 h-20 w-full rounded-2xl border border-border bg-surface-2 text-center text-4xl font-bold outline-none transition-colors focus:border-accent"
                  placeholder="0"
                  aria-label={`Score de ${playerName(team2 ?? null)}`}
                  disabled={saving || !isCreator}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Règles
            </p>

            <div className="mt-4 space-y-3 text-sm leading-5 text-muted">
              <p>• Le vainqueur doit atteindre au moins 10 points.</p>
              <p>• Il faut au moins 2 points d&apos;écart.</p>
              <p>• Le score est enregistré comme un seul set décisif.</p>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3">
              <p className="text-sm leading-5 text-danger">
                {error}
              </p>
            </div>
          )}

          {!isCreator && (
            <div className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="text-sm leading-5 text-muted">
                Seul le créateur du match peut enregistrer le résultat.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !isCreator}
            className="min-h-14 w-full rounded-2xl bg-accent px-5 text-sm font-bold text-background transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Valider le résultat"}
          </button>
        </form>
      </div>
    </main>
  );
}