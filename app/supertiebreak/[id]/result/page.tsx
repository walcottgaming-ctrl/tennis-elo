"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
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
      <path d="M15 18 9 12l6-6" />
    </svg>
  );
}

function CheckIcon({
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ShieldIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3 19 6v5c0 4.6-2.7 7.8-7 10-4.3-2.2-7-5.4-7-10V6l7-3Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function ErrorIcon({
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export default function SuperTieBreakResultPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const supabase = useMemo(() => createClient(), []);

  const [match, setMatch] = useState<Match | null>(null);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

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

      const { data, error: matchError } =
        await supabase
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
        match_players: (data.match_players ?? []).map(
          (player) => ({
            player_id: player.player_id,
            team: player.team,
            guest_name: player.guest_name,
            profiles: Array.isArray(player.profiles)
              ? player.profiles[0] ?? null
              : player.profiles ?? null,
          })
        ),
      };

      if (normalizedMatch.result_type !== "competitive") {
        setError(
          "Ce match n'est pas un Super Tie-Break compétitif."
        );
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

      const { error: setError } = await supabase
        .from("sets")
        .insert({
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

      const { error: finishError } =
        await supabase.rpc("finish_match", {
          p_match_id: match.id,
        });

      if (finishError) {
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
      <main className="min-h-screen px-4 pb-32 pt-6 text-foreground sm:px-5">
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
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />
          </div>

          <div className="mt-8 h-3 w-24 animate-pulse rounded-full bg-surface-2" />
          <div className="mt-3 h-10 w-64 animate-pulse rounded-xl bg-surface-2" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-8 h-82.5 animate-pulse rounded-[30px] bg-surface" />
          <div className="mt-4 h-40 animate-pulse rounded-[26px] bg-surface" />
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-screen px-4 pb-32 pt-6 text-foreground sm:px-5">
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
            href="/supertiebreak"
            aria-label="Retour au Super Tie-Break"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>

          <section className="glass-strong relative mt-7 overflow-hidden rounded-[28px] p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-danger/10 blur-3xl" />

            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-danger/20 bg-danger/10 text-danger">
                <ErrorIcon />
              </div>

              <p className="eyebrow mt-6">
                Impossible de continuer
              </p>

              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
                Match introuvable
              </h1>

              <p className="mt-3 text-sm leading-6 text-danger">
                {error || "Match introuvable."}
              </p>
            </div>
          </section>
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
          className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full blur-[100px]"
          style={{
            background:
              "color-mix(in srgb, var(--accent) 7%, transparent)",
          }}
        />
      </div>

      <div className="mx-auto max-w-lg pb-8">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Link
            href="/supertiebreak"
            aria-label="Retour au Super Tie-Break"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-accent/15 bg-accent/8 px-3 py-1.5 text-accent">
            <SportIcon
              sport="super_tiebreak"
              className="h-3.5 w-3.5"
            />

            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              Super Tie-Break
            </span>
          </div>
        </div>

        <header className="mt-8">
          <p className="eyebrow text-accent">
            Enregistrement du résultat
          </p>

          <h1 className="mt-2 font-display text-[2.15rem] font-bold leading-none tracking-[-0.04em] sm:text-4xl">
            Quel est le score ?
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            Saisis le score final du duel pour mettre à jour
            automatiquement le classement.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          {/* SCORE HERO */}
          <section className="glass-strong relative overflow-hidden rounded-[30px]">
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 14%, transparent)",
              }}
            />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Résultat final</p>
                  <p className="mt-1 text-xs text-muted-2">
                    Un seul set décisif
                  </p>
                </div>

                <div className="flex h-8 items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    10 pts minimum
                  </span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-end gap-2 sm:gap-3">
                {/* TEAM 1 */}
                <div className="min-w-0">
                  <div className="flex justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-[0_0_20px_var(--accent-glow)]">
                      <span className="font-display text-sm font-bold">
                        1
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 truncate text-center text-sm font-semibold">
                    {playerName(team1 ?? null)}
                  </p>

                  <label className="sr-only">
                    Score de {playerName(team1 ?? null)}
                  </label>

                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={team1Score}
                    onChange={(event) => {
                      setTeam1Score(event.target.value);
                      setError("");
                    }}
                    className="mt-4 h-28 w-full min-w-0 rounded-[22px] border border-white/8 bg-black/15 text-center font-display text-6xl font-bold tracking-tighter text-foreground outline-none transition-all duration-200 placeholder:text-muted-2 focus:border-accent/50 focus:bg-white/5 focus:shadow-[0_0_30px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="0"
                    aria-label={`Score de ${playerName(team1 ?? null)}`}
                    disabled={saving || !isCreator}
                  />
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-end pb-6">
                  <div className="h-8 w-px bg-white/8" />

                  <span className="my-3 font-display text-[10px] font-bold tracking-[0.18em] text-muted-2">
                    VS
                  </span>

                  <div className="h-8 w-px bg-white/8" />
                </div>

                {/* TEAM 2 */}
                <div className="min-w-0">
                  <div className="flex justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-muted">
                      <span className="font-display text-sm font-bold">
                        2
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 truncate text-center text-sm font-semibold">
                    {playerName(team2 ?? null)}
                  </p>

                  <label className="sr-only">
                    Score de {playerName(team2 ?? null)}
                  </label>

                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={team2Score}
                    onChange={(event) => {
                      setTeam2Score(event.target.value);
                      setError("");
                    }}
                    className="mt-4 h-28 w-full min-w-0 rounded-[22px] border border-white/8 bg-black/15 text-center font-display text-6xl font-bold tracking-tighter text-foreground outline-none transition-all duration-200 placeholder:text-muted-2 focus:border-accent/50 focus:bg-white/5 focus:shadow-[0_0_30px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="0"
                    aria-label={`Score de ${playerName(team2 ?? null)}`}
                    disabled={saving || !isCreator}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2.5 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <CheckIcon className="h-3 w-3" />
                </div>

                <p className="text-center text-xs font-medium leading-5 text-muted">
                  Premier à 10 points avec 2 points d&apos;écart
                </p>
              </div>
            </div>
          </section>

          {/* RÈGLES */}
          <section className="glass rounded-[26px] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                <ShieldIcon className="h-4 w-4" />
              </div>

              <div>
                <p className="eyebrow">Règles</p>

                <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
                  Validation du score
                </h2>
              </div>
            </div>

            <div className="mt-5 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-white/2.5">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <CheckIcon className="h-4 w-4 shrink-0 text-accent" />

                <p className="text-sm leading-5 text-muted">
                  Le vainqueur doit atteindre au moins 10 points.
                </p>
              </div>

              <div className="flex items-center gap-3 px-4 py-3.5">
                <CheckIcon className="h-4 w-4 shrink-0 text-accent" />

                <p className="text-sm leading-5 text-muted">
                  Il faut au moins 2 points d&apos;écart.
                </p>
              </div>

              <div className="flex items-center gap-3 px-4 py-3.5">
                <CheckIcon className="h-4 w-4 shrink-0 text-accent" />

                <p className="text-sm leading-5 text-muted">
                  Le score est enregistré comme un seul set décisif.
                </p>
              </div>
            </div>
          </section>

          {/* ERREUR */}
          {error && (
            <div
              role="alert"
              className="relative overflow-hidden rounded-2xl border border-danger/25 bg-danger/8 p-4"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-danger/10 blur-2xl" />

              <div className="relative flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-danger/20 bg-danger/10 text-danger">
                  <ErrorIcon className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-danger/80">
                    Vérification
                  </p>

                  <p className="mt-1 text-sm leading-5 text-danger">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PERMISSIONS */}
          {!isCreator && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-muted">
                  <ShieldIcon className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Résultat verrouillé
                  </p>

                  <p className="mt-1 text-sm leading-5 text-muted">
                    Seul le créateur du match peut enregistrer le résultat.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={saving || !isCreator}
            className="group relative flex min-h-17 w-full items-center justify-between overflow-hidden rounded-[22px] bg-accent px-5 text-left text-[#0b0d13] shadow-[0_12px_35px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_16px_42px_var(--accent-glow)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <div className="relative">
              <p className="font-display text-base font-bold tracking-tight">
                {saving
                  ? "Enregistrement..."
                  : "Valider le résultat"}
              </p>

              <p className="mt-1 text-xs font-medium text-[#0b0d13]/60">
                {saving
                  ? "Mise à jour du classement"
                  : "Le classement sera actualisé automatiquement"}
              </p>
            </div>

            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b0d13]/10 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:bg-[#0b0d13]/15">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b0d13]/25 border-t-[#0b0d13]" />
              ) : (
                <CheckIcon className="h-5 w-5" />
              )}
            </span>
          </button>
        </form>
      </div>
    </main>
  );
}