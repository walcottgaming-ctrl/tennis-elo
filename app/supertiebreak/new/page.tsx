"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SportIcon from "@/app/components/SportIcon";
import { createClient } from "@/src/supabase/client";

type Player = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  points_super_tiebreak: number;
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3 19 6v5c0 4.6-2.7 7.8-7 10-4.3-2.2-7-5.4-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ChevronDownIcon({
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
      <path d="m6 9 6 6 6-6" />
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
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2.5 20c.7-3.5 2.9-5.5 6.5-5.5s5.8 2 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 6.8" />
      <path d="M17 14.8c2.7.5 4.1 2.2 4.5 5.2" />
    </svg>
  );
}

export default function NewSuperTiebreakPage() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [opponentId, setOpponentId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPlayers() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: playersData, error: playersError } =
        await supabase
          .from("profiles")
          .select(
            "id, username, first_name, last_name, points_super_tiebreak"
          )
          .neq("id", user.id)
          .order("username", {
            ascending: true,
          });

      if (!playersError) {
        setPlayers(playersData ?? []);
      }

      const { data: friendshipsData } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(
          `requester_id.eq.${user.id},addressee_id.eq.${user.id}`
        )
        .eq("status", "accepted");

      const friendIds = (friendshipsData ?? []).map(
        (friendship) =>
          friendship.requester_id === user.id
            ? friendship.addressee_id
            : friendship.requester_id
      );

      if (friendIds.length > 0) {
        const { data: friendsData } = await supabase
          .from("profiles")
          .select(
            "id, username, first_name, last_name, points_super_tiebreak"
          )
          .in("id", friendIds)
          .order("username", {
            ascending: true,
          });

        setFriends(friendsData ?? []);
      } else {
        setFriends([]);
      }

      const params = new URLSearchParams(
        window.location.search
      );

      const opponentFromUrl = params.get("opponent");

      if (
        opponentFromUrl &&
        (playersData ?? []).some(
          (player) => player.id === opponentFromUrl
        )
      ) {
        setOpponentId(opponentFromUrl);
      }

      setLoading(false);
    }

    void loadPlayers();
  }, [router]);

  function playerName(player: Player) {
    if (player.first_name || player.last_name) {
      return `${player.first_name ?? ""} ${
        player.last_name ?? ""
      }`.trim();
    }

    return player.username || "Joueur";
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!currentUserId) {
      setMessage(
        "Impossible de récupérer ton compte."
      );
      return;
    }

    if (!opponentId) {
      setMessage(
        "Sélectionne ton adversaire."
      );
      return;
    }

    if (opponentId === currentUserId) {
      setMessage(
        "Tu ne peux pas jouer contre toi-même."
      );
      return;
    }

    void createMatch();
  }

  async function createMatch() {
    setSaving(true);

    const supabase = createClient();

    /*
      Le Super Tie-Break est toujours :
      - compétitif
      - en simple
      - en 1 contre 1
      - sans surface
      - sans durée
    */
    const { data: match, error: matchError } =
      await supabase
        .from("matches")
        .insert({
          created_by: currentUserId,
          sport: "super_tiebreak",
          format: "singles",
          match_type: "quick_1v1",
          result_type: "competitive",
          surface: null,
          duration_minutes: null,
        })
        .select("id")
        .single();

    if (matchError || !match) {
      setMessage(
        matchError?.message ||
          "Impossible de créer le Super Tie-Break."
      );
      setSaving(false);
      return;
    }

    const { error: playersError } =
      await supabase
        .from("match_players")
        .insert([
          {
            match_id: match.id,
            player_id: currentUserId,
            team: 1,
          },
          {
            match_id: match.id,
            player_id: opponentId,
            team: 2,
          },
        ]);

    if (playersError) {
      setMessage(
        `Le Super Tie-Break a été créé mais les joueurs n'ont pas pu être ajoutés : ${playersError.message}`
      );
      setSaving(false);
      return;
    }

    router.push(
      `/supertiebreak/${match.id}/result`
    );
  }

  const selectedOpponent = players.find(
    (player) => player.id === opponentId
  );

  const orderedPlayers = [
    ...friends,
    ...players.filter(
      (player) =>
        !friends.some(
          (friend) => friend.id === player.id
        )
    ),
  ];

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />
          <div className="absolute -right-45 top-[35%] h-96 w-96 rounded-full bg-indigo-500/8 blur-[130px]" />
          <div className="absolute -bottom-45 left-[20%] h-96 w-96 rounded-full bg-violet-500/8 blur-[130px]" />
        </div>

        <div className="mx-auto max-w-xl">
          <div className="h-10 w-28 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-8 flex gap-3">
            <div className="h-12 w-12 animate-pulse rounded-[17px] bg-surface-2" />

            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded-full bg-surface-2" />
              <div className="h-8 w-64 animate-pulse rounded-xl bg-surface-2" />
              <div className="h-4 w-72 animate-pulse rounded-full bg-surface-2" />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="glass h-48 animate-pulse rounded-[28px]" />
            <div className="glass h-56 animate-pulse rounded-[28px]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-[110px]" />

        <div className="absolute -right-45 top-[35%] h-96 w-96 rounded-full bg-indigo-500/8 blur-[130px]" />

        <div className="absolute -bottom-45 left-[20%] h-96 w-96 rounded-full bg-violet-500/8 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-xl pb-8">
        {/* Header */}
        <header>
          <Link
  href="/supertiebreak"
  aria-label="Retour"
  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
>
  <ArrowLeftIcon className="h-4 w-4" />
</Link>

          <div className="mt-7">
            <div className="flex items-start gap-3.5">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[17px] border border-accent/20 bg-accent/10 text-accent shadow-[0_0_30px_var(--accent-glow)]">
                <div className="absolute inset-0 bg-accent/5 blur-xl" />

                <SportIcon
                  sport="super_tiebreak"
                  className="relative h-6 w-6"
                />
              </div>

              <div className="min-w-0">
                <p className="eyebrow">Nouveau duel</p>

                <h1 className="mt-1 font-display text-[28px] font-bold leading-tight tracking-tight sm:text-3xl">
                  Nouveau Super Tie-Break
                </h1>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  Un duel en 1 contre 1. Premier à 10 points avec
                  deux points d&apos;écart.
                </p>
              </div>
            </div>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-3"
        >
          {/* Format */}
          <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#171920]/85 p-5 shadow-[0_24px_60px_-35px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent/7 blur-[70px]"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">01 · Format</p>

                  <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight">
                    Un duel rapide
                  </h2>

                  <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">
                    Le Super Tie-Break est toujours joué en simple,
                    en format compétitif.
                  </p>
                </div>

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/15 bg-accent/8 text-accent">
                  <SportIcon
                    sport="super_tiebreak"
                    className="h-5 w-5"
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4">
                  <p className="eyebrow text-accent">
                    Format
                  </p>

                  <p className="mt-2 font-display text-lg font-bold">
                    1 contre 1
                  </p>

                  <p className="mt-1 text-[10px] text-muted">
                    Simple
                  </p>
                </div>

                <div className="rounded-2xl border border-white/6 bg-white/3 p-4">
                  <p className="eyebrow">
                    Objectif
                  </p>

                  <p className="mt-2 font-display text-lg font-bold">
                    10 pts
                  </p>

                  <p className="mt-1 text-[10px] text-muted">
                    2 points d&apos;écart
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Adversaire */}
          <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-white/3.5 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">02 · Adversaire</p>

                <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight">
                  Qui affrontes-tu ?
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-muted">
                  Tes amis apparaissent en priorité.
                </p>
              </div>

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/7 bg-white/4 text-muted">
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="relative mt-5">
              <select
                id="opponent"
                value={opponentId}
                onChange={(event) =>
                  setOpponentId(event.target.value)
                }
                className="min-h-14 w-full appearance-none rounded-2xl border border-white/8 bg-white/4 px-4 pr-12 text-sm font-medium text-foreground outline-none transition-all duration-200 hover:border-white/12 hover:bg-white/5 focus:border-accent/40 focus:bg-white/6"
              >
                <option value="">
                  Sélectionner un adversaire
                </option>

                {orderedPlayers.map((player) => {
                  const isFriend = friends.some(
                    (friend) => friend.id === player.id
                  );

                  return (
                    <option
                      key={player.id}
                      value={player.id}
                    >
                      {isFriend ? "★ " : ""}
                      {playerName(player)}
                    </option>
                  );
                })}
              </select>

              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>

            {orderedPlayers.length === 0 && (
              <div className="mt-4 rounded-2xl border border-white/6 bg-white/3 p-4">
                <p className="text-sm font-semibold">
                  Aucun adversaire disponible.
                </p>

                <p className="mt-1.5 text-xs leading-5 text-muted">
                  Il faut qu&apos;un autre joueur possède un profil
                  SmashBreakPoint pour participer au classement
                  Super Tie-Break.
                </p>
              </div>
            )}

            {friends.length > 0 && !selectedOpponent && (
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {friends.length} ami
                {friends.length > 1 ? "s" : ""} disponible
                {friends.length > 1 ? "s" : ""}
              </div>
            )}
          </section>

          {/* Duel */}
          {selectedOpponent && (
            <section className="relative overflow-hidden rounded-[28px] border border-accent/15 bg-accent/[0.035] p-5 backdrop-blur-xl sm:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent/8 blur-[80px]"
              />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">03 · Duel</p>

                    <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight">
                      Prêt à jouer
                    </h2>
                  </div>

                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-accent/15 bg-accent/8 text-accent">
                    <ShieldIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {/* Joueur 1 */}
                  <div className="rounded-[22px] border border-accent/20 bg-accent/6 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="eyebrow text-accent">
                          Joueur 1
                        </p>

                        <p className="mt-1.5 text-sm font-semibold">
                          Toi
                        </p>
                      </div>

                      <div className="grid h-10 w-10 place-items-center rounded-full bg-accent font-display text-sm font-bold text-[#0b0d13] shadow-[0_0_18px_var(--accent-glow)]">
                        1
                      </div>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex items-center gap-3 py-0.5">
                    <div className="h-px flex-1 bg-white/7" />

                    <div className="grid h-7 w-7 place-items-center rounded-full border border-white/8 bg-white/4 text-[8px] font-bold tracking-[0.12em] text-muted">
                      VS
                    </div>

                    <div className="h-px flex-1 bg-white/7" />
                  </div>

                  {/* Joueur 2 */}
                  <div className="rounded-[22px] border border-white/7 bg-white/3 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="eyebrow">
                          Joueur 2
                        </p>

                        <p className="mt-1.5 truncate text-sm font-semibold">
                          {playerName(selectedOpponent)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="eyebrow">
                          Classement
                        </p>

                        <p className="mt-1 font-display text-base font-bold text-accent">
                          {selectedOpponent.points_super_tiebreak.toLocaleString(
                            "fr-FR"
                          )}
                        </p>

                        <p className="mt-0.5 text-[9px] uppercase tracking-widest text-muted">
                          points
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Règles */}
          <section className="rounded-[28px] border border-white/7 bg-white/3 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">À savoir</p>

                <h2 className="mt-1.5 font-display text-lg font-semibold">
                  Règles du duel
                </h2>
              </div>

              <span className="rounded-full border border-white/6 bg-white/4 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                STB
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex gap-3 rounded-2xl border border-white/5 bg-white/2.5 p-3.5">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/7 bg-white/4 text-[10px] font-bold text-muted">
                  01
                </div>

                <p className="text-xs leading-5 text-muted">
                  Le premier joueur à atteindre 10 points gagne,
                  avec au moins 2 points d&apos;écart.
                </p>
              </div>

              <div className="flex gap-3 rounded-2xl border border-white/5 bg-white/2.5 p-3.5">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/7 bg-white/4 text-[10px] font-bold text-muted">
                  02
                </div>

                <p className="text-xs leading-5 text-muted">
                  Le résultat est enregistré uniquement dans le
                  classement Super Tie-Break.
                </p>
              </div>

              <div className="flex gap-3 rounded-2xl border border-white/5 bg-white/2.5 p-3.5">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/7 bg-white/4 text-[10px] font-bold text-muted">
                  03
                </div>

                <p className="text-xs leading-5 text-muted">
                  Les points Tennis et Padel ne sont pas modifiés.
                </p>
              </div>
            </div>
          </section>

          {/* Message */}
          {message && (
            <div className="rounded-[22px] border border-danger/20 bg-danger/5 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-danger/10 text-xs font-bold text-danger">
                  !
                </div>

                <p className="pt-1 text-xs font-medium leading-5 text-danger">
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !opponentId}
              className="group relative flex min-h-16 w-full items-center justify-between overflow-hidden rounded-[22px] bg-accent px-5 text-left text-[#0b0d13] shadow-[0_12px_35px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_15px_42px_var(--accent-glow)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              <div className="relative">
                <p className="font-semibold">
                  {saving
                    ? "Création du duel..."
                    : "Commencer le Super Tie-Break"}
                </p>

                {!saving && opponentId && (
                  <p className="mt-0.5 text-[11px] font-medium text-[#0b0d13]/60">
                    Le duel va commencer
                  </p>
                )}

                {!saving && !opponentId && (
                  <p className="mt-0.5 text-[11px] font-medium text-[#0b0d13]/60">
                    Sélectionne d&apos;abord ton adversaire
                  </p>
                )}
              </div>

              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b0d13]/10 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRightIcon />
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}