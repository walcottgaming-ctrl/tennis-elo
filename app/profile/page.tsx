"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

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

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="m9 18 6-6-6-6" />
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

  forehand_style: string | null;
  backhand_preference: string | null;
  down_the_line_style: string | null;
  cross_court_style: string | null;
  volley_level: string | null;
  serve_style: string | null;
  court_position: string | null;
  player_strength: string | null;
  player_weakness: string | null;
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_SIGNED_URL_EXPIRY = 60 * 60;

const selectClassName =
  "min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent";

const labelClassName =
  "mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted";

const displayValues: Record<string, string> = {
  right: "Droitier",
  left: "Gaucher",
  ambidextrous: "Ambidextre",

  attacker: "Attaquant",
  defender: "Défenseur",
  all_rounder: "Polyvalent",
  serve_volley: "Serveur-volée",

  one_hand: "Une main",
  two_hands: "Deux mains",

  clay: "Terre battue",
  hard: "Dur",
  indoor: "Indoor",
  grass: "Gazon",

  baseline: "Fond de court",
  all_court: "Tout le court",
  net: "Filet",

  serve: "Service",
  forehand: "Coup droit",
  backhand: "Revers",
  return: "Retour",
  volley: "Volée",
  movement: "Déplacement",
  mental: "Mental",

  flat: "À plat",
  topspin: "Lifté",
  heavy_topspin: "Très lifté",
  varied: "Varié",

  occasional: "Occasionnel",
  regular: "Régulier",
  weapon: "Arme principale",

  defensive: "Défensif",
  offensive: "Offensif",

  weak: "Faible",
  average: "Correct",
  good: "Bon",

  placement: "Placement",
  power: "Puissance",
  variation: "Variation",
  kick: "Kick / lift",
};

function formatValue(value: string) {
  return displayValues[value] ?? value;
}

function CharacteristicCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm font-bold ${
          value && accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value || "Non renseigné"}
      </p>
    </div>
  );
}

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

  const [forehandStyle, setForehandStyle] = useState("");
  const [backhandPreference, setBackhandPreference] = useState("");
  const [downTheLineStyle, setDownTheLineStyle] = useState("");
  const [crossCourtStyle, setCrossCourtStyle] = useState("");
  const [volleyLevel, setVolleyLevel] = useState("");
  const [serveStyle, setServeStyle] = useState("");
  const [courtPosition, setCourtPosition] = useState("");
  const [playerStrength, setPlayerStrength] = useState("");
  const [playerWeakness, setPlayerWeakness] = useState("");

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
          `
            first_name,
            last_name,
            username,
            avatar_url,
            dominant_hand,
            playing_style,
            backhand_style,
            preferred_surface,
            height_cm,
            weight_kg,
            forehand_style,
            backhand_preference,
            down_the_line_style,
            cross_court_style,
            volley_level,
            serve_style,
            court_position,
            player_strength,
            player_weakness
          `
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
        }

        setDominantHand(typedProfile.dominant_hand ?? "");
        setPlayingStyle(typedProfile.playing_style ?? "");
        setBackhandStyle(typedProfile.backhand_style ?? "");
        setPreferredSurface(
          typedProfile.preferred_surface ?? ""
        );

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

        setForehandStyle(
          typedProfile.forehand_style ?? ""
        );

        setBackhandPreference(
          typedProfile.backhand_preference ?? ""
        );

        setDownTheLineStyle(
          typedProfile.down_the_line_style ?? ""
        );

        setCrossCourtStyle(
          typedProfile.cross_court_style ?? ""
        );

        setVolleyLevel(
          typedProfile.volley_level ?? ""
        );

        setServeStyle(
          typedProfile.serve_style ?? ""
        );

        setCourtPosition(
          typedProfile.court_position ?? ""
        );

        setPlayerStrength(
          typedProfile.player_strength ?? ""
        );

        setPlayerWeakness(
          typedProfile.player_weakness ?? ""
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

    const filePath =
      `${currentUserId}/avatar-${Date.now()}.${extension}`;

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
      await supabase.storage
        .from("avatars")
        .remove([filePath]);

      setMessage(
        `Impossible de sauvegarder la photo : ${updateError.message}`
      );
      setUploadingAvatar(false);
      event.target.value = "";
      return;
    }

    const { data: signedUrlData } = await supabase.storage
      .from("avatars")
      .createSignedUrl(
        filePath,
        AVATAR_SIGNED_URL_EXPIRY
      );

    if (!signedUrlData?.signedUrl) {
      setMessage(
        "La photo est enregistrée, mais son affichage est impossible pour le moment."
      );
      setUploadingAvatar(false);
      event.target.value = "";
      return;
    }

    if (avatarPath && avatarPath !== filePath) {
      await supabase.storage
        .from("avatars")
        .remove([avatarPath]);
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
      setMessage(
        "La taille et le poids doivent être des nombres."
      );
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

        forehand_style: forehandStyle || null,
        backhand_preference: backhandPreference || null,
        down_the_line_style: downTheLineStyle || null,
        cross_court_style: crossCourtStyle || null,
        volley_level: volleyLevel || null,
        serve_style: serveStyle || null,
        court_position: courtPosition || null,
        player_strength: playerStrength || null,
        player_weakness: playerWeakness || null,
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
      <div className="mx-auto max-w-lg">
        <header className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Mon compte
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Mon profil
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Ton identité et ton profil de joueur.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          className="space-y-5"
        >
          {/* PHOTO */}
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

          {/* INFORMATIONS */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                01 · Informations
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Profil personnel
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className={labelClassName}
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
              </div>

              <div>
                <label
                  htmlFor="firstName"
                  className={labelClassName}
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
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className={labelClassName}
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
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className={labelClassName}
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
                  className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
              </div>
            </div>
          </section>

          {/* PROFIL SPORTIF */}
          <section className="rounded-3xl border border-border bg-surface p-5">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                02 · Joueur
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight">
                Profil sportif
              </h2>

              <p className="mt-2 text-sm leading-5 text-muted">
                Les caractéristiques qui définissent ton jeu.
              </p>
            </div>

            {/* FICHE JOUEUR */}
            <div className="mb-7">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    ADN du joueur
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    Ton identité sur le court.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CharacteristicCard
                  label="Main dominante"
                  value={formatValue(dominantHand)}
                  accent
                />

                <CharacteristicCard
                  label="Revers"
                  value={formatValue(backhandStyle)}
                  accent
                />

                <CharacteristicCard
                  label="Style"
                  value={formatValue(playingStyle)}
                  accent
                />

                <CharacteristicCard
                  label="Zone préférée"
                  value={formatValue(courtPosition)}
                  accent
                />

                <CharacteristicCard
                  label="Surface"
                  value={formatValue(preferredSurface)}
                />

                <CharacteristicCard
                  label="Point fort"
                  value={formatValue(playerStrength)}
                  accent
                />
              </div>

              {(playerWeakness || heightCm || weightKg) && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <CharacteristicCard
                    label="Point à améliorer"
                    value={formatValue(playerWeakness)}
                  />

                  <CharacteristicCard
                    label="Morphologie"
                    value={
                      heightCm && weightKg
                        ? `${heightCm} cm · ${weightKg} kg`
                        : heightCm
                          ? `${heightCm} cm`
                          : weightKg
                            ? `${weightKg} kg`
                            : ""
                    }
                  />
                </div>
              )}
            </div>

            {/* MORPHOLOGIE */}
            <div className="border-t border-border pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Morphologie
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="dominantHand"
                    className={labelClassName}
                  >
                    Main dominante
                  </label>

                  <select
                    id="dominantHand"
                    value={dominantHand}
                    onChange={(event) =>
                      setDominantHand(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseignée
                    </option>
                    <option value="right">
                      Droitier
                    </option>
                    <option value="left">
                      Gaucher
                    </option>
                    <option value="ambidextrous">
                      Ambidextre
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="backhandStyle"
                    className={labelClassName}
                  >
                    Revers
                  </label>

                  <select
                    id="backhandStyle"
                    value={backhandStyle}
                    onChange={(event) =>
                      setBackhandStyle(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="one_hand">
                      Une main
                    </option>
                    <option value="two_hands">
                      Deux mains
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="preferredSurface"
                    className={labelClassName}
                  >
                    Surface préférée
                  </label>

                  <select
                    id="preferredSurface"
                    value={preferredSurface}
                    onChange={(event) =>
                      setPreferredSurface(
                        event.target.value
                      )
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseignée
                    </option>
                    <option value="clay">
                      Terre battue
                    </option>
                    <option value="hard">
                      Dur
                    </option>
                    <option value="indoor">
                      Indoor
                    </option>
                    <option value="grass">
                      Gazon
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="heightCm"
                      className={labelClassName}
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
                      className={labelClassName}
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
            </div>

            {/* ADN */}
            <div className="mt-7 border-t border-border pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                ADN du joueur
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="playingStyle"
                    className={labelClassName}
                  >
                    Style général
                  </label>

                  <select
                    id="playingStyle"
                    value={playingStyle}
                    onChange={(event) =>
                      setPlayingStyle(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="attacker">
                      Attaquant
                    </option>
                    <option value="defender">
                      Défenseur
                    </option>
                    <option value="all_rounder">
                      Polyvalent
                    </option>
                    <option value="serve_volley">
                      Serveur-volée
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="courtPosition"
                    className={labelClassName}
                  >
                    Zone préférée
                  </label>

                  <select
                    id="courtPosition"
                    value={courtPosition}
                    onChange={(event) =>
                      setCourtPosition(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseignée
                    </option>
                    <option value="baseline">
                      Fond de court
                    </option>
                    <option value="all_court">
                      Tout le court
                    </option>
                    <option value="net">
                      Filet
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="playerStrength"
                      className={labelClassName}
                    >
                      Point fort
                    </label>

                    <select
                      id="playerStrength"
                      value={playerStrength}
                      onChange={(event) =>
                        setPlayerStrength(event.target.value)
                      }
                      className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent"
                    >
                      <option value="">
                        Non renseigné
                      </option>
                      <option value="serve">
                        Service
                      </option>
                      <option value="forehand">
                        Coup droit
                      </option>
                      <option value="backhand">
                        Revers
                      </option>
                      <option value="return">
                        Retour
                      </option>
                      <option value="volley">
                        Volée
                      </option>
                      <option value="movement">
                        Déplacement
                      </option>
                      <option value="mental">
                        Mental
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="playerWeakness"
                      className={labelClassName}
                    >
                      Point faible
                    </label>

                    <select
                      id="playerWeakness"
                      value={playerWeakness}
                      onChange={(event) =>
                        setPlayerWeakness(event.target.value)
                      }
                      className="min-h-14 w-full rounded-2xl border border-border bg-surface-2 px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent"
                    >
                      <option value="">
                        Non renseigné
                      </option>
                      <option value="serve">
                        Service
                      </option>
                      <option value="forehand">
                        Coup droit
                      </option>
                      <option value="backhand">
                        Revers
                      </option>
                      <option value="return">
                        Retour
                      </option>
                      <option value="volley">
                        Volée
                      </option>
                      <option value="movement">
                        Déplacement
                      </option>
                      <option value="mental">
                        Mental
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* TECHNIQUE */}
            <div className="mt-7 border-t border-border pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                Technique
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="forehandStyle"
                    className={labelClassName}
                  >
                    Coup droit
                  </label>

                  <select
                    id="forehandStyle"
                    value={forehandStyle}
                    onChange={(event) =>
                      setForehandStyle(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="flat">
                      À plat
                    </option>
                    <option value="topspin">
                      Lifté
                    </option>
                    <option value="heavy_topspin">
                      Très lifté
                    </option>
                    <option value="varied">
                      Varié
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="backhandPreference"
                    className={labelClassName}
                  >
                    Style de revers
                  </label>

                  <select
                    id="backhandPreference"
                    value={backhandPreference}
                    onChange={(event) =>
                      setBackhandPreference(
                        event.target.value
                      )
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="flat">
                      À plat
                    </option>
                    <option value="topspin">
                      Lifté
                    </option>
                    <option value="varied">
                      Varié
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="downTheLineStyle"
                    className={labelClassName}
                  >
                    Jeu long de ligne
                  </label>

                  <select
                    id="downTheLineStyle"
                    value={downTheLineStyle}
                    onChange={(event) =>
                      setDownTheLineStyle(
                        event.target.value
                      )
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="occasional">
                      Occasionnel
                    </option>
                    <option value="regular">
                      Régulier
                    </option>
                    <option value="weapon">
                      Arme principale
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="crossCourtStyle"
                    className={labelClassName}
                  >
                    Jeu croisé
                  </label>

                  <select
                    id="crossCourtStyle"
                    value={crossCourtStyle}
                    onChange={(event) =>
                      setCrossCourtStyle(
                        event.target.value
                      )
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="defensive">
                      Défensif
                    </option>
                    <option value="regular">
                      Régulier
                    </option>
                    <option value="offensive">
                      Offensif
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="volleyLevel"
                    className={labelClassName}
                  >
                    Niveau à la volée
                  </label>

                  <select
                    id="volleyLevel"
                    value={volleyLevel}
                    onChange={(event) =>
                      setVolleyLevel(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="weak">
                      Faible
                    </option>
                    <option value="average">
                      Correct
                    </option>
                    <option value="good">
                      Bon
                    </option>
                    <option value="weapon">
                      Arme principale
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="serveStyle"
                    className={labelClassName}
                  >
                    Style de service
                  </label>

                  <select
                    id="serveStyle"
                    value={serveStyle}
                    onChange={(event) =>
                      setServeStyle(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">
                      Non renseigné
                    </option>
                    <option value="placement">
                      Placement
                    </option>
                    <option value="power">
                      Puissance
                    </option>
                    <option value="variation">
                      Variation
                    </option>
                    <option value="kick">
                      Kick / lift
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* MESSAGE */}
          {message && (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <p className="text-sm font-medium text-accent">
                {message}
              </p>
            </div>
          )}

          {/* SAVE */}
          <button
            type="submit"
            disabled={saving}
            className="min-h-16 w-full rounded-2xl bg-accent px-5 text-left text-background transition-opacity hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-bold">
                  {saving
                    ? "Enregistrement..."
                    : "Enregistrer mon profil"}
                </span>

                <span className="mt-1 block text-xs font-medium opacity-70">
                  Informations personnelles et profil joueur
                </span>
              </span>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/10 text-lg">
                →
              </span>
            </span>
          </button>
        </form>

        {/* MON ESPACE */}
        <section className="mt-7">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Mon espace
          </p>

          <div className="space-y-3">
            <Link
              href="/friends"
              className="group flex min-h-16 items-center justify-between rounded-2xl border border-border bg-surface px-4 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted group-hover:bg-accent/10 group-hover:text-accent">
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

              <span className="text-muted transition-transform group-hover:translate-x-0.5">
                <ChevronIcon />
              </span>
            </Link>

            <Link
              href="/stats"
              className="group flex min-h-16 items-center justify-between rounded-2xl border border-border bg-surface px-4 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted group-hover:bg-accent/10 group-hover:text-accent">
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

              <span className="text-muted transition-transform group-hover:translate-x-0.5">
                <ChevronIcon />
              </span>
            </Link>
          </div>
        </section>

        {/* LOGOUT */}
        <section className="mt-5">
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