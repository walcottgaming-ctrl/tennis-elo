import { NextResponse } from "next/server";

import { createClient } from "@/src/supabase/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Identifiant du match manquant." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Session utilisateur introuvable. Reconnecte-toi.",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc("delete_match", {
      p_match_id: id,
    });

    if (error) {
      console.error("Erreur RPC delete_match :", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message || "Impossible de supprimer le match.",
          code: error.code ?? null,
          details: error.details ?? null,
          hint: error.hint ?? null,
        },
        { status: 400 }
      );
    }

    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      data.success === false
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "message" in data && typeof data.message === "string"
              ? data.message
              : "La suppression du match n'a pas été confirmée.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur API suppression match :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur inconnue lors de la suppression.",
      },
      { status: 500 }
    );
  }
}
