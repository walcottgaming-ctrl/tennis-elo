"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";
import Image from "next/image";

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
      strokeWidth="2"
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

function LockIcon({
  className = "h-5 w-5",
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
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function AlertIcon({
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
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
    <main
      className="min-h-screen px-4 pb-10 pt-6 text-foreground sm:px-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 8% 5%, color-mix(in srgb, var(--accent) 13%, transparent) 0%, transparent 38%), radial-gradient(circle at 85% 90%, rgba(79,45,127,0.2) 0%, transparent 42%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-7 text-center">
          <div className="relative mx-auto mb-5 h-19 w-19">
            <div className="absolute -inset-4 rounded-full bg-accent/10 blur-2xl" />

            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
              <Image
                src="/icons/icon-192.png"
                alt="SmashBreakPoint"
                width={80}
                height={80}
                priority
                className="h-full w-full rounded-[19px] object-cover"
              />
            </div>
          </div>

          <p className="eyebrow">Espace joueur</p>

          <h1 className="mt-2 font-display text-[30px] font-bold tracking-[-0.04em] sm:text-3xl">
            SmashBreakPoint
          </h1>

          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted">
            Tes matchs. Ton classement. Tes adversaires.
          </p>
        </div>

        <section className="glass-strong rounded-[30px] p-3 sm:p-4">
          <div className="grid grid-cols-2 rounded-[20px] border border-white/8 bg-black/10 p-1">
            <div className="flex min-h-11 items-center justify-center rounded-[15px] bg-accent px-4 text-sm font-semibold text-[#0b0d13] shadow-[0_0_22px_var(--accent-glow)]">
              Connexion
            </div>

            <Link
              href="/signup"
              className="flex min-h-11 items-center justify-center rounded-[15px] px-4 text-sm font-semibold text-muted transition-all duration-200 hover:bg-white/5 hover:text-foreground"
            >
              Inscription
            </Link>
          </div>

          <div className="px-1 pb-1 pt-7 sm:px-2">
            <div className="mb-6 flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                <LockIcon className="h-4.75 w-4.75" />
              </div>

              <div>
                <p className="font-display text-[15px] font-semibold tracking-tight">
                  Bon retour
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Accède à ton espace personnel.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="eyebrow block"
                >
                  Adresse email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                  placeholder="toi@example.com"
                  className="mt-2 min-h-14 w-full rounded-2xl border border-white/8 bg-white/2.5 px-4 text-[15px] font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-accent/45 focus:bg-white/5 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_7%,transparent)]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="eyebrow block"
                  >
                    Mot de passe
                  </label>
                </div>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Ton mot de passe"
                  className="mt-2 min-h-14 w-full rounded-2xl border border-white/8 bg-white/2.5 px-4 text-[15px] font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-accent/45 focus:bg-white/5 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_7%,transparent)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex min-h-14 w-full items-center justify-between rounded-2xl bg-accent px-5 font-semibold text-[#0b0d13] shadow-[0_14px_34px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 hover:shadow-[0_16px_40px_var(--accent-glow)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {loading ? "Connexion..." : "Se connecter"}
                </span>

                {!loading && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() =>
                setMessage(
                  "La récupération du mot de passe sera disponible prochainement."
                )
              }
              className="mt-5 w-full text-center text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              Mot de passe oublié ?
            </button>

            {message && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3.5 text-left text-sm leading-5 text-muted"
              >
                <div className="mt-0.5 shrink-0 text-danger">
                  <AlertIcon />
                </div>

                <p>{message}</p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <span>Pas encore de compte ?</span>

          <Link
            href="/signup"
            className="font-semibold text-foreground transition-colors duration-200 hover:text-accent"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}