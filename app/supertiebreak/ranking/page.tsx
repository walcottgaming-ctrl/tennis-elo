import Link from "next/link";
import { createClient } from "@/src/supabase/server";
import BottomNav from "@/app/components/BottomNav";

type Player = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  points_super_tiebreak: number;
};

function getPlayerName(player: Player) {
  const fullName = [player.first_name, player.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || player.username || "Joueur";
}

function getInitials(player: Player) {
  const fullName = [player.first_name, player.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  return (player.username?.slice(0, 2) || "J").toUpperCase();
}

export default async function SuperTieBreakRankingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: players, error } = await supabase
    .from("profiles")
    .select(
      "id, username, first_name, last_name, points_super_tiebreak"
    )
    .order("points_super_tiebreak", {
      ascending: false,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
        <div className="mx-auto max-w-lg">
          <Link
            href="/supertiebreak"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Super Tie-Break
          </Link>

          <div className="mt-10 rounded-3xl border border-border bg-surface p-6">
            <p className="text-sm text-danger">
              Impossible de charger le classement.
            </p>
          </div>
        </div>

        <BottomNav />
      </main>
    );
  }

  const ranking = (players ?? []) as Player[];

  const currentPlayerIndex = user
    ? ranking.findIndex((player) => player.id === user.id)
    : -1;

  const currentRank =
    currentPlayerIndex >= 0 ? currentPlayerIndex + 1 : null;

  return (
    <main className="min-h-screen bg-background px-5 py-8 pb-28 text-foreground">
      <div className="mx-auto max-w-lg">
        <Link
          href="/supertiebreak"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Super Tie-Break
        </Link>

        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Classement
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Super Tie-Break
          </h1>

          <p className="mt-2 text-sm leading-5 text-muted">
            Le classement indépendant du Super Tie-Break.
          </p>
        </header>

        {currentRank !== null && (
          <div className="mt-6 rounded-3xl border border-accent/20 bg-accent/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  Ta position
                </p>

                <p className="mt-2 text-2xl font-bold">
                  #{currentRank}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted">Points</p>
                <p className="mt-1 text-2xl font-bold">
                  {ranking[currentPlayerIndex].points_super_tiebreak}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">
              Classement
            </h2>

            <span className="text-xs text-muted">
              {ranking.length} joueur{ranking.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            {ranking.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-semibold">
                  Aucun joueur classé
                </p>
                <p className="mt-2 text-sm leading-5 text-muted">
                  Le classement apparaîtra dès les premiers Super
                  Tie-Breaks enregistrés.
                </p>
              </div>
            ) : (
              <div>
                {ranking.map((player, index) => {
                  const rank = index + 1;
                  const isCurrentUser = player.id === user?.id;

                  return (
                    <Link
                      key={player.id}
                      href={
                        player.id === user?.id
                          ? "/profile"
                          : `/players/${player.id}`
                      }
                      className={`flex min-h-20 items-center gap-4 px-5 transition-colors ${
                        index !== ranking.length - 1
                          ? "border-b border-border"
                          : ""
                      } ${
                        isCurrentUser
                          ? "bg-accent/10"
                          : "hover:bg-surface-2"
                      }`}
                    >
                      <div className="w-8 shrink-0 text-center">
                        <span
                          className={`text-sm font-bold ${
                            rank <= 3
                              ? "text-foreground"
                              : "text-muted"
                          }`}
                        >
                          {rank}
                        </span>
                      </div>

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isCurrentUser
                            ? "bg-accent text-background"
                            : "bg-surface-2 text-foreground"
                        }`}
                      >
                        {getInitials(player)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {getPlayerName(player)}
                        </p>

                        {player.username && (
                          <p className="mt-0.5 truncate text-xs text-muted">
                            @{player.username}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-bold">
                          {player.points_super_tiebreak}
                        </p>
                        <p className="text-[11px] text-muted">
                          points
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}