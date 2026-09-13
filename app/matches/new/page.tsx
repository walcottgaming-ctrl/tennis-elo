"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
  
} from "next/navigation";
import { createClient } from "@/src/supabase/client";


type Sport = "tennis" | "padel";
type Format = "singles" | "doubles";
type MatchType = "quick_1v1" | "group_match";
type ResultType = "competitive" | "friendly";
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
  const [matchType, setMatchType] =
    useState<MatchType>("quick_1v1");
  const [resultType, setResultType] =
    useState<ResultType>("competitive");

  const [surface, setSurface] = useState<Surface>("");
  const [duration, setDuration] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [friends, setFriends] = useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [opponentId, setOpponentId] = useState("");
  const [teammateId, setTeammateId] = useState("");
  const [opponent2Id, setOpponent2Id] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestPosition, setGuestPosition] = useState<
    "opponent" | "teammate" | "opponent2" | null
  >(null);

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

const opponentFromUrl =
  params.get("opponent");

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

  function clearGuest() {
    setGuestName("");
    setGuestPosition(null);
  }

  function addGuest(
    position:
      | "opponent"
      | "teammate"
      | "opponent2"
  ) {
    setGuestName("");
    setGuestPosition(position);
    setResultType("friendly");
    setMessage("");
  }

  function removeGuest() {
    clearGuest();
    setMessage("");
  }

  function hasGuest() {
    return (
      guestPosition !== null &&
      guestName.trim().length > 0
    );
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

    const guestIsActive =
      guestPosition !== null;

    if (
      guestIsActive &&
      guestName.trim().length === 0
    ) {
      setMessage(
        "Indique le nom de l'invité."
      );
      return;
    }

    if (
      format === "singles" &&
      !opponentId &&
      !guestIsActive
    ) {
      setMessage(
        "Sélectionne ton adversaire."
      );
      return;
    }

    if (
      format === "doubles" &&
      !teammateId &&
      guestPosition !== "teammate"
    ) {
      setMessage(
        "Sélectionne ton partenaire."
      );
      return;
    }

    if (
      format === "doubles" &&
      !opponentId &&
      guestPosition !== "opponent"
    ) {
      setMessage(
        "Sélectionne le premier adversaire."
      );
      return;
    }

    if (
      format === "doubles" &&
      !opponent2Id &&
      guestPosition !== "opponent2"
    ) {
      setMessage(
        "Sélectionne le deuxième adversaire."
      );
      return;
    }

    if (
      format === "singles" &&
      guestIsActive &&
      guestPosition !== "opponent"
    ) {
      setMessage(
        "La position de l'invité est incorrecte."
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

    /*
      Un invité force automatiquement le match
      en amical.
    */
    const finalResultType =
      guestIsActive
        ? "friendly"
        : resultType;

    const { data: match, error: matchError } =
      await supabase
        .from("matches")
        .insert({
          created_by: currentUserId,
          sport,
          format,
          match_type: matchType,
          result_type: finalResultType,
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
      player_id?: string;
      team: number;
      guest_name?: string;
    }[] = [];

    /*
      Joueur connecté.
    */
    matchPlayers.push({
      match_id: match.id,
      player_id: currentUserId,
      team: 1,
    });

    if (format === "singles") {
      if (
        guestPosition === "opponent"
      ) {
        matchPlayers.push({
          match_id: match.id,
          team: 2,
          guest_name: guestName.trim(),
        });
      } else {
        matchPlayers.push({
          match_id: match.id,
          player_id: opponentId,
          team: 2,
        });
      }
    } else {
      /*
        Partenaire.
      */
      if (
        guestPosition === "teammate"
      ) {
        matchPlayers.push({
          match_id: match.id,
          team: 1,
          guest_name: guestName.trim(),
        });
      } else {
        matchPlayers.push({
          match_id: match.id,
          player_id: teammateId,
          team: 1,
        });
      }

      /*
        Adversaire 1.
      */
      if (
        guestPosition === "opponent"
      ) {
        matchPlayers.push({
          match_id: match.id,
          team: 2,
          guest_name: guestName.trim(),
        });
      } else {
        matchPlayers.push({
          match_id: match.id,
          player_id: opponentId,
          team: 2,
        });
      }

      /*
        Adversaire 2.
      */
      if (
        guestPosition === "opponent2"
      ) {
        matchPlayers.push({
          match_id: match.id,
          team: 2,
          guest_name: guestName.trim(),
        });
      } else {
        matchPlayers.push({
          match_id: match.id,
          player_id: opponent2Id,
          team: 2,
        });
      }
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
      <main className="min-h-screen bg-gray-50 px-5 py-8">
        <div className="mx-auto max-w-lg">
          <p className="text-gray-600">
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 pb-28">
      <div className="mx-auto max-w-lg">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-gray-500"
        >
          ← Retour
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-black">
          Nouveau match
        </h1>

        <p className="mt-2 text-gray-600">
          Configure ta partie avant de saisir le résultat.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">
              Sport
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSport("tennis")}
                className={`min-h-14 rounded-xl border-2 px-4 font-bold ${
                  sport === "tennis"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                🎾 Tennis
              </button>

              <button
                type="button"
                onClick={() => setSport("padel")}
                className={`min-h-14 rounded-xl border-2 px-4 font-bold ${
                  sport === "padel"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                🟢 Padel
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">
              Format
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormat("singles");
                  clearGuest();
                }}
                className={`min-h-14 rounded-xl border-2 px-4 font-bold ${
                  format === "singles"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                1 contre 1
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormat("doubles");
                  clearGuest();
                }}
                className={`min-h-14 rounded-xl border-2 px-4 font-bold ${
                  format === "doubles"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                Doubles
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">
              Type de match
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={hasGuest()}
                onClick={() =>
                  setMatchType("quick_1v1")
                }
                className={`min-h-14 rounded-xl border-2 px-4 text-sm font-bold disabled:opacity-40 ${
                  matchType === "quick_1v1"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                ⚡ Match rapide
              </button>

              <button
                type="button"
                disabled={hasGuest()}
                onClick={() =>
                  setMatchType("group_match")
                }
                className={`min-h-14 rounded-xl border-2 px-4 text-sm font-bold disabled:opacity-40 ${
                  matchType === "group_match"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                👥 Groupe / ligue
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">
              Enjeu
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={hasGuest()}
                onClick={() =>
                  setResultType("competitive")
                }
                className={`min-h-14 rounded-xl border-2 px-4 text-sm font-bold disabled:opacity-40 ${
                  resultType === "competitive"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                🏆 Compétitif
              </button>

              <button
                type="button"
                onClick={() =>
                  setResultType("friendly")
                }
                className={`min-h-14 rounded-xl border-2 px-4 text-sm font-bold ${
                  resultType === "friendly"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                🤝 Amical
              </button>
            </div>

            {hasGuest() && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
                Un invité participe au match :
                le résultat sera automatiquement
                enregistré comme amical, sans impact ELO.
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">
              Joueurs
            </h2>

            {format === "singles" ? (
              <div className="mt-4">
                <label
                  htmlFor="opponent"
                  className="block text-sm font-medium text-gray-700"
                >
                  Adversaire
                </label>

                {guestPosition ===
                "opponent" ? (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-800">
                      👤 Invité
                    </p>

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={guestName}
                        onChange={(event) =>
                          setGuestName(
                            event.target.value
                          )
                        }
                        placeholder="Nom de l'invité"
                        className="min-h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-black"
                      />

                      <button
                        type="button"
                        onClick={removeGuest}
                        className="rounded-xl border border-gray-300 px-4 font-bold text-black"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      id="opponent"
                      value={opponentId}
                      onChange={(event) =>
                        setOpponentId(
                          event.target.value
                        )
                      }
                      className="mt-2 min-h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                    >
                      <option value="">
                        Sélectionner un adversaire
                      </option>

                      {[
  ...friends,
  ...players.filter(
    (player) =>
      !friends.some(
        (friend) => friend.id === player.id
      )
  ),
].map((player) => {
  const isFriend = friends.some(
    (friend) => friend.id === player.id
  );

  return (
    <option
      key={player.id}
      value={player.id}
    >
      {isFriend ? "⭐ " : ""}
      {playerName(player)}
    </option>
  );
})}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        addGuest("opponent")
                      }
                      className="mt-3 min-h-12 w-full rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 font-bold text-black"
                    >
                      ＋ Ajouter un invité
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="teammate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Ton partenaire
                  </label>

                  {guestPosition ===
                  "teammate" ? (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-medium text-amber-800">
                        👤 Invité
                      </p>

                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={guestName}
                          onChange={(event) =>
                            setGuestName(
                              event.target.value
                            )
                          }
                          placeholder="Nom du partenaire"
                          className="min-h-12 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-black"
                        />

                        <button
                          type="button"
                          onClick={removeGuest}
                          className="rounded-xl border border-gray-300 px-4 font-bold text-black"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <select
                        id="teammate"
                        value={teammateId}
                        onChange={(event) =>
                          setTeammateId(
                            event.target.value
                          )
                        }
                        className="mt-2 min-h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                      >
                        <option value="">
                          Sélectionner ton partenaire
                        </option>

                        {[
  ...friends,
  ...players.filter(
    (player) =>
      !friends.some(
        (friend) => friend.id === player.id
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
      (friend) => friend.id === player.id
    );

    return (
      <option
        key={player.id}
        value={player.id}
      >
        {isFriend ? "⭐ " : ""}
        {playerName(player)}
      </option>
    );
  })}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          addGuest("teammate")
                        }
                        className="mt-3 min-h-12 w-full rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 font-bold text-black"
                      >
                        ＋ Partenaire invité
                      </button>
                    </>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="opponent1"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Adversaire 1
                  </label>

                  {guestPosition ===
                  "opponent" ? (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-bold text-black">
                        👤 {guestName || "Invité"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        id="opponent1"
                        value={opponentId}
                        onChange={(event) =>
                          setOpponentId(
                            event.target.value
                          )
                        }
                        className="mt-2 min-h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                      >
                        <option value="">
                          Sélectionner un adversaire
                        </option>

                        {[
  ...friends,
  ...players.filter(
    (player) =>
      !friends.some(
        (friend) => friend.id === player.id
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
      (friend) => friend.id === player.id
    );

    return (
      <option
        key={player.id}
        value={player.id}
      >
        {isFriend ? "⭐ " : ""}
        {playerName(player)}
      </option>
    );
  })}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          addGuest("opponent")
                        }
                        className="mt-3 min-h-12 w-full rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 font-bold text-black"
                      >
                        ＋ Inviter un adversaire
                      </button>
                    </>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="opponent2"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Adversaire 2
                  </label>

                  {guestPosition ===
                  "opponent2" ? (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-bold text-black">
                        👤 {guestName || "Invité"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        id="opponent2"
                        value={opponent2Id}
                        onChange={(event) =>
                          setOpponent2Id(
                            event.target.value
                          )
                        }
                        className="mt-2 min-h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                      >
                        <option value="">
                          Sélectionner un adversaire
                        </option>

                        {[
  ...friends,
  ...players.filter(
    (player) =>
      !friends.some(
        (friend) => friend.id === player.id
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
      (friend) => friend.id === player.id
    );

    return (
      <option
        key={player.id}
        value={player.id}
      >
        {isFriend ? "⭐ " : ""}
        {playerName(player)}
      </option>
    );
  })}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          addGuest("opponent2")
                        }
                        className="mt-3 min-h-12 w-full rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 font-bold text-black"
                      >
                        ＋ Inviter un adversaire
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">
              Informations complémentaires
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="surface"
                  className="block text-sm font-medium text-gray-700"
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
                  className="mt-2 min-h-14 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
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
                  className="block text-sm font-medium text-gray-700"
                >
                  Durée
                </label>

                <div className="mt-2 flex items-center gap-3">
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
                    placeholder="Ex. 75"
                    className="min-h-14 w-full rounded-xl border border-gray-300 px-4 text-black"
                  />

                  <span className="text-sm text-gray-500">
                    minutes
                  </span>
                </div>
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="min-h-16 w-full rounded-2xl bg-black px-5 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            {saving
              ? "Création du match..."
              : "Continuer vers le score →"}
          </button>
        </form>
      </div>
    </main>
  );
}