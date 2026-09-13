"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/supabase/client";

type DeleteMatchButtonProps = {
  matchId: string;
};

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

    const { error } = await supabase.rpc("delete_match", {
      p_match_id: matchId,
    });

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
        className="min-h-14 w-full rounded-xl border-2 border-red-200 bg-white px-5 py-4 text-center font-bold text-red-600 disabled:opacity-50"
      >
        {deleting
          ? "Suppression..."
          : "🗑️ Supprimer le match"}
      </button>

      {message && (
        <p className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}