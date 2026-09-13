"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
            <div className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-background">
              Connexion
            </div>

            <Link
              href="/signup"
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-bold text-muted transition hover:bg-surface hover:text-foreground"
            >
              Inscription
            </Link>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
              <LockIcon />
            </div>

            <div>
              <p className="font-bold">Connexion</p>
              <p className="text-sm text-muted">
                Accède à ton espace personnel.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
                autoComplete="current-password"
                placeholder="Ton mot de passe"
                className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted focus:border-accent/60 focus:bg-surface"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 font-bold text-background transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{loading ? "Connexion..." : "Se connecter"}</span>
              {!loading && <ArrowRightIcon />}
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              setMessage(
                "La récupération du mot de passe sera disponible prochainement."
              )
            }
            className="mt-5 w-full text-center text-sm font-medium text-muted transition hover:text-foreground"
          >
            Mot de passe oublié ?
          </button>

          {message && (
            <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-center text-sm leading-5 text-muted">
              {message}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="font-semibold text-foreground transition hover:text-accent"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}