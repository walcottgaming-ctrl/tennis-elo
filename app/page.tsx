import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../src/supabase/server";

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

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v2a4 4 0 0 0 4 4" />
      <path d="M17 6h3v2a4 4 0 0 1-4 4" />
    </svg>
  );
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center">
        {/* Logo / identité */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-[0_0_35px_rgba(0,255,140,0.08)]">
            <TrophyIcon />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            SmashBreakPoint
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Suis tes matchs, ta progression et ton classement.
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-muted">
            <span>Tennis</span>
            <span className="opacity-40">•</span>
            <span>Padel</span>
            <span className="opacity-40">•</span>
            <span>Super Tie-Break</span>
          </div>
        </div>

        {/* Actions principales */}
        <div className="space-y-3">
          <Link
            href="/signup"
            className="flex min-h-14 items-center justify-between rounded-2xl bg-accent px-5 font-bold text-background transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
          >
            <span>Créer un compte</span>
            <ArrowRightIcon />
          </Link>

          <Link
            href="/login"
            className="flex min-h-14 items-center justify-between rounded-2xl border border-border bg-surface px-5 font-bold text-foreground transition-all duration-200 hover:border-accent/40 active:scale-[0.99]"
          >
            <span>Se connecter</span>
            <ArrowRightIcon />
          </Link>
        </div>

        {/* Séparation */}
        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />

          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            ou
          </span>

          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Mode démo */}
        <div className="rounded-3xl border border-accent/15 bg-surface p-5">
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(0,255,140,0.7)]" />

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Mode démo
              </p>
            </div>

            <p className="text-base font-bold">
              Découvre l&apos;application sans créer de compte.
            </p>

            <p className="mt-1.5 text-sm leading-5 text-muted">
              Explore le dashboard, les classements et les fonctionnalités
              avec des données fictives.
            </p>
          </div>

          <Link
            href="/dashboard?demo=true"
            className="flex min-h-12 items-center justify-between rounded-2xl border border-accent/25 bg-accent/5 px-4 font-semibold text-accent transition-all duration-200 hover:border-accent/50 hover:bg-accent/10 active:scale-[0.99]"
          >
            <span>Voir l&apos;app en mode démo</span>
            <ArrowRightIcon />
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] leading-5 text-muted">
          Les données affichées en mode démo sont fictives.
        </p>
      </div>
    </main>
  );
}