"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <path d="M6 7l1 13h10l-1-13" />
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
      const response = await fetch(`/api/matches/${matchId}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const details = [
          result.message ? `Message : ${result.message}` : "",
          result.code ? `Code : ${result.code}` : "",
          result.details ? `Détails : ${result.details}` : "",
          result.hint ? `Indice : ${result.hint}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        throw new Error(
          details || "Impossible de supprimer le match."
        );
      }

      router.replace("/matches");
      router.refresh();
    } catch (error) {
      console.error("Erreur suppression match :", error);

      setMessage(
        `Impossible de supprimer le match.\n\n${
          error instanceof Error ? error.message : "Erreur inconnue."
        }`
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
          Le match et son impact sur le classement seront supprimés.
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
