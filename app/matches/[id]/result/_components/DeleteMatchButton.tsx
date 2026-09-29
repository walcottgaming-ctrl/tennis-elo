"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

type DeleteMatchButtonProps = {
  matchId: string;
};

function TrashIcon({
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
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

export default function DeleteMatchButton({
  matchId,
}: DeleteMatchButtonProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Es-tu sûr de vouloir supprimer ce match ?\n\nLe résultat et l'ELO associé seront supprimés."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "delete_match",
      {
        p_match_id: matchId,
      }
    );

    if (error) {
      setMessage(
        `Impossible de supprimer le match : ${error.message}`
      );
      setDeleting(false);
      return;
    }

    router.push("/matches");
    router.refresh();
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="group flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-danger/20 bg-danger/5 px-5 text-sm font-semibold text-danger transition-all duration-200 hover:border-danger/35 hover:bg-danger/10 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/10 transition-colors duration-200 group-hover:bg-danger/15">
          <TrashIcon className="h-4 w-4" />
        </span>

        <span>
          {deleting
            ? "Suppression..."
            : "Supprimer le match"}
        </span>
      </button>

      {message && (
        <div className="mt-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3">
          <p className="text-sm leading-6 text-danger">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}