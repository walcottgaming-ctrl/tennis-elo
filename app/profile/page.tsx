"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.2-5.2 7-5.2s6.2 1.8 7 5.2" />
    </svg>
  );
}

function MailIcon({
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function FriendsIcon({
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
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3.1 2.4-4.8 5.5-4.8s4.9 1.7 5.5 4.8" />
      <path d="M16 6.5a3 3 0 0 1 0 5.8" />
      <path d="M17 14.5c2 .3 3.3 1.7 3.8 4" />
    </svg>
  );
}

function StatsIcon({
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
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19H2" />
    </svg>
  );
}

function LogoutIcon({
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
      <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
      <path d="m14 8 4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

function ChevronIcon({
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ArrowRightIcon({
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
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
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
  "min-h-14 w-full rounded-2xl border border-white/8 bg-white/4.5 px-4 text-sm font-medium text-foreground outline-none transition-all duration-200 focus:border-accent focus:bg-white/6";

const labelClassName =
  "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";

const inputClassName =
  "min-h-14 w-full rounded-2xl border border-white/8 bg-white/4.5 px-4 text-sm font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-white/6";

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
    <div className="group rounded-2xl border border-white/8 bg-white/3.5 p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-bold ${
          value && accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value || "Non renseigné"}
      </p>
    </div>
  );
}

function SectionHeader({
  index,
  eyebrow,
  title,
  description,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {index && (
          <span className="font-display text-[10px] font-bold tracking-[0.16em] text-accent">
            {index}
          </span>
        )}

        <p className="eyebrow">{eyebrow}</p>
      </div>

      <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-5 text-muted">
          {description}
        </p>
      )}
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
      <main
        className="min-h-screen px-5 py-6 text-foreground"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto max-w-lg">
          <div className="space-y-4">
            <div className="h-7 w-28 animate-pulse rounded-full bg-white/5" />
            <div className="h-12 w-56 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-52 animate-pulse rounded-[26px] bg-white/5" />
            <div className="h-80 animate-pulse rounded-[26px] bg-white/5" />
            <div className="h-130 animate-pulse rounded-[26px] bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (!currentUserId) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-5 text-foreground"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="w-full max-w-sm">
          <div className="glass-strong relative overflow-hidden rounded-[28px] p-6 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
                <UserIcon />
              </div>

              <p className="mt-5 text-sm font-medium leading-6 text-muted">
                Tu dois être connecté pour accéder à ton profil.
              </p>

              <Link
                href="/login"
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 text-sm font-bold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    [firstName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    username ||
    "Joueur";

  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((value) => value.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "J";

  return (
    <main
      className="min-h-screen px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-lg">
        <header className="mb-6">
          <p className="eyebrow">Mon compte</p>

          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Mon profil
              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                Ton identité et ton profil de joueur.
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-accent/15 bg-accent/5 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                Joueur
              </span>
            </div>
          </div>
        </header>

        <form
          onSubmit={handleSave}
          className="space-y-4"
        >
          <section className="glass-strong relative overflow-hidden rounded-[28px] p-5">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-white/3 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-[0_20px_50px_-22px_rgba(0,0,0,0.95)]">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Photo de profil"
                      width={96}
                      height={96}
                      loading="eager"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-2xl font-bold text-muted">
                      {initials}
                    </span>
                  )}

                  <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="eyebrow">Identité</p>

                  <h2 className="mt-1 truncate font-display text-xl font-bold tracking-tight">
                    {fullName}
                  </h2>

                  <p className="mt-1 truncate text-xs text-muted">
                    {username ? `@${username}` : email}
                  </p>

                  <label
                    htmlFor="avatar"
                    className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl bg-accent px-4 text-[11px] font-bold text-[#0b0d13] shadow-[0_8px_24px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
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
                </div>
              </div>

              <div className="mt-5 border-t border-white/6 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted">
                      {email}
                    </p>

                    <p className="mt-1 text-[10px] text-muted-2">
                      JPG, PNG ou WebP · 5 Mo maximum
                    </p>
                  </div>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleAvatarDelete}
                      disabled={uploadingAvatar}
                      className="shrink-0 rounded-xl border border-danger/15 bg-danger/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-[26px] p-5">
            <SectionHeader
              index="01"
              eyebrow="Informations"
              title="Profil personnel"
            />

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
                    <MailIcon className="h-4.5 w-4.5" />
                  </div>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="min-h-14 w-full rounded-2xl border border-white/8 bg-white/3.5 pl-12 pr-4 text-sm font-medium text-muted outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    className={inputClassName}
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
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className={labelClassName}
                >
                  Nom d&apos;utilisateur
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-sm font-bold text-muted">
                    @
                  </span>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    placeholder="Ton pseudo"
                    className={`${inputClassName} pl-9`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="glass-strong rounded-[26px] p-5">
            <SectionHeader
              index="02"
              eyebrow="Joueur"
              title="Profil sportif"
              description="Les caractéristiques qui définissent ton jeu."
            />

            <div className="mb-7">
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  ADN du joueur
                </p>

                <p className="mt-1 text-sm text-muted">
                  Ton identité sur le court.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
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
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
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

            <div className="border-t border-white/8 pt-6">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Morphologie
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Tes caractéristiques physiques et préférences de base.
                </p>
              </div>

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
                    <option value="">Non renseignée</option>
                    <option value="right">Droitier</option>
                    <option value="left">Gaucher</option>
                    <option value="ambidextrous">Ambidextre</option>
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
                    <option value="">Non renseigné</option>
                    <option value="one_hand">Une main</option>
                    <option value="two_hands">Deux mains</option>
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
                      setPreferredSurface(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">Non renseignée</option>
                    <option value="clay">Terre battue</option>
                    <option value="hard">Dur</option>
                    <option value="indoor">Indoor</option>
                    <option value="grass">Gazon</option>
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
                        className={`${inputClassName} pr-12`}
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
                        className={`${inputClassName} pr-12`}
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                        kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-white/8 pt-6">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  ADN du joueur
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  La manière dont tu construis et joues tes points.
                </p>
              </div>

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
                    <option value="">Non renseigné</option>
                    <option value="attacker">Attaquant</option>
                    <option value="defender">Défenseur</option>
                    <option value="all_rounder">Polyvalent</option>
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
                    <option value="">Non renseignée</option>
                    <option value="baseline">Fond de court</option>
                    <option value="all_court">Tout le court</option>
                    <option value="net">Filet</option>
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
                      className={selectClassName}
                    >
                      <option value="">Non renseigné</option>
                      <option value="serve">Service</option>
                      <option value="forehand">Coup droit</option>
                      <option value="backhand">Revers</option>
                      <option value="return">Retour</option>
                      <option value="volley">Volée</option>
                      <option value="movement">Déplacement</option>
                      <option value="mental">Mental</option>
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
                      className={selectClassName}
                    >
                      <option value="">Non renseigné</option>
                      <option value="serve">Service</option>
                      <option value="forehand">Coup droit</option>
                      <option value="backhand">Revers</option>
                      <option value="return">Retour</option>
                      <option value="volley">Volée</option>
                      <option value="movement">Déplacement</option>
                      <option value="mental">Mental</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-white/8 pt-6">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Technique
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Tes préférences et habitudes techniques.
                </p>
              </div>

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
                    <option value="">Non renseigné</option>
                    <option value="flat">À plat</option>
                    <option value="topspin">Lifté</option>
                    <option value="heavy_topspin">Très lifté</option>
                    <option value="varied">Varié</option>
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
                      setBackhandPreference(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">Non renseigné</option>
                    <option value="flat">À plat</option>
                    <option value="topspin">Lifté</option>
                    <option value="varied">Varié</option>
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
                      setDownTheLineStyle(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">Non renseigné</option>
                    <option value="occasional">Occasionnel</option>
                    <option value="regular">Régulier</option>
                    <option value="weapon">Arme principale</option>
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
                      setCrossCourtStyle(event.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="">Non renseigné</option>
                    <option value="defensive">Défensif</option>
                    <option value="regular">Régulier</option>
                    <option value="offensive">Offensif</option>
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
                    <option value="">Non renseigné</option>
                    <option value="weak">Faible</option>
                    <option value="average">Correct</option>
                    <option value="good">Bon</option>
                    <option value="weapon">Arme principale</option>
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
                    <option value="">Non renseigné</option>
                    <option value="placement">Placement</option>
                    <option value="power">Puissance</option>
                    <option value="variation">Variation</option>
                    <option value="kick">Kick / lift</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {message && (
            <div className="glass-strong relative overflow-hidden rounded-[22px] border-accent/15 bg-accent/5 p-4">
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />

              <div className="relative flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />

                <p className="text-sm font-medium leading-5 text-accent">
                  {message}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="group min-h-16 w-full rounded-[22px] bg-accent px-5 text-left text-[#0b0d13] shadow-[0_14px_36px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-bold">
                  {saving
                    ? "Enregistrement..."
                    : "Enregistrer mon profil"}
                </span>

                <span className="mt-1 block text-xs font-medium opacity-65">
                  Informations personnelles et profil joueur
                </span>
              </span>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0d13]/10 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRightIcon />
              </span>
            </span>
          </button>
        </form>

        <section className="mt-8">
          <div className="mb-3">
            <p className="eyebrow">Mon espace</p>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/friends"
              className="glass group flex min-h-16 items-center justify-between rounded-[22px] px-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/6 bg-white/5 text-muted transition-colors duration-200 group-hover:border-accent/10 group-hover:bg-accent/10 group-hover:text-accent">
                  <FriendsIcon />
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    Mes amis
                  </span>

                  <span className="mt-0.5 block truncate text-xs text-muted">
                    Gérer mes amis et mes contacts
                  </span>
                </span>
              </span>

              <span className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground">
                <ChevronIcon />
              </span>
            </Link>

            <Link
              href="/stats"
              className="glass group flex min-h-16 items-center justify-between rounded-[22px] px-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/6 bg-white/5 text-muted transition-colors duration-200 group-hover:border-accent/10 group-hover:bg-accent/10 group-hover:text-accent">
                  <StatsIcon />
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    Mes statistiques
                  </span>

                  <span className="mt-0.5 block truncate text-xs text-muted">
                    Voir mes performances et mes résultats
                  </span>
                </span>
              </span>

              <span className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground">
                <ChevronIcon />
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-5">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-[22px] border border-danger/15 bg-danger/5 px-5 text-sm font-bold text-danger transition-all duration-200 hover:border-danger/25 hover:bg-danger/10 active:scale-[0.99]"
          >
            <LogoutIcon className="h-4.5 w-4.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Se déconnecter
          </button>
        </section>
      </div>
    </main>
  );
}