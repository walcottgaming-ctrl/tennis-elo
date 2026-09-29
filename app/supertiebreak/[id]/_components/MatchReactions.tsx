"use client";

import { useMemo, useState } from "react";

import { createClient } from "@/src/supabase/client";

type ReactionRow = {
  id: string;
  user_id: string;
  reaction: string;
};

type MatchReactionsProps = {
  matchId: string;
  currentUserId: string | null;
  initialReactions: ReactionRow[];
};

function SmileIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.5c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7" />
      <path d="M9 10h.01M15 10h.01" />
    </svg>
  );
}

function isEmoji(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    return /^\p{Extended_Pictographic}/u.test(trimmed);
  } catch {
    return true;
  }
}

function getSingleGrapheme(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    typeof Intl !== "undefined" &&
    "Segmenter" in Intl
  ) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });

    return (
      Array.from(
        segmenter.segment(trimmed),
        (segment) => segment.segment
      )[0] ?? ""
    );
  }

  return Array.from(trimmed)[0] ?? "";
}

export default function MatchReactions({
  matchId,
  currentUserId,
  initialReactions,
}: MatchReactionsProps) {
  const supabase = useMemo(() => createClient(), []);

  const [reactions, setReactions] =
    useState<ReactionRow[]>(initialReactions);

  const [emojiInput, setEmojiInput] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const groupedReactions = useMemo(() => {
    const groups = new Map<
      string,
      {
        reaction: string;
        count: number;
        reactedByCurrentUser: boolean;
      }
    >();

    for (const item of reactions) {
      const current = groups.get(item.reaction);

      if (current) {
        current.count++;

        if (item.user_id === currentUserId) {
          current.reactedByCurrentUser = true;
        }
      } else {
        groups.set(item.reaction, {
          reaction: item.reaction,
          count: 1,
          reactedByCurrentUser:
            item.user_id === currentUserId,
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => b.count - a.count
    );
  }, [reactions, currentUserId]);

  const currentUserReaction =
    reactions.find(
      (item) => item.user_id === currentUserId
    )?.reaction ?? null;

  async function toggleReaction(reaction: string) {
    if (!currentUserId || isSaving) {
      return;
    }

    setError(null);
    setIsSaving(true);

    const existingReaction = reactions.find(
      (item) => item.user_id === currentUserId
    );

    if (
      existingReaction &&
      existingReaction.reaction === reaction
    ) {
      const { error: deleteError } = await supabase
        .from("match_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) {
        setError(
          "Impossible de supprimer la réaction."
        );
        setIsSaving(false);
        return;
      }

      setReactions((current) =>
        current.filter(
          (item) => item.id !== existingReaction.id
        )
      );

      setIsSaving(false);
      return;
    }

    const { data, error: upsertError } = await supabase
      .from("match_reactions")
      .upsert(
        {
          match_id: matchId,
          user_id: currentUserId,
          reaction,
        },
        {
          onConflict: "match_id,user_id",
        }
      )
      .select("id, user_id, reaction")
      .single();

    if (upsertError || !data) {
      setError(
        "Impossible d'enregistrer la réaction."
      );
      setIsSaving(false);
      return;
    }

    setReactions((current) => [
      ...current.filter(
        (item) => item.user_id !== currentUserId
      ),
      data as ReactionRow,
    ]);

    setIsSaving(false);
  }

  async function submitCustomEmoji() {
    if (!currentUserId || isSaving) {
      return;
    }

    const emoji = getSingleGrapheme(emojiInput);

    if (!emoji || !isEmoji(emoji)) {
      setError("Choisis un emoji valide.");
      return;
    }

    setError(null);

    await toggleReaction(emoji);

    setEmojiInput("");
    setIsPickerOpen(false);
  }

  if (!currentUserId) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-4">
        <p className="eyebrow">Réactions</p>

        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          Ton avis sur le match
        </h2>
      </div>

      <div className="glass rounded-[26px] p-4 sm:p-5">
        {groupedReactions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {groupedReactions.map((item) => (
              <button
                key={item.reaction}
                type="button"
                onClick={() =>
                  toggleReaction(item.reaction)
                }
                disabled={isSaving}
                aria-label={`Réagir avec ${item.reaction}`}
                aria-pressed={
                  item.reactedByCurrentUser
                }
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 transition-all duration-200 active:scale-[0.97] ${
                  item.reactedByCurrentUser
                    ? "border-accent/40 bg-accent/10 shadow-[0_0_18px_var(--accent-glow)]"
                    : "border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10"
                }`}
              >
                <span className="text-xl leading-none">
                  {item.reaction}
                </span>

                <span
                  className={`text-xs font-semibold ${
                    item.reactedByCurrentUser
                      ? "text-accent"
                      : "text-muted"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/2.5 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-muted">
                <SmileIcon className="h-4 w-4" />
              </div>

              <p className="text-sm leading-6 text-muted">
                Sois le premier à réagir à ce match.
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() =>
              setIsPickerOpen((current) => !current)
            }
            aria-expanded={isPickerOpen}
            className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              isPickerOpen
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-white/8 bg-white/5 text-foreground hover:border-white/15 hover:bg-white/10"
            }`}
          >
            {currentUserReaction ? (
              <span className="text-lg leading-none">
                {currentUserReaction}
              </span>
            ) : (
              <SmileIcon className="h-4 w-4" />
            )}

            <span>
              {currentUserReaction
                ? "Changer ma réaction"
                : "Ajouter une réaction"}
            </span>
          </button>

          {isPickerOpen && (
            <div className="glass-strong mt-3 overflow-hidden rounded-[22px] p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
                  <SmileIcon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Choisir une réaction
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Utilise le clavier emoji de ton
                    appareil pour choisir ta réaction.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={emojiInput}
                  onChange={(event) =>
                    setEmojiInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitCustomEmoji();
                    }
                  }}
                  maxLength={16}
                  placeholder="Choisir un emoji"
                  aria-label="Emoji"
                  className="min-h-12 min-w-0 flex-1 rounded-2xl border border-white/8 bg-white/5 px-4 text-2xl outline-none transition-all duration-200 placeholder:text-muted focus:border-accent focus:bg-white/10"
                />

                <button
                  type="button"
                  onClick={submitCustomEmoji}
                  disabled={
                    isSaving || !emojiInput.trim()
                  }
                  className="min-h-12 rounded-2xl bg-accent px-4 text-sm font-semibold text-[#0b0d13] shadow-[0_10px_30px_var(--accent-glow)] transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-4 text-muted">
                Une seule réaction est conservée par
                joueur.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5">
              <p className="text-xs font-medium leading-5 text-danger">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}