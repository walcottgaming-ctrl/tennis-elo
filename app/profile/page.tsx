"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

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

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
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

    setMessage("Profil enregistré ✅");
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Chargement...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto max-w-lg pb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">
            👤 Mon compte
          </p>

          <h1 className="mt-1 text-3xl font-bold text-black">
            Mon profil
          </h1>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-black">
            Informations personnelles
          </h2>

          <form
            onSubmit={handleSave}
            className="mt-5 space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Adresse e-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                Prénom
              </label>

              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                placeholder="Ton prénom"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Nom
              </label>

              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                placeholder="Ton nom"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Nom d&apos;utilisateur
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Ton pseudo"
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="min-h-14 w-full rounded-xl bg-black px-5 py-4 font-bold text-white disabled:opacity-50"
            >
              {saving
                ? "Enregistrement..."
                : "Enregistrer mon profil"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-xl bg-gray-100 p-4 text-sm text-gray-700">
              {message}
            </p>
          )}
        </section>

        <Link
  href="/friends"
  className="mt-4 block min-h-14 rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-center font-bold text-black"
>
  🤝 Mes amis
</Link>

<Link
  href="/stats"
  className="mt-4 block min-h-14 rounded-xl bg-black px-5 py-4 text-center font-bold text-white"
>
  📊 Mes statistiques
</Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 min-h-14 w-full rounded-xl border-2 border-red-200 bg-white px-5 py-4 font-bold text-red-600"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
}