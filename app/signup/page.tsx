"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/src/supabase/client";
import Image from "next/image";

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      username,
    },
  },
});

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Compte créé ! Vérifie ton adresse e-mail pour confirmer ton compte."
      );
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-lg flex-col justify-center pb-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
            <Image
              src="/icons/icon-192.png"
              alt="SmashBreakPoint"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Bienvenue
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            SmashBreakPoint
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Trace tes matchs. Challenge tes amis.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-6 flex rounded-2xl border border-border bg-surface-2 p-1">
            <Link
              href="/login"
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-bold text-muted transition hover:bg-surface hover:text-foreground"
            >
              Connexion
            </Link>

            <div className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-background">
              Inscription
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
              <UserIcon />
            </div>

            <div>
              <p className="font-bold">Créer ton compte</p>
              <p className="text-sm text-muted">
                Rejoins la communauté SmashBreakPoint.
              </p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-[0.12em] text-muted"
              >
                Pseudo
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                autoComplete="username"
                placeholder="TonPseudo"
                className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:bg-surface"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-[0.12em] text-muted"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="toi@example.com"
                className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:bg-surface"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-[0.12em] text-muted"
              >
                Mot de passe
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Au moins 6 caractères"
                className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:bg-surface"
              />

              <p className="mt-2 text-xs text-muted">
                Minimum 6 caractères.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 font-bold text-background transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{loading ? "Création..." : "Créer mon compte"}</span>
              {!loading && <ArrowRightIcon />}
            </button>
          </form>

          {message && (
            <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-center text-sm leading-5 text-muted">
              {message}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-semibold text-foreground transition hover:text-accent"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}