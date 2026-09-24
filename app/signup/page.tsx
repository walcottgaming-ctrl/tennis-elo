"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/src/supabase/client";

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

function UserIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
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
    <main className="relative min-h-screen overflow-hidden px-4 pb-10 pt-6 text-foreground sm:px-5">
      {/* BACKGROUND ATMOSPHERE */}

      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute left-[-18%] top-[-12%] h-120 w-120 rounded-full bg-accent/5.5 blur-[110px]" />
        <div className="absolute bottom-[-20%] right-[-12%] h-120 w-120 rounded-full bg-indigo-500/9 blur-[130px]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center">
        {/* BRAND */}

        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 w-fit">
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-[30px] bg-accent/8 blur-2xl"
                aria-hidden="true"
              />

              <div className="relative grid h-19 w-19 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.95)]">
                <Image
                  src="/icons/icon-192.png"
                  alt="SmashBreakPoint"
                  width={76}
                  height={76}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <p className="eyebrow">Bienvenue dans l&apos;arène</p>

          <h1 className="mt-2 font-display text-[30px] font-bold tracking-[-0.04em] sm:text-[32px]">
            SmashBreakPoint
          </h1>

          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted">
            Tes matchs. Tes stats. Tes défis.
          </p>
        </div>

        {/* AUTH CARD */}

        <section className="glass-strong rounded-[30px] p-4 sm:p-5">
          {/* AUTH SWITCH */}

          <div className="mb-7 grid grid-cols-2 rounded-2xl border border-white/8 bg-black/10 p-1">
            <Link
              href="/login"
              className="flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted transition-all duration-200 hover:bg-white/5 hover:text-foreground"
            >
              Connexion
            </Link>

            <div className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-[#0b0d13] shadow-[0_8px_24px_var(--accent-glow)]">
              Inscription
            </div>
          </div>

          {/* INTRO */}

          <div className="mb-7">
            <div className="flex items-center gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
                <UserIcon className="h-4.75 w-4.75" />
              </div>

              <div>
                <p className="font-display text-base font-bold tracking-tight">
                  Créer ton compte
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Rejoins la communauté SmashBreakPoint.
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="username" className="eyebrow block">
                Pseudo
              </label>

              <div className="relative mt-2">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoComplete="username"
                  placeholder="TonPseudo"
                  className="min-h-14 w-full rounded-2xl border border-white/8 bg-white/2.5 px-4 text-sm font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted-2 hover:border-white/12 focus:border-accent/50 focus:bg-white/4.5 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_7%,transparent)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="eyebrow block">
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
                className="mt-2 min-h-14 w-full rounded-2xl border border-white/8 bg-white/2.5 px-4 text-sm font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted-2 hover:border-white/12 focus:border-accent/50 focus:bg-white/4.5 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_7%,transparent)]"
              />
            </div>

            <div>
              <label htmlFor="password" className="eyebrow block">
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
                className="mt-2 min-h-14 w-full rounded-2xl border border-white/8 bg-white/2.5 px-4 text-sm font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted-2 hover:border-white/12 focus:border-accent/50 focus:bg-white/4.5 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_7%,transparent)]"
              />

              <p className="mt-2 px-1 text-[11px] leading-5 text-muted-2">
                Minimum 6 caractères.
              </p>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="group flex min-h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 font-bold text-[#0b0d13] shadow-[0_12px_34px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_16px_40px_var(--accent-glow)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>
                {loading ? "Création..." : "Créer mon compte"}
              </span>

              {!loading && (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0b0d13]/10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* MESSAGE */}

          {message && (
            <div className="mt-5 rounded-2xl border border-accent/15 bg-accent/4.5 px-4 py-3.5 text-center text-sm leading-5 text-muted">
              {message}
            </div>
          )}
        </section>

        {/* FOOTER */}

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-semibold text-foreground transition-colors duration-200 hover:text-accent"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}