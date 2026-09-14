"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

type Sport = "tennis" | "padel";
type Format = "singles" | "doubles";
type Surface = "hard" | "clay" | "grass" | "indoor" | "";

type Player = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

export default function NewMatchPage() {
  const router = useRouter();

  const [sport, setSport] = useState<Sport>("tennis");
  const [format, setFormat] = useState<Format>("singles");

  const [surface, setSurface] = useState<Surface>("");
  const [duration, setDuration] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [opponentId, setOpponentId] = useState("");
  const [teammateId, setTeammateId] = useState("");
  const [opponent2Id, setOpponent2Id] = useState("");

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

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name")
        .neq("id", user.id)
        .order("username", {
          ascending: true,
        });

      if (!error) {
        setPlayers(data ?? []);
      }

      const params = new URLSearchParams(
        window.location.search
      );

      const opponentFromUrl = params.get("opponent");

      if (
        opponentFromUrl &&
        (data ?? []).some(
          (player) => player.id === opponentFromUrl
        )
      ) {
        setOpponentId(opponentFromUrl);
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
          .select("id, username, first_name, last_name")
          .in("id", friendIds);

        setFriends(friendsData ?? []);
      } else {
        setFriends([]);
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

  function handleFormatChange(newFormat: Format) {
    setFormat(newFormat);

    setOpponentId("");
    setTeammateId("");
    setOpponent2Id("");
  }

  async function handleSubmit(
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

    if (format === "singles" && !opponentId) {
      setMessage(
        "Sélectionne ton adversaire."
      );
      return;
    }

    if (format === "doubles" && !teammateId) {
      setMessage(
        "Sélectionne ton partenaire."
      );
      return;
    }

    if (format === "doubles" && !opponentId) {
      setMessage(
        "Sélectionne le premier adversaire."
      );
      return;
    }

    if (format === "doubles" && !opponent2Id) {
      setMessage(
        "Sélectionne le deuxième adversaire."
      );
      return;
    }

    const selectedPlayers = [
      opponentId,
      teammateId,
      opponent2Id,
    ].filter(Boolean);

    if (
      new Set(selectedPlayers).size !==
      selectedPlayers.length
    ) {
      setMessage(
        "Un joueur ne peut pas être sélectionné deux fois."
      );
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const { data: match, error: matchError } =
      await supabase
        .from("matches")
        .insert({
          created_by: currentUserId,
          sport,
          format,

          // Valeurs conservées pour compatibilité
          // avec la structure actuelle de la BDD.
          match_type: "quick_1v1",
          result_type: "competitive",

          surface: surface || null,
          duration_minutes: duration
            ? Number(duration)
            : null,
        })
        .select("id")
        .single();

    if (matchError || !match) {
      setMessage(
        matchError?.message ||
          "Impossible de créer le match."
      );
      setSaving(false);
      return;
    }

    const matchPlayers: {
      match_id: string;
      player_id: string;
      team: number;
    }[] = [];

    // Joueur connecté.
    matchPlayers.push({
      match_id: match.id,
      player_id: currentUserId,
      team: 1,
    });

    if (format === "singles") {
      // Adversaire.
      matchPlayers.push({
        match_id: match.id,
        player_id: opponentId,
        team: 2,
      });
    } else {
      // Partenaire.
      matchPlayers.push({
        match_id: match.id,
        player_id: teammateId,
        team: 1,
      });

      // Adversaire 1.
      matchPlayers.push({
        match_id: match.id,
        player_id: opponentId,
        team: 2,
      });

      // Adversaire 2.
      matchPlayers.push({
        match_id: match.id,
        player_id: opponent2Id,
        team: 2,
      });
    }

    const { error: playersError } =
      await supabase
        .from("match_players")
        .insert(matchPlayers);

    if (playersError) {
      setMessage(
        `Le match a été créé mais les joueurs n'ont pas pu être ajoutés : ${playersError.message}`
      );
      setSaving(false);
      return;
    }

    router.push(
      `/matches/${match.id}/result`
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <div className="h-3 w-24 animate-pulse rounded-full bg-surface-2" />
          <div className="mt-4 h-9 w-56 animate-pulse rounded-xl bg-surface-2" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-8 space-y-4">
            <div className="h-36 animate-pulse rounded-3xl bg-surface" />
            <div className="h-36 animate-pulse rounded-3xl bg-surface" />
            <div className="h-36 animate-pulse rounded-3xl bg-surface" />
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
            href="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-muted transition-colors hover:text-white"
          >
            <span className="mr-2 text-base">←</span>
            Retour
          </Link>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Match
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Nouveau match
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-5 text-muted">
              Configure ta rencontre avant de passer à la saisie du score.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          {/* SPORT */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  01
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Sport
                </h2>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <path
                    strokeLinecap="round"
                    d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c2.5 1.5 3.5 4 3.5 5.5s-1 4-3.5 5.5"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSport("tennis")}
                className={`min-h-14 rounded-2xl border px-4 text-sm font-bold transition-all duration-200 ${
                  sport === "tennis"
                    ? "border-accent bg-accent text-background shadow-lg shadow-accent/10"
                    : "border-border bg-surface-2 text-muted hover:border-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="12" r="8.5" />
                    <path
                      strokeLinecap="round"
                      d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c2.5 1.5 3.5 4 3.5 5.5s-1 4-3.5 5.5"
                    />
                  </svg>
                  Tennis
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSport("padel")}
                className={`min-h-14 rounded-2xl border px-4 text-sm font-bold transition-all duration-200 ${
                  sport === "padel"
                    ? "border-accent bg-accent text-background shadow-lg shadow-accent/10"
                    : "border-border bg-surface-2 text-muted hover:border-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-current text-[9px] font-black">
                    P
                  </span>
                  Padel
                </span>
              </button>
            </div>
          </section>

          {/* FORMAT */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                02
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Format
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  handleFormatChange("singles")
                }
                className={`min-h-14 rounded-2xl border px-4 text-sm font-bold transition-all duration-200 ${
                  format === "singles"
                    ? "border-accent bg-accent text-background"
                    : "border-border bg-surface-2 text-muted hover:border-white/10 hover:text-white"
                }`}
              >
                <span className="block">Simple</span>

                <span
                  className={`mt-0.5 block text-xs ${
                    format === "singles"
                      ? "text-background/60"
                      : "text-muted-2"
                  }`}
                >
                  1 contre 1
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleFormatChange("doubles")
                }
                className={`min-h-14 rounded-2xl border px-4 text-sm font-bold transition-all duration-200 ${
                  format === "doubles"
                    ? "border-accent bg-accent text-background"
                    : "border-border bg-surface-2 text-muted hover:border-white/10 hover:text-white"
                }`}
              >
                <span className="block">Double</span>

                <span
                  className={`mt-0.5 block text-xs ${
                    format === "doubles"
                      ? "text-background/60"
                      : "text-muted-2"
                  }`}
                >
                  2 contre 2
                </span>
              </button>
            </div>
          </section>

          {/* JOUEURS */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                03
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Joueurs
              </h2>

              <p className="mt-1 text-sm text-muted">
                Seuls les joueurs ayant un compte peuvent participer.
              </p>
            </div>

            {format === "singles" ? (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="opponent"
                    className="text-sm font-bold"
                  >
                    Adversaire
                  </label>

                  <span className="text-xs font-medium text-muted-2">
                    Équipe 2
                  </span>
                </div>

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

                  {[
                    ...friends,
                    ...players.filter(
                      (player) =>
                        !friends.some(
                          (friend) =>
                            friend.id === player.id
                        )
                    ),
                  ].map((player) => {
                    const isFriend = friends.some(
                      (friend) =>
                        friend.id === player.id
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
            ) : (
              <div className="mt-5 space-y-6">
                {/* PARTENAIRE */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="teammate"
                      className="text-sm font-bold"
                    >
                      Ton partenaire
                    </label>

                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                      Équipe 1
                    </span>
                  </div>

                  <select
                    id="teammate"
                    value={teammateId}
                    onChange={(event) =>
                      setTeammateId(event.target.value)
                    }
                    className="min-h-14 w-full appearance-none rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none focus:border-accent"
                  >
                    <option value="">
                      Sélectionner ton partenaire
                    </option>

                    {[
                      ...friends,
                      ...players.filter(
                        (player) =>
                          !friends.some(
                            (friend) =>
                              friend.id === player.id
                          )
                      ),
                    ]
                      .filter(
                        (player) =>
                          player.id !== opponentId &&
                          player.id !== opponent2Id
                      )
                      .map((player) => {
                        const isFriend = friends.some(
                          (friend) =>
                            friend.id === player.id
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

                {/* ADVERSAIRE 1 */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="opponent1"
                      className="text-sm font-bold"
                    >
                      Adversaire 1
                    </label>

                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                      Équipe 2
                    </span>
                  </div>

                  <select
                    id="opponent1"
                    value={opponentId}
                    onChange={(event) =>
                      setOpponentId(event.target.value)
                    }
                    className="min-h-14 w-full appearance-none rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none focus:border-accent"
                  >
                    <option value="">
                      Sélectionner un adversaire
                    </option>

                    {[
                      ...friends,
                      ...players.filter(
                        (player) =>
                          !friends.some(
                            (friend) =>
                              friend.id === player.id
                          )
                      ),
                    ]
                      .filter(
                        (player) =>
                          player.id !== teammateId &&
                          player.id !== opponent2Id
                      )
                      .map((player) => {
                        const isFriend = friends.some(
                          (friend) =>
                            friend.id === player.id
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

                {/* ADVERSAIRE 2 */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="opponent2"
                      className="text-sm font-bold"
                    >
                      Adversaire 2
                    </label>

                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                      Équipe 2
                    </span>
                  </div>

                  <select
                    id="opponent2"
                    value={opponent2Id}
                    onChange={(event) =>
                      setOpponent2Id(event.target.value)
                    }
                    className="min-h-14 w-full appearance-none rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none focus:border-accent"
                  >
                    <option value="">
                      Sélectionner un adversaire
                    </option>

                    {[
                      ...friends,
                      ...players.filter(
                        (player) =>
                          !friends.some(
                            (friend) =>
                              friend.id === player.id
                          )
                      ),
                    ]
                      .filter(
                        (player) =>
                          player.id !== teammateId &&
                          player.id !== opponentId
                      )
                      .map((player) => {
                        const isFriend = friends.some(
                          (friend) =>
                            friend.id === player.id
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
              </div>
            )}
          </section>

          {/* INFORMATIONS */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                04
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Détails
              </h2>

              <p className="mt-1 text-sm text-muted">
                Quelques informations sur la rencontre.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="surface"
                  className="mb-3 block text-sm font-bold"
                >
                  Surface
                </label>

                <select
                  id="surface"
                  value={surface}
                  onChange={(event) =>
                    setSurface(
                      event.target.value as Surface
                    )
                  }
                  className="min-h-14 w-full appearance-none rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none focus:border-accent"
                >
                  <option value="">
                    Non précisée
                  </option>

                  <option value="hard">
                    Dur
                  </option>

                  <option value="clay">
                    Terre battue
                  </option>

                  <option value="grass">
                    Gazon
                  </option>

                  <option value="indoor">
                    En salle
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="mb-3 block text-sm font-bold"
                >
                  Durée
                </label>

                <div className="flex items-center gap-3">
                  <input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(event) =>
                      setDuration(event.target.value)
                    }
                    placeholder="75"
                    className="min-h-14 flex-1 rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-2 focus:border-accent"
                  />

                  <span className="text-sm font-medium text-muted">
                    min
                  </span>
                </div>
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
              disabled={saving}
              className="group flex min-h-16 w-full items-center justify-between rounded-2xl bg-accent px-5 text-left text-background transition-all duration-200 hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div>
                <p className="font-bold">
                  {saving
                    ? "Création du match..."
                    : "Continuer vers le score"}
                </p>

                {!saving && (
                  <p className="mt-0.5 text-sm font-medium text-background/60">
                    La saisie du résultat arrive ensuite
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