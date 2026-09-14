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

function isEmoji(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    return /\p{Extended_Pictographic}/u.test(trimmed);
  } catch {
    return true;
  }
}

function getSingleGrapheme(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
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
  const [isPickerOpen, setIsPickerOpen] =
    useState(false);
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
      const { error: deleteError } =
        await supabase
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

    const { data, error: upsertError } =
      await supabase
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
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Réactions
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          Ton avis sur le match
        </h2>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-4">
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
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 transition-all duration-200 active:scale-[0.97] ${
                  item.reactedByCurrentUser
                    ? "border-accent/40 bg-accent/10"
                    : "border-border bg-surface-2 hover:border-white/15"
                }`}
              >
                <span className="text-xl leading-none">
                  {item.reaction}
                </span>

                <span className="text-xs font-bold text-muted">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-5 text-muted">
            Sois le premier à réagir à ce match.
          </p>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={() =>
              setIsPickerOpen((current) => !current)
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-sm font-semibold transition-all duration-200 hover:border-white/15 hover:bg-white/5 active:scale-[0.98]"
          >
            <span className="text-lg">
              {currentUserReaction ?? "＋"}
            </span>

            {currentUserReaction
              ? "Changer ma réaction"
              : "Ajouter une réaction"}
          </button>

          {isPickerOpen && (
            <div className="mt-3 rounded-2xl border border-border bg-surface-2 p-3">
              <p className="text-xs leading-5 text-muted">
                Choisis n&apos;importe quel emoji depuis ton
                clavier.
              </p>

              <div className="mt-3 flex gap-2">
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
                  placeholder="😊"
                  aria-label="Emoji"
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 text-2xl outline-none transition-colors placeholder:text-muted focus:border-accent/50"
                />

                <button
                  type="button"
                  onClick={submitCustomEmoji}
                  disabled={
                    isSaving ||
                    !emojiInput.trim()
                  }
                  className="min-h-12 rounded-xl bg-accent px-4 text-sm font-bold text-background transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-4 text-muted">
                Sur mobile, le clavier emoji de ton téléphone
                permet d&apos;en choisir n&apos;importe lequel.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}