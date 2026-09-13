"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/src/supabase/client";

export default function LoginPage() {
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
    } else {
      setMessage("Connexion réussie !");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#121212] px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        {/* LOGO */}
        <div className="text-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-[28px] bg-white shadow-lg">
            <img
              src="/icons/icon-192.png?v=2"
              alt="SmashBreakPoint"
              className="h-full w-full object-cover"
            />
          </div>

          <p className="mt-6 text-base font-medium text-gray-400">
            Trace tes matchs. Challenge tes amis.
          </p>
        </div>

        {/* TOGGLE */}
        <div className="mt-8 flex rounded-2xl bg-[#242424] p-1">
          <div className="flex flex-1 items-center justify-center rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-black">
            Connexion
          </div>

          <Link
            href="/signup"
            className="flex flex-1 items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold text-gray-400 transition hover:bg-[#303030] hover:text-white"
          >
            Inscription
          </Link>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-300"
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
              className="mt-2 min-h-14 w-full rounded-2xl border border-[#383838] bg-[#202020] px-4 text-base text-white outline-none placeholder:text-gray-600 transition focus:border-gray-500 focus:bg-[#242424]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-300"
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
              className="mt-2 min-h-14 w-full rounded-2xl border border-[#383838] bg-[#202020] px-4 text-base text-white outline-none placeholder:text-gray-600 transition focus:border-gray-500 focus:bg-[#242424]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-14 w-full rounded-2xl bg-white px-5 py-4 text-base font-bold text-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* MOT DE PASSE OUBLIÉ */}
        <button
          type="button"
          onClick={() =>
            setMessage(
              "La récupération du mot de passe sera disponible prochainement."
            )
          }
          className="mt-5 w-full text-center text-sm font-medium text-gray-400 transition hover:text-white"
        >
          Mot de passe oublié ?
        </button>

        {/* MESSAGE */}
        {message && (
          <div className="mt-6 rounded-2xl border border-[#333333] bg-[#1d1d1d] p-4 text-center text-sm text-gray-300">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}