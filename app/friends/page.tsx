"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/src/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path
        strokeLinecap="round"
        d="m20 20-4-4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12 4 4L19 6"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        d="m6 6 12 12M18 6 6 18"
      />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="8.5" cy="7" r="4" />
      <path
        strokeLinecap="round"
        d="M19 8v6M16 11h6"
      />
    </svg>
  );
}

function GameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        d="M5.5 5.5c3.2 2.2 5 4.7 5 8.2s-1.8 6-5 8.2M18.5 5.5c-3.2 2.2-5 4.7-5 8.2s1.8 6 5 8.2"
      />
    </svg>
  );
}

function getPlayerName(profile: Profile | null) {
  if (!profile) {
    return "Joueur";
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

function getInitials(profile: Profile | null) {
  const name = getPlayerName(profile);

  if (profile?.username && !profile.first_name && !profile.last_name) {
    return profile.username.substring(0, 2).toUpperCase();
  }

  const parts = name.split(" ");

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
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
  last_name,
  avatar_url
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
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg pb-8">
          <div className="flex items-center gap-2 text-muted">
            <UsersIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Communauté
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Amis
          </h1>

          <div className="mt-7 rounded-3xl border border-border bg-surface p-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-pulse rounded-full bg-surface-2" />

              <p className="text-sm font-medium text-muted">
                Chargement...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
        <div className="mx-auto max-w-lg pb-8">
          <div className="flex items-center gap-2 text-muted">
            <UsersIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Communauté
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Amis
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Connecte-toi pour gérer tes amis et ajouter tes
            partenaires.
          </p>

          <Link
            href="/login"
            className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background transition active:scale-[0.99]"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        <header>
          <div className="flex items-center gap-2 text-muted">
            <UsersIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Communauté
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Amis
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Ajoute tes partenaires et retrouve tes amis.
          </p>
        </header>

        {message && (
          <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm font-semibold text-accent">
            {message}
          </div>
        )}

        {receivedRequests.length > 0 && (
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Invitations
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Demandes reçues
                </h2>
              </div>

              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
                {receivedRequests.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {receivedRequests.map((request) => {
                const profile = getProfileById(
                  request.requester_id
                );

                return (
                  <div
                    key={request.id}
                    className="rounded-3xl border border-border bg-surface p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-sm font-bold">
                        {getInitials(profile)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {getPlayerName(profile)}
                        </p>

                        {profile?.username && (
                          <p className="mt-1 text-sm text-muted">
                            @{profile.username}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          updateFriendship(
                            request.id,
                            "accepted"
                          )
                        }
                        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-bold text-background transition active:scale-[0.99]"
                      >
                        <CheckIcon />
                        Accepter
                      </button>

                      <button
                        onClick={() =>
                          updateFriendship(
                            request.id,
                            "rejected"
                          )
                        }
                        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2 px-4 text-sm font-bold text-muted transition active:scale-[0.99]"
                      >
                        <XIcon />
                        Refuser
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Réseau
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Mes amis
              </h2>
            </div>

            <span className="text-sm font-semibold text-muted">
              {acceptedFriends.length}
            </span>
          </div>

          {acceptedFriends.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-border bg-surface p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                <UsersIcon />
              </div>

              <p className="mt-4 font-bold">
                Aucun ami pour le moment
              </p>

              <p className="mt-2 text-sm leading-6 text-muted">
                Ajoute tes partenaires pour les retrouver
                rapidement ici.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {acceptedFriends.map((friendship) => {
                const profile = getProfileById(
                  getOtherUserId(friendship)
                );

                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-surface p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-sm font-bold">
                        {getInitials(profile)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {getPlayerName(profile)}
                        </p>

                        {profile?.username && (
                          <p className="mt-1 truncate text-sm text-muted">
                            @{profile.username}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/matches/new?opponent=${getOtherUserId(
                          friendship
                        )}`}
                        className="flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-background transition active:scale-[0.99]"
                      >
                        <GameIcon />
                        Jouer
                      </Link>

                      <span className="hidden rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent sm:inline-flex">
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
          <section className="mt-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  En attente
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Demandes envoyées
                </h2>
              </div>

              <span className="text-sm font-semibold text-muted">
                {sentRequests.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {sentRequests.map((request) => {
                const profile = getProfileById(
                  request.addressee_id
                );

                return (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-sm font-bold">
                      {getInitials(profile)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {getPlayerName(profile)}
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        En attente de réponse
                      </p>
                    </div>

                    <span className="ml-auto shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
                      En attente
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex items-center gap-2 text-muted">
            <UserPlusIcon />

            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Réseau
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Ajouter un ami
          </h2>

          <div className="relative mt-4">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
              <SearchIcon />
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un joueur..."
              className="min-h-14 w-full rounded-2xl border border-border bg-surface px-4 pl-12 text-sm font-medium text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
          </div>

          <div className="mt-4 space-y-3">
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
                  className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-surface p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-sm font-bold">
                      {getInitials(profile)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {getPlayerName(profile)}
                      </p>

                      {profile.username && (
                        <p className="mt-1 truncate text-sm text-muted">
                          @{profile.username}
                        </p>
                      )}
                    </div>
                  </div>

                  {isFriend ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-xs font-bold text-accent">
                      <CheckIcon />
                      Ami
                    </span>
                  ) : isPending ? (
                    <span className="shrink-0 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-muted">
                      En attente
                    </span>
                  ) : isRejected ? (
                    <button
                      onClick={() =>
                        sendRequest(profile.id)
                      }
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-background transition active:scale-[0.99]"
                    >
                      <UserPlusIcon />
                      Ajouter
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        sendRequest(profile.id)
                      }
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-background transition active:scale-[0.99]"
                    >
                      <UserPlusIcon />
                      Ajouter
                    </button>
                  )}
                </div>
              );
            })}

            {search.length > 0 &&
              filteredProfiles.length === 0 && (
                <div className="rounded-3xl border border-border bg-surface p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                    <SearchIcon />
                  </div>

                  <p className="mt-4 font-bold">
                    Aucun joueur trouvé
                  </p>

                  <p className="mt-2 text-sm text-muted">
                    Essaie avec un autre nom ou pseudo.
                  </p>
                </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}