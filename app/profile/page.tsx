"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";
import Image from "next/image";

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

type ProfileData = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  dominant_hand: string | null;
  playing_style: string | null;
  backhand_style: string | null;
  preferred_surface: string | null;
  height_cm: number | null;
  weight_kg: number | null;
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_SIGNED_URL_EXPIRY = 60 * 60;

export default function ProfilePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [dominantHand, setDominantHand] = useState("");
  const [playingStyle, setPlayingStyle] = useState("");
  const [backhandStyle, setBackhandStyle] = useState("");
  const [preferredSurface, setPreferredSurface] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [currentUserId, setCurrentUserId] = useState("");

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

      setCurrentUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "first_name, last_name, username, avatar_url, dominant_hand, playing_style, backhand_style, preferred_surface, height_cm, weight_kg"
        )
        .eq("id", user.id)
        .single();

      if (profile) {
        const typedProfile = profile as ProfileData;

        setFirstName(typedProfile.first_name ?? "");
        setLastName(typedProfile.last_name ?? "");
        setUsername(typedProfile.username ?? "");

        const storedAvatarPath = typedProfile.avatar_url ?? null;
        setAvatarPath(storedAvatarPath);

        if (storedAvatarPath) {
          const { data: signedUrlData } = await supabase.storage
            .from("avatars")
            .createSignedUrl(
              storedAvatarPath,
              AVATAR_SIGNED_URL_EXPIRY
            );

          setAvatarUrl(signedUrlData?.signedUrl ?? null);
        } else {
          setAvatarUrl(null);
        }

        setDominantHand(typedProfile.dominant_hand ?? "");
        setPlayingStyle(typedProfile.playing_style ?? "");
        setBackhandStyle(typedProfile.backhand_style ?? "");
        setPreferredSurface(typedProfile.preferred_surface ?? "");

        setHeightCm(
          typedProfile.height_cm !== null
            ? String(typedProfile.height_cm)
            : ""
        );

        setWeightKg(
          typedProfile.weight_kg !== null
            ? String(typedProfile.weight_kg)
            : ""
        );
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleAvatarUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !currentUserId) {
      return;
    }

    setMessage("");

    if (!file.type.startsWith("image/")) {
      setMessage("Le fichier doit être une image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setMessage("La photo ne doit pas dépasser 5 Mo.");
      event.target.value = "";
      return;
    }

    setUploadingAvatar(true);

    const supabase = createClient();

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${currentUserId}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setMessage(
        `Impossible d'envoyer la photo : ${uploadError.message}`
      );
      setUploadingAvatar(false);
      event.target.value = "";
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: filePath,
      })
      .eq("id", currentUserId);

    if (updateError) {
      await supabase.storage.from("avatars").remove([filePath]);

      setMessage(
        `Impossible de sauvegarder la photo : ${updateError.message}`
      );
      setUploadingAvatar(false);
      event.target.value = "";
      return;
    }

    const { data: signedUrlData } = await supabase.storage
      .from("avatars")
      .createSignedUrl(filePath, AVATAR_SIGNED_URL_EXPIRY);

    if (!signedUrlData?.signedUrl) {
      setMessage(
        "La photo a été enregistrée, mais son affichage est impossible pour le moment."
      );
      setUploadingAvatar(false);
      event.target.value = "";
      return;
    }

    if (avatarPath && avatarPath !== filePath) {
      await supabase.storage.from("avatars").remove([avatarPath]);
    }

    setAvatarPath(filePath);
    setAvatarUrl(signedUrlData.signedUrl);
    setMessage("Photo de profil mise à jour.");
    setUploadingAvatar(false);
    event.target.value = "";
  }

  async function handleAvatarDelete() {
    if (!currentUserId || !avatarPath) {
      return;
    }

    setUploadingAvatar(true);
    setMessage("");

    const supabase = createClient();

    const { error: removeError } = await supabase.storage
      .from("avatars")
      .remove([avatarPath]);

    if (removeError) {
      setMessage(
        `Impossible de supprimer la photo : ${removeError.message}`
      );
      setUploadingAvatar(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
      })
      .eq("id", currentUserId);

    if (updateError) {
      setMessage(
        `Impossible de mettre à jour le profil : ${updateError.message}`
      );
      setUploadingAvatar(false);
      return;
    }

    setAvatarPath(null);
    setAvatarUrl(null);
    setMessage("Photo de profil supprimée.");
    setUploadingAvatar(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const height = heightCm.trim()
      ? Number.parseInt(heightCm, 10)
      : null;

    const weight = weightKg.trim()
      ? Number.parseInt(weightKg, 10)
      : null;

    if (
      (height !== null && Number.isNaN(height)) ||
      (weight !== null && Number.isNaN(weight))
    ) {
      setMessage("La taille et le poids doivent être des nombres.");
      setSaving(false);
      return;
    }

    if (
      (height !== null && (height < 120 || height > 230)) ||
      (weight !== null && (weight < 30 || weight > 200))
    ) {
      setMessage("Vérifie la taille et le poids renseignés.");
      setSaving(false);
      return;
    }

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
        dominant_hand: dominantHand || null,
        playing_style: playingStyle || null,
        backhand_style: backhandStyle || null,
        preferred_surface: preferredSurface || null,
        height_cm: height,
        weight_kg: weight,
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

  if (!currentUserId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <div className="text-center">
          <p className="text-sm font-medium text-muted">
            Tu dois être connecté pour accéder à ton profil.
          </p>

          <Link
            href="/login"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-background"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-7 pb-28 text-foreground">
      <div className="mx-auto max-w-lg pb-8">
        <header className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Mon compte
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Mon profil
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Gère tes informations personnelles et ton profil joueur.
          </p>
        </header>

        <section className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <UserIcon />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                Identité
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Photo de profil
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 text-muted">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Photo de profil"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="avatar"
                className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-accent px-4 text-sm font-bold text-background transition-opacity hover:opacity-90"
              >
                {uploadingAvatar
                  ? "Traitement..."
                  : avatarUrl
                    ? "Modifier la photo"
                    : "Ajouter une photo"}
              </label>

              <input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  disabled={uploadingAvatar}
                  className="mt-2 min-h-10 w-full rounded-2xl border border-danger/20 bg-danger/5 px-4 text-xs font-bold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Supprimer la photo
                </button>
              )}

              <p className="mt-2 text-xs leading-5 text-muted">
                JPG, PNG ou WebP · 5 Mo maximum
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-border bg-surface p-5">
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

            <div className="border-t border-border pt-5">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Profil joueur
                </p>

                <p className="mt-1 text-sm leading-5 text-muted">
                  Ces informations permettent de mieux présenter ton
                  profil sportif.
                </p>
              </div>

              <div>
                <label
                  htmlFor="dominantHand"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
                >
                  Main dominante
                </label>

                <select
                  id="dominantHand"
                  value={dominantHand}
                  onChange={(event) =>
                    setDominantHand(event.target.value)
                  }
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent"
                >
                  <option value="">Non renseignée</option>
                  <option value="right">Droitier</option>
                  <option value="left">Gaucher</option>
                  <option value="ambidextrous">Ambidextre</option>
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="playingStyle"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
                >
                  Style de jeu
                </label>

                <select
                  id="playingStyle"
                  value={playingStyle}
                  onChange={(event) =>
                    setPlayingStyle(event.target.value)
                  }
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent"
                >
                  <option value="">Non renseigné</option>
                  <option value="attacker">Attaquant</option>
                  <option value="defender">Défenseur</option>
                  <option value="all_rounder">Polyvalent</option>
                  <option value="serve_volley">Serveur-volée</option>
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="backhandStyle"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
                >
                  Revers
                </label>

                <select
                  id="backhandStyle"
                  value={backhandStyle}
                  onChange={(event) =>
                    setBackhandStyle(event.target.value)
                  }
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent"
                >
                  <option value="">Non renseigné</option>
                  <option value="one_hand">Une main</option>
                  <option value="two_hands">Deux mains</option>
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="preferredSurface"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
                >
                  Surface préférée
                </label>

                <select
                  id="preferredSurface"
                  value={preferredSurface}
                  onChange={(event) =>
                    setPreferredSurface(event.target.value)
                  }
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent"
                >
                  <option value="">Non renseignée</option>
                  <option value="hard">Dur</option>
                  <option value="clay">Terre battue</option>
                  <option value="indoor">Indoor</option>
                  <option value="grass">Gazon</option>
                </select>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="heightCm"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
                  >
                    Taille
                  </label>

                  <div className="relative">
                    <input
                      id="heightCm"
                      type="number"
                      min="120"
                      max="230"
                      value={heightCm}
                      onChange={(event) =>
                        setHeightCm(event.target.value)
                      }
                      placeholder="180"
                      className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 pr-12 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="weightKg"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
                  >
                    Poids
                  </label>

                  <div className="relative">
                    <input
                      id="weightKg"
                      type="number"
                      min="30"
                      max="200"
                      value={weightKg}
                      onChange={(event) =>
                        setWeightKg(event.target.value)
                      }
                      placeholder="75"
                      className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 pr-12 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                      kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

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