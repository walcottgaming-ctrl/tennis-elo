"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

type Player = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  points_super_tiebreak: number;
};

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
      <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <div className="h-3 w-24 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-4 h-9 w-64 animate-pulse rounded-xl bg-surface-2" />

          <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-8 space-y-4">
            <div className="h-40 animate-pulse rounded-3xl bg-surface" />
            <div className="h-48 animate-pulse rounded-3xl bg-surface" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        {/* HEADER */}
        <header>
          <Link
            href="/supertiebreak"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            <span className="text-base">←</span>
            Super Tie-Break
          </Link>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Nouveau duel
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Nouveau Super Tie-Break
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-5 text-muted">
              Un duel en 1 contre 1. Premier à 10 points avec
              deux points d&apos;écart.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          {/* FORMAT */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  01
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Format
                </h2>

                <p className="mt-1 text-sm leading-5 text-muted">
                  Le Super Tie-Break est toujours joué en simple.
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <path
                    strokeLinecap="round"
                    d="M8 12h8M12 8v8"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-accent">
                    1 contre 1
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Match compétitif · classement Super Tie-Break
                  </p>
                </div>

                <div className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-background">
                  10 pts
                </div>
              </div>
            </div>
          </section>

          {/* ADVERSAIRE */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                02
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Adversaire
              </h2>

              <p className="mt-1 text-sm leading-5 text-muted">
                Choisis le joueur que tu affrontes.
              </p>
            </div>

            <div className="mt-5">
              <select
                id="opponent"
                value={opponentId}
                onChange={(event) =>
                  setOpponentId(event.target.value)
                }
                className="min-h-14 w-full appearance-none rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition focus:border-accent"
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
            </div>

            {orderedPlayers.length === 0 && (
              <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-sm font-semibold">
                  Aucun adversaire disponible.
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Il faut qu&apos;un autre joueur possède un profil
                  SmashBreakPoint pour participer au classement
                  Super Tie-Break.
                </p>
              </div>
            )}
          </section>

          {/* ADVERSAIRE SELECTIONNE */}
          {selectedOpponent && (
            <section className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                03
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Duel
              </h2>

              <div className="mt-5 space-y-3">
                {/* MOI */}
                <div className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 px-4 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-accent">
                      Équipe 1
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      Moi
                    </p>
                  </div>

                  <span className="text-sm font-bold text-accent">
                    {">"} Toi
                  </span>
                </div>

                <div className="flex justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 text-[10px] font-black text-muted">
                    VS
                  </div>
                </div>

                {/* ADVERSAIRE */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">
                      Équipe 2
                    </p>

                    <p className="mt-1 truncate text-sm font-bold">
                      {playerName(selectedOpponent)}
                    </p>
                  </div>

                  <p className="ml-4 shrink-0 text-right">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                      Score
                    </span>

                    <span className="text-sm font-bold">
                      {selectedOpponent.points_super_tiebreak}
                    </span>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* REGLES */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              À savoir
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-muted">
                  1
                </div>

                <p className="text-sm leading-5 text-muted">
                  Le premier joueur à atteindre 10 points gagne,
                  avec au moins 2 points d&apos;écart.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-muted">
                  2
                </div>

                <p className="text-sm leading-5 text-muted">
                  Le résultat est enregistré uniquement dans le
                  classement Super Tie-Break.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-muted">
                  3
                </div>

                <p className="text-sm leading-5 text-muted">
                  Les points Tennis et Padel ne sont pas modifiés.
                </p>
              </div>
            </div>
          </section>

          {/* MESSAGE */}
          {message && (
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-sm font-bold text-danger">
                  !
                </div>

                <p className="text-sm font-medium leading-5 text-danger">
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* SUBMIT */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !opponentId}
              className="group flex min-h-16 w-full items-center justify-between rounded-2xl bg-accent px-5 text-left text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div>
                <p className="font-bold">
                  {saving
                    ? "Création du duel..."
                    : "Commencer le Super Tie-Break"}
                </p>

                {!saving && opponentId && (
                  <p className="mt-0.5 text-sm font-medium text-background/60">
                    Tu sais déjà qui affronter
                  </p>
                )}

                {!saving && !opponentId && (
                  <p className="mt-0.5 text-sm font-medium text-background/60">
                    Sélectionne d&apos;abord ton adversaire
                  </p>
                )}
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-xl transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}