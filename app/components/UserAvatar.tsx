"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/src/supabase/client";

type UserAvatarProps = {
  avatarPath: string | null;
  name: string;
  size?: number;
  className?: string;
};

function getInitials(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "?";
  }

  const parts = trimmedName.split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return trimmedName.substring(0, 2).toUpperCase();
}

export default function UserAvatar({
  avatarPath,
  name,
  size = 44,
  className = "",
}: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAvatar() {
      if (!avatarPath) {
        setAvatarUrl(null);
        return;
      }

      const supabase = createClient();

      const { data } = await supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 60 * 60);

      if (!cancelled) {
        setAvatarUrl(data?.signedUrl ?? null);
      }
    }

    void loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-sm font-bold text-muted ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`Photo de profil de ${name}`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}