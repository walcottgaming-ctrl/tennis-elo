"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/src/supabase/client";

type DeleteMatchButtonProps = {
  matchId: string;
};

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
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
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

export default function DeleteMatchButton({ matchId }: DeleteMatchButtonProps) {
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc("delete_match", {
        p_match_id: matchId,
      });

      if (error) {
        console.error("Erreur Supabase lors de la suppression :", error);

        const errorMessage = [
          error.message ? `Message : ${error.message}` : "",
          error.code ? `Code : ${error.code}` : "",
          error.details ? `Détails : ${error.details}` : "",
          error.hint ? `Indice : ${error.hint}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        setMessage(
          `Impossible de supprimer le match.\n\n${errorMessage}`
        );
        setDeleting(false);
        return;
      }

      if (
        data &&
        typeof data === "object" &&
        "success" in data &&
        data.success === false
      ) {
        const rpcMessage =
          "message" in data && typeof data.message === "string"
            ? data.message
            : "La suppression du match n'a pas été confirmée.";

        setMessage(`Impossible de supprimer le match.\n\n${rpcMessage}`);
        setDeleting(false);
        return;
      }

      router.replace("/matches");
      router.refresh();
    } catch (error: unknown) {
      console.error("Erreur suppression match :", error);

      const caughtError =
        error && typeof error === "object" && "message" in error
          ? (error as { message?: string })
          : null;

      setMessage(
        `Impossible de supprimer le match.\n\n${caughtError?.message ?? "Erreur inconnue."}`
      );
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-4">
        <p className="text-sm font-semibold text-foreground">
          Supprimer définitivement ce match ?
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Le match, son résultat et son impact sur le classement seront supprimés.
          Le classement sera ensuite recalculé à partir des matchs restants.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="min-h-11 rounded-xl border border-white/8 bg-white/4 px-4 text-sm font-semibold text-foreground transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="min-h-11 rounded-xl bg-danger px-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Suppression..." : "Oui, supprimer"}
          </button>
        </div>

        {message && (
          <div className="mt-3 rounded-xl border border-danger/20 bg-danger/10 px-3 py-3">
            <p className="whitespace-pre-line text-xs leading-5 text-danger">
              {message}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setConfirming(true);
        }}
        disabled={deleting}
        className="group flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-danger/20 bg-danger/5 px-5 text-sm font-semibold text-danger transition-all duration-200 hover:border-danger/35 hover:bg-danger/10 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/10 transition-colors duration-200 group-hover:bg-danger/15">
          <TrashIcon className="h-4 w-4" />
        </span>
        <span>Supprimer le match</span>
      </button>

      {message && (
        <div className="mt-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3">
          <p className="whitespace-pre-line text-sm leading-6 text-danger">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
