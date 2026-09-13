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
      className="h-5 w-5"
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
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col justify-center pb-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <TrophyIcon />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Bienvenue
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            SmashBreakPoint
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
            Suis tes matchs, tes performances et ton classement tennis & padel.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-5">
            <p className="text-lg font-bold">
              Bienvenue sur SmashBreakPoint
            </p>

            <p className="mt-1 text-sm leading-5 text-muted">
              Connecte-toi pour retrouver ton espace personnel ou crée ton
              compte pour commencer.
            </p>
          </div>

          <div className="grid gap-3">
            <Link
              href="/login"
              className="flex min-h-14 items-center justify-between rounded-2xl bg-accent px-5 font-bold text-background transition active:scale-[0.99]"
            >
              <span>Se connecter</span>
              <ArrowRightIcon />
            </Link>

            <Link
              href="/signup"
              className="flex min-h-14 items-center justify-between rounded-2xl border border-border bg-surface-2 px-5 font-bold text-foreground transition hover:border-accent/40 active:scale-[0.99]"
            >
              <span>Créer un compte</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Ton espace personnel pour suivre tes matchs et tes performances.
        </p>
      </div>
    </main>
  );
}