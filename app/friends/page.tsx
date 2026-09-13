"use client";
import Link from "next/link";


import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/src/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

function getPlayerName(profile: Profile | null) {
  if (!profile) return "Joueur";

  const fullName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || profile.username || "Joueur";
}

export default function FriendsPage() {
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        first_name,
        last_name
      `)
      .neq("id", user.id)
      .order("username", {
        ascending: true,
      });

    const { data: friendshipsData } = await supabase
      .from("friendships")
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at
      `)
      .or(
        `requester_id.eq.${user.id},addressee_id.eq.${user.id}`
      )
      .order("created_at", {
        ascending: false,
      });

    setProfiles(profilesData ?? []);
    setFriendships(friendshipsData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
  // Chargement initial des amis depuis Supabase.
  // Le set-state-in-effect est volontaire ici.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void loadData();
}, [loadData]);

  function getFriendshipForProfile(profileId: string) {
    return friendships.find(
      (friendship) =>
        friendship.requester_id === profileId ||
        friendship.addressee_id === profileId
    );
  }

  async function sendRequest(profileId: string) {
    if (!userId) return;

    setMessage("");

    const existing = getFriendshipForProfile(profileId);

    if (existing?.status === "rejected") {
      const { error } = await supabase
        .from("friendships")
        .update({
          requester_id: userId,
          addressee_id: profileId,
          status: "pending",
        })
        .eq("id", existing.id);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Demande d'ami envoyée.");
      await loadData();
      return;
    }

    const { error } = await supabase
      .from("friendships")
      .insert({
        requester_id: userId,
        addressee_id: profileId,
        status: "pending",
      });

    if (error) {
      setMessage(
        error.code === "23505"
          ? "Une demande existe déjà avec ce joueur."
          : error.message
      );
      return;
    }

    setMessage("Demande d'ami envoyée.");
    await loadData();
  }

  async function updateFriendship(
    friendshipId: string,
    status: "accepted" | "rejected"
  ) {
    setMessage("");

    const { error } = await supabase
      .from("friendships")
      .update({ status })
      .eq("id", friendshipId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      status === "accepted"
        ? "Demande acceptée."
        : "Demande refusée."
    );

    await loadData();
  }

  const filteredProfiles = profiles.filter((profile) => {
    const text = [
      profile.first_name,
      profile.last_name,
      profile.username,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const acceptedFriends = friendships.filter(
    (friendship) => friendship.status === "accepted"
  );

  const receivedRequests = friendships.filter(
    (friendship) =>
      friendship.status === "pending" &&
      friendship.addressee_id === userId
  );

  const sentRequests = friendships.filter(
    (friendship) =>
      friendship.status === "pending" &&
      friendship.requester_id === userId
  );

  function getOtherUserId(friendship: Friendship) {
    return friendship.requester_id === userId
      ? friendship.addressee_id
      : friendship.requester_id;
  }

  function getProfileById(id: string): Profile | null {
    return (
      profiles.find((profile) => profile.id === id) ??
      null
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10 pb-28">
        <div className="mx-auto max-w-lg">
          <p className="text-gray-500">
            Chargement...
          </p>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10 pb-28">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-black text-black">
            👥 Amis
          </h1>

          <p className="mt-3 text-gray-500">
            Connecte-toi pour gérer tes amis.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 pb-28">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-black text-black">
          👥 Amis
        </h1>

        <p className="mt-2 text-gray-500">
          Ajoute tes partenaires et retrouve tes amis.
        </p>

        {message && (
          <div className="mt-5 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white">
            {message}
          </div>
        )}

        {receivedRequests.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-black">
              🔔 Demandes reçues
            </h2>

            <div className="mt-3 space-y-3">
              {receivedRequests.map((request) => {
                const profile = getProfileById(
                  request.requester_id
                );

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <p className="font-bold text-black">
                      {getPlayerName(profile)}
                    </p>

                    {profile?.username && (
                      <p className="mt-1 text-sm text-gray-500">
                        @{profile.username}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          updateFriendship(
                            request.id,
                            "accepted"
                          )
                        }
                        className="rounded-xl bg-black px-4 py-3 text-sm font-bold text-white"
                      >
                        Accepter
                      </button>

                      <button
                        onClick={() =>
                          updateFriendship(
                            request.id,
                            "rejected"
                          )
                        }
                        className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-lg font-bold text-black">
            Mes amis
          </h2>

          {acceptedFriends.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Tu n&apos;as pas encore d&apos;ami ajouté.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {acceptedFriends.map((friendship) => {
                const profile = getProfileById(
                  getOtherUserId(friendship)
                );

                return (
                  <div
  key={friendship.id}
  className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"
>
  <div className="min-w-0">
    <p className="truncate font-bold text-black">
      {getPlayerName(profile)}
    </p>

    {profile?.username && (
      <p className="mt-1 text-sm text-gray-500">
        @{profile.username}
      </p>
    )}
  </div>

  <div className="flex shrink-0 items-center gap-2">
    <Link
      href={`/matches/new?opponent=${getOtherUserId(friendship)}`}
      className="rounded-xl bg-black px-3 py-2 text-xs font-bold text-white"
    >
      🎾 Jouer
    </Link>

    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      Ami
    </span>
  </div>
</div>
                );
              })}
            </div>
          )}
        </section>

        {sentRequests.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-black">
              ⏳ Demandes envoyées
            </h2>

            <div className="mt-3 space-y-3">
              {sentRequests.map((request) => {
                const profile = getProfileById(
                  request.addressee_id
                );

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <p className="font-bold text-black">
                      {getPlayerName(profile)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      En attente de réponse
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-bold text-black">
            Ajouter un ami
          </h2>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher un joueur..."
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />

          <div className="mt-3 space-y-3">
            {filteredProfiles.map((profile) => {
              const friendship =
                getFriendshipForProfile(profile.id);

              const isFriend =
                friendship?.status === "accepted";

              const isPending =
                friendship?.status === "pending";

              const isRejected =
                friendship?.status === "rejected";

              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-black">
                      {getPlayerName(profile)}
                    </p>

                    {profile.username && (
                      <p className="mt-1 text-sm text-gray-500">
                        @{profile.username}
                      </p>
                    )}
                  </div>

                  {isFriend ? (
                    <span className="rounded-xl bg-green-100 px-3 py-2 text-xs font-bold text-green-700">
                      Ami
                    </span>
                  ) : isPending ? (
                    <span className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600">
                      En attente
                    </span>
                  ) : isRejected ? (
                    <button
                      onClick={() =>
                        sendRequest(profile.id)
                      }
                      className="rounded-xl bg-black px-3 py-2 text-xs font-bold text-white"
                    >
                      Ajouter
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        sendRequest(profile.id)
                      }
                      className="rounded-xl bg-black px-3 py-2 text-xs font-bold text-white"
                    >
                      Ajouter
                    </button>
                  )}
                </div>
              );
            })}

            {search.length > 0 &&
              filteredProfiles.length === 0 && (
                <div className="rounded-2xl bg-white p-5 text-center">
                  <p className="text-sm text-gray-500">
                    Aucun joueur trouvé.
                  </p>
                </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}