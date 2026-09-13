"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.2-5.2 7-5.2s6.2 1.8 7 5.2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3.1 2.4-4.8 5.5-4.8s4.9 1.7 5.5 4.8" />
      <path d="M16 6.5a3 3 0 0 1 0 5.8" />
      <path d="M17 14.5c2 .3 3.3 1.7 3.8 4" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19H2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
      <path d="m14 8 4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, username")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
        setUsername(profile.username ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Tu dois être connecté.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        username: username.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(
        `Impossible de sauvegarder le profil : ${error.message}`
      );
      setSaving(false);
      return;
    }

    setMessage("Profil enregistré.");
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <p className="text-sm font-medium text-muted">
          Chargement...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        {/* Header */}
        <header className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Mon compte
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Mon profil
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Gère tes informations personnelles et accède à tes espaces.
          </p>
        </header>

        {/* Profile form */}
        <section className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <UserIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Informations
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Profil personnel
              </h2>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
              >
                Adresse e-mail
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                  <MailIcon />
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 pl-12 pr-4 text-sm font-medium text-muted outline-none"
                />
              </div>

              <p className="mt-2 text-xs text-muted">
                Ton adresse e-mail ne peut pas être modifiée ici.
              </p>
            </div>

            {/* First name */}
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
              >
                Prénom
              </label>

              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Ton prénom"
                className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            </div>

            {/* Last name */}
            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
              >
                Nom
              </label>

              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Ton nom"
                className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
              >
                Nom d&apos;utilisateur
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ton pseudo"
                className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
              />
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="min-h-16 w-full rounded-2xl bg-accent px-5 text-left text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-bold">
                    {saving
                      ? "Enregistrement..."
                      : "Enregistrer mon profil"}
                  </span>

                  <span className="mt-1 block text-xs font-medium opacity-70">
                    Mettre à jour mes informations
                  </span>
                </span>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/10 text-lg">
                  →
                </span>
              </span>
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <p className="text-sm font-medium text-accent">
                {message}
              </p>
            </div>
          )}
        </section>

        {/* Account links */}
        <section className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Mon espace
          </p>

          <div className="space-y-3">
            <Link
              href="/friends"
              className="group flex min-h-16 items-center justify-between rounded-2xl border border-border bg-surface px-4 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                  <FriendsIcon />
                </span>

                <span>
                  <span className="block text-sm font-bold">
                    Mes amis
                  </span>

                  <span className="mt-0.5 block text-xs text-muted">
                    Gérer mes amis et mes contacts
                  </span>
                </span>
              </span>

              <span className="text-lg text-muted">→</span>
            </Link>

            <Link
              href="/stats"
              className="group flex min-h-16 items-center justify-between rounded-2xl border border-border bg-surface px-4 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                  <StatsIcon />
                </span>

                <span>
                  <span className="block text-sm font-bold">
                    Mes statistiques
                  </span>

                  <span className="mt-0.5 block text-xs text-muted">
                    Voir mes performances et mes résultats
                  </span>
                </span>
              </span>

              <span className="text-lg text-muted">→</span>
            </Link>
          </div>
        </section>

        {/* Logout */}
        <section className="mt-7">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-danger/20 bg-danger/5 px-5 text-sm font-bold text-danger transition-colors hover:bg-danger/10"
          >
            <LogoutIcon />
            Se déconnecter
          </button>
        </section>
      </div>
    </main>
  );
}