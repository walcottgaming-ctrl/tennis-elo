"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/src/supabase/client";
import Image from "next/image";

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
    <main className="min-h-screen bg-[#121212] px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        {/* LOGO */}
        <div className="text-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-[28px] bg-white shadow-lg">
            <Image
  src="/icons/icon-192.png"
  alt="SmashBreakPoint"
  width={112}
  height={112}
  className="h-full w-full object-cover"
/>
          </div>

          <p className="mt-6 text-base font-medium text-gray-400">
            Trace tes matchs. Challenge tes amis.
          </p>
        </div>

        {/* TOGGLE */}
        <div className="mt-8 flex rounded-2xl bg-[#242424] p-1">
          <Link
            href="/login"
            className="flex flex-1 items-center justify-center rounded-xl px-4 py-3.5 text-sm font-bold text-gray-400 transition hover:bg-[#303030] hover:text-white"
          >
            Connexion
          </Link>

          <div className="flex flex-1 items-center justify-center rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-black">
            Inscription
          </div>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-300"
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
              className="mt-2 min-h-14 w-full rounded-2xl border border-[#383838] bg-[#202020] px-4 text-base text-white outline-none placeholder:text-gray-600 transition focus:border-gray-500 focus:bg-[#242424]"
            />
          </div>

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
              minLength={6}
              autoComplete="new-password"
              placeholder="Au moins 6 caractères"
              className="mt-2 min-h-14 w-full rounded-2xl border border-[#383838] bg-[#202020] px-4 text-base text-white outline-none placeholder:text-gray-600 transition focus:border-gray-500 focus:bg-[#242424]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="min-h-14 w-full rounded-2xl bg-white px-5 py-4 text-base font-bold text-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Création..." : "S'inscrire"}
          </button>
        </form>

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