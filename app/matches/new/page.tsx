"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";

type Sport = "tennis" | "padel";
type Format = "singles" | "doubles";
type Surface =
  | "hard"
  | "clay"
  | "grass"
  | "indoor"
  | "";

type Player = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

export default function NewMatchPage() {
  const router = useRouter();
  const { mode } = useSportMode();

  const sport: Sport =
    mode === "padel" ? "padel" : "tennis";

  const [format, setFormat] =
    useState<Format>("singles");

  const [surface, setSurface] =
    useState<Surface>("");
  const [duration, setDuration] = useState("");

  const [players, setPlayers] =
    useState<Player[]>([]);
  const [friends, setFriends] =
    useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] =
    useState("");

  const [opponentId, setOpponentId] =
    useState("");
  const [teammateId, setTeammateId] =
    useState("");
  const [opponent2Id, setOpponent2Id] =
    useState("");

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
        .select(
          "id, username, first_name, last_name"
        )
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

      const opponentFromUrl =
        params.get("opponent");

      if (
        opponentFromUrl &&
        (data ?? []).some(
          (player) =>
            player.id === opponentFromUrl
        )
      ) {
        setOpponentId(opponentFromUrl);
      }

      const { data: friendshipsData } =
        await supabase
          .from("friendships")
          .select(
            "requester_id, addressee_id"
          )
          .or(
            `requester_id.eq.${user.id},addressee_id.eq.${user.id}`
          )
          .eq("status", "accepted");

      const friendIds =
        (friendshipsData ?? []).map(
          (friendship) =>
            friendship.requester_id === user.id
              ? friendship.addressee_id
              : friendship.requester_id
        );

      if (friendIds.length > 0) {
        const { data: friendsData } =
          await supabase
            .from("profiles")
            .select(
              "id, username, first_name, last_name"
            )
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
    if (
      player.first_name ||
      player.last_name
    ) {
      return `${player.first_name ?? ""} ${
        player.last_name ?? ""
      }`.trim();
    }

    return player.username || "Joueur";
  }

  function handleFormatChange(
    newFormat: Format
  ) {
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

    if (
      format === "singles" &&
      !opponentId
    ) {
      setMessage(
        "Sélectionne ton adversaire."
      );
      return;
    }

    if (
      format === "doubles" &&
      !teammateId
    ) {
      setMessage(
        "Sélectionne ton partenaire."
      );
      return;
    }

    if (
      format === "doubles" &&
      !opponentId
    ) {
      setMessage(
        "Sélectionne le premier adversaire."
      );
      return;
    }

    if (
      format === "doubles" &&
      !opponent2Id
    ) {
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

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from("matches")
      .insert({
        created_by: currentUserId,
        sport,
        format,
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

    matchPlayers.push({
      match_id: match.id,
      player_id: currentUserId,
      team: 1,
    });

    if (format === "singles") {
      matchPlayers.push({
        match_id: match.id,
        player_id: opponentId,
        team: 2,
      });
    } else {
      matchPlayers.push({
        match_id: match.id,
        player_id: teammateId,
        team: 1,
      });

      matchPlayers.push({
        match_id: match.id,
        player_id: opponentId,
        team: 2,
      });

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

  const orderedPlayers = [
    ...friends,
    ...players.filter(
      (player) =>
        !friends.some(
          (friend) =>
            friend.id === player.id
        )
    ),
  ];

  const sportLabel =
    sport === "tennis" ? "Tennis" : "Padel";

  const pageBackground = {
    backgroundImage:
      "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
    backgroundAttachment: "fixed" as const,
  };

  if (loading) {
    return (
      <main
        className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
        style={pageBackground}
      >
        <div className="mx-auto max-w-lg">
          <div className="h-3 w-28 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-4 h-9 w-56 animate-pulse rounded-xl bg-surface-2" />

          <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-surface-2" />

          <div className="mt-8 space-y-3">
            <div className="h-36 animate-pulse rounded-[26px] bg-surface" />
            <div className="h-36 animate-pulse rounded-[26px] bg-surface" />
            <div className="h-36 animate-pulse rounded-[26px] bg-surface" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={pageBackground}
    >
      <div className="mx-auto max-w-lg">

        {/* HEADER */}
        <header className="mb-7">
          <Link
            href="/dashboard"
            aria-label="Retour au dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M15 5 8 12l7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">
                  Configuration · {sportLabel}
                </p>

                <h1 className="mt-2 font-display text-[30px] font-bold tracking-tight">
                  Nouveau match
                </h1>

                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                  Configure ta rencontre avant de passer à la saisie du score.
                </p>
              </div>

              <div className="accent-glow grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-[#0b0d13]">
                <SportIcon
                  sport={sport}
                  className="h-5 w-5"
                />
              </div>
            </div>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {/* SPORT */}
          <section className="glass-strong rounded-[28px] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">
                  01 · Sport
                </p>

                <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
                  {sportLabel}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Sport sélectionné depuis ton mode actuel.
                </p>
              </div>

              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
                <SportIcon
                  sport={sport}
                  className="h-5 w-5"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-accent/15 bg-accent/5 px-3.5 py-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[#0b0d13]">
                <SportIcon
                  sport={sport}
                  className="h-4 w-4"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold">
                  {sportLabel}
                </p>

                <p className="mt-0.5 text-[10px] text-muted">
                  Mode actif
                </p>
              </div>

              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]" />
            </div>
          </section>

          {/* FORMAT */}
          <section className="glass rounded-[28px] p-4">
            <p className="eyebrow">
              02 · Format
            </p>

            <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
              Type de rencontre
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleFormatChange(
                    "singles"
                  )
                }
                className={`min-h-16 rounded-[20px] border px-4 text-left transition-all duration-200 active:scale-[0.98] ${
                  format === "singles"
                    ? "border-accent/30 bg-accent text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)]"
                    : "border-white/8 bg-white/5 text-muted hover:border-white/12 hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    Simple
                  </span>

                  {format === "singles" && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0b0d13]/10">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3 w-3"
                        aria-hidden="true"
                      >
                        <path
                          d="m6 12 4 4 8-8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>

                <span
                  className={`mt-1 block text-[10px] ${
                    format === "singles"
                      ? "text-[#0b0d13]/60"
                      : "text-muted-2"
                  }`}
                >
                  1 contre 1
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleFormatChange(
                    "doubles"
                  )
                }
                className={`min-h-16 rounded-[20px] border px-4 text-left transition-all duration-200 active:scale-[0.98] ${
                  format === "doubles"
                    ? "border-accent/30 bg-accent text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)]"
                    : "border-white/8 bg-white/5 text-muted hover:border-white/12 hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    Double
                  </span>

                  {format === "doubles" && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0b0d13]/10">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3 w-3"
                        aria-hidden="true"
                      >
                        <path
                          d="m6 12 4 4 8-8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>

                <span
                  className={`mt-1 block text-[10px] ${
                    format === "doubles"
                      ? "text-[#0b0d13]/60"
                      : "text-muted-2"
                  }`}
                >
                  2 contre 2
                </span>
              </button>
            </div>
          </section>

          {/* JOUEURS */}
          <section className="glass rounded-[28px] p-4">
            <p className="eyebrow">
              03 · Joueurs
            </p>

            <div className="mt-1 flex items-end justify-between gap-3">
              <h2 className="font-display text-lg font-bold tracking-tight">
                Composition
              </h2>

              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {format === "singles"
                  ? "2 joueurs"
                  : "4 joueurs"}
              </span>
            </div>

            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Seuls les joueurs ayant un compte peuvent participer.
            </p>

            {format === "singles" ? (
              <div className="mt-5">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="opponent"
                    className="text-sm font-semibold"
                  >
                    Adversaire
                  </label>

                  <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.11em] text-muted">
                    Équipe 2
                  </span>
                </div>

                <div className="relative">
                  <select
                    id="opponent"
                    value={opponentId}
                    onChange={(event) =>
                      setOpponentId(
                        event.target.value
                      )
                    }
                    className="min-h-12 w-full appearance-none rounded-[20px] border border-white/8 bg-white/5 px-4 pr-11 text-sm font-medium text-foreground outline-none transition-all duration-200 focus:border-accent/50 focus:bg-white/10"
                  >
                    <option value="">
                      Sélectionner un adversaire
                    </option>

                    {orderedPlayers.map(
                      (player) => {
                        const isFriend =
                          friends.some(
                            (friend) =>
                              friend.id ===
                              player.id
                          );

                        return (
                          <option
                            key={player.id}
                            value={player.id}
                          >
                            {isFriend
                              ? "★ "
                              : ""}
                            {playerName(
                              player
                            )}
                          </option>
                        );
                      }
                    )}
                  </select>

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  >
                    <path
                      d="m7 10 5 5 5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {/* PARTENAIRE */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="teammate"
                      className="text-sm font-semibold"
                    >
                      Ton partenaire
                    </label>

                    <span className="rounded-full border border-accent/15 bg-accent/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.11em] text-accent">
                      Équipe 1
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id="teammate"
                      value={teammateId}
                      onChange={(event) =>
                        setTeammateId(
                          event.target.value
                        )
                      }
                      className="min-h-12 w-full appearance-none rounded-[20px] border border-white/8 bg-white/5 px-4 pr-11 text-sm font-medium text-foreground outline-none transition-all duration-200 focus:border-accent/50 focus:bg-white/10"
                    >
                      <option value="">
                        Sélectionner ton partenaire
                      </option>

                      {orderedPlayers
                        .filter(
                          (player) =>
                            player.id !==
                              opponentId &&
                            player.id !==
                              opponent2Id
                        )
                        .map((player) => {
                          const isFriend =
                            friends.some(
                              (friend) =>
                                friend.id ===
                                player.id
                            );

                          return (
                            <option
                              key={player.id}
                              value={player.id}
                            >
                              {isFriend
                                ? "★ "
                                : ""}
                              {playerName(
                                player
                              )}
                            </option>
                          );
                        })}
                    </select>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    >
                      <path
                        d="m7 10 5 5 5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* ADVERSAIRE 1 */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="opponent1"
                      className="text-sm font-semibold"
                    >
                      Adversaire 1
                    </label>

                    <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.11em] text-muted">
                      Équipe 2
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id="opponent1"
                      value={opponentId}
                      onChange={(event) =>
                        setOpponentId(
                          event.target.value
                        )
                      }
                      className="min-h-12 w-full appearance-none rounded-[20px] border border-white/8 bg-white/5 px-4 pr-11 text-sm font-medium text-foreground outline-none transition-all duration-200 focus:border-accent/50 focus:bg-white/10"
                    >
                      <option value="">
                        Sélectionner un adversaire
                      </option>

                      {orderedPlayers
                        .filter(
                          (player) =>
                            player.id !==
                              teammateId &&
                            player.id !==
                              opponent2Id
                        )
                        .map((player) => {
                          const isFriend =
                            friends.some(
                              (friend) =>
                                friend.id ===
                                player.id
                            );

                          return (
                            <option
                              key={player.id}
                              value={player.id}
                            >
                              {isFriend
                                ? "★ "
                                : ""}
                              {playerName(
                                player
                              )}
                            </option>
                          );
                        })}
                    </select>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    >
                      <path
                        d="m7 10 5 5 5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* ADVERSAIRE 2 */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="opponent2"
                      className="text-sm font-semibold"
                    >
                      Adversaire 2
                    </label>

                    <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.11em] text-muted">
                      Équipe 2
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id="opponent2"
                      value={opponent2Id}
                      onChange={(event) =>
                        setOpponent2Id(
                          event.target.value
                        )
                      }
                      className="min-h-12 w-full appearance-none rounded-[20px] border border-white/8 bg-white/5 px-4 pr-11 text-sm font-medium text-foreground outline-none transition-all duration-200 focus:border-accent/50 focus:bg-white/10"
                    >
                      <option value="">
                        Sélectionner un adversaire
                      </option>

                      {orderedPlayers
                        .filter(
                          (player) =>
                            player.id !==
                              teammateId &&
                            player.id !==
                              opponentId
                        )
                        .map((player) => {
                          const isFriend =
                            friends.some(
                              (friend) =>
                                friend.id ===
                                player.id
                            );

                          return (
                            <option
                              key={player.id}
                              value={player.id}
                            >
                              {isFriend
                                ? "★ "
                                : ""}
                              {playerName(
                                player
                              )}
                            </option>
                          );
                        })}
                    </select>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    >
                      <path
                        d="m7 10 5 5 5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* INFORMATIONS */}
          <section className="glass rounded-[28px] p-4">
            <p className="eyebrow">
              04 · Détails
            </p>

            <h2 className="mt-1 font-display text-lg font-bold tracking-tight">
              Informations
            </h2>

            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Quelques informations sur la rencontre.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="surface"
                  className="mb-2.5 block text-sm font-semibold"
                >
                  Surface
                </label>

                <div className="relative">
                  <select
                    id="surface"
                    value={surface}
                    onChange={(event) =>
                      setSurface(
                        event.target.value as Surface
                      )
                    }
                    className="min-h-12 w-full appearance-none rounded-[20px] border border-white/8 bg-white/5 px-4 pr-11 text-sm font-medium text-foreground outline-none transition-all duration-200 focus:border-accent/50 focus:bg-white/10"
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

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  >
                    <path
                      d="m7 10 5 5 5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="mb-2.5 block text-sm font-semibold"
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
                      setDuration(
                        event.target.value
                      )
                    }
                    placeholder="75"
                    className="min-h-12 flex-1 rounded-[20px] border border-white/8 bg-white/5 px-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-2 transition-all duration-200 focus:border-accent/50 focus:bg-white/10"
                  />

                  <span className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted">
                    min
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* MESSAGE */}
          {message && (
            <div className="rounded-[22px] border border-danger/20 bg-danger/5 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-danger/10 text-xs font-bold text-danger">
                  !
                </div>

                <p className="pt-1 text-sm font-medium leading-relaxed text-danger">
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
              className="accent-glow group flex min-h-14 w-full items-center justify-between rounded-[22px] bg-accent px-5 text-left text-[#0b0d13] transition-all duration-200 hover:brightness-105 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {saving
                    ? "Création du match..."
                    : "Continuer vers le score"}
                </p>

                {!saving && (
                  <p className="mt-0.5 text-[11px] font-medium text-[#0b0d13]/60">
                    La saisie du résultat arrive ensuite
                  </p>
                )}
              </div>

              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0b0d13]/10 transition-transform duration-200 group-hover:translate-x-0.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h13M13 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}