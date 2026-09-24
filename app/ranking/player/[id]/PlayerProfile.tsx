"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SportIcon from "@/app/components/SportIcon";
import { useSportMode } from "@/app/context/SportModeContext";
import { createClient } from "@/src/supabase/client";

type Sport =
  | "tennis"
  | "padel"
  | "super_tiebreak";

type RankingHistory = {
  id: string;
  player_id: string;
  match_id: string;
  sport: Sport;
  old_points: number | null;
  new_points: number | null;
  points_change: number | null;

  bonus_stb_large: number | null;
  bonus_stb_perfect: number | null;

  created_at: string;
};

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;

  /*
   * Compatibilité avec profiles.
   *
   * IMPORTANT :
   * Ces champs ne servent PAS de source de vérité
   * pour les points actuels.
   *
   * Les points affichés viennent de ranking_history.new_points.
   */
  points_tennis: number | null;
  points_padel: number | null;
  points_super_tiebreak: number | null;

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

type Match = {
  id: string;
  sport: Sport;
  format: "singles" | "doubles";
  created_at: string;
};

type MatchPlayer = {
  match_id: string;
  player_id: string | null;
  team: number;
};

type SetScore = {
  match_id: string;
  set_number: number;
  team_1_score: number;
  team_2_score: number;
};

type ChampionHistory = {
  id: string;
  player_id: string;
  sport: Sport;
  started_at: string;
  ended_at: string | null;
  matches_as_champion: number;
};

type Props = {
  player: Player;
  players: Player[];
  matches: Match[];
  matchPlayers: MatchPlayer[];
  sets: SetScore[];
  championHistory: ChampionHistory[];

  /*
   * Historique des points de tous les joueurs.
   * ranking_history est la source de vérité.
   */
  rankingHistory: RankingHistory[];
};

type MatchResult = {
  match: Match;
  opponentName: string;
  result: "Victoire" | "Défaite";
  scores: string[];
};

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

function formatValue(value: string | null) {
  if (!value) {
    return null;
  }

  return displayValues[value] ?? value;
}

function ArrowLeftIcon({
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
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function TrophyIcon({
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
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H3v1a4 4 0 0 0 4 4" />
      <path d="M17 6h4v1a4 4 0 0 1-4 4" />
    </svg>
  );
}

function ChartIcon({
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
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-4 3 2 5-6" />
    </svg>
  );
}

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
      <path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5" />
    </svg>
  );
}

function getPlayerName(player: Player) {
  const fullName = [
    player.first_name,
    player.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (player.username) {
    return `@${player.username}`;
  }

  return "Joueur";
}

function getInitials(player: Player) {
  const name = getPlayerName(player);

  if (name.startsWith("@")) {
    return name.substring(1, 2).toUpperCase();
  }

  const parts = name.split(" ");

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
}

/*
 * SOURCE DE VÉRITÉ DES POINTS
 *
 * Le classement actuel vient du dernier
 * ranking_history.new_points.
 *
 * IMPORTANT :
 * La chronologie est basée sur matches.created_at
 * et non sur ranking_history.created_at.
 *
 * Si deux matchs ont exactement le même timestamp,
 * match_id sert de départage déterministe.
 *
 * On ne lit jamais profiles.points_* ici.
 * On ne somme jamais points_change.
 * On ne reconstruit jamais les points depuis 1000.
 */
function getCurrentPoints(
  rankingHistory: RankingHistory[],
  matches: Match[],
  playerId: string,
  sport: Sport
) {
  const matchesById = new Map(
    matches.map((match) => [match.id, match])
  );

  let latest: RankingHistory | null = null;

  for (const item of rankingHistory) {
    if (
      item.player_id !== playerId ||
      item.sport !== sport ||
      item.new_points === null
    ) {
      continue;
    }

    const currentMatch = matchesById.get(
      item.match_id
    );

    if (!currentMatch) {
      continue;
    }

    if (!latest) {
      latest = item;
      continue;
    }

    const latestMatch = matchesById.get(
      latest.match_id
    );

    if (!latestMatch) {
      latest = item;
      continue;
    }

    const currentTime = new Date(
      currentMatch.created_at
    ).getTime();

    const latestTime = new Date(
      latestMatch.created_at
    ).getTime();

    if (
      currentTime > latestTime ||
      (currentTime === latestTime &&
        item.match_id > latest.match_id)
    ) {
      latest = item;
    }
  }

  return latest?.new_points ?? 1000;
}

function getSportName(sport: Sport) {
  if (sport === "tennis") {
    return "Tennis";
  }

  if (sport === "padel") {
    return "Padel";
  }

  return "Super Tie-Break";
}

function getDivision(points: number) {
  if (points < 1000) {
    return {
      name: "Bronze",
      description: "Moins de 1000 points",
    };
  }

  if (points < 1100) {
    return {
      name: "Argent",
      description: "1000 à 1099 points",
    };
  }

  if (points < 1200) {
    return {
      name: "Or",
      description: "1100 à 1199 points",
    };
  }

  if (points < 1300) {
    return {
      name: "Platine",
      description: "1200 à 1299 points",
    };
  }

  return {
    name: "Diamant",
    description: "1300 points et plus",
  };
}

function SectionHeading({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <p className="eyebrow">{eyebrow}</p>
      </div>

      <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function CharacteristicCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return (
    <div className="glass rounded-[20px] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5">
      <p className="eyebrow">{label}</p>

      <p className="mt-2 text-sm font-semibold leading-5 text-foreground">
        {typeof value === "string"
          ? formatValue(value)
          : value}
      </p>
    </div>
  );
}

export default function PlayerProfile({
  player,
  players,
  matches,
  matchPlayers,
  sets,
  championHistory,
  rankingHistory,
}: Props) {
  const { mode } = useSportMode();

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadAvatar() {
      if (!player.avatar_url) {
        setAvatarUrl(null);
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(
          player.avatar_url,
          60 * 60
        );

      if (error) {
        console.error(
          "Erreur lors du chargement de l'avatar :",
          error
        );

        setAvatarUrl(null);
        return;
      }

      setAvatarUrl(data?.signedUrl ?? null);
    }

    loadAvatar();
  }, [player.avatar_url]);

  /*
   * POINTS ACTUELS DU JOUEUR
   *
   * ranking_history.new_points est la seule source
   * utilisée pour déterminer les points actuels.
   */
  const points = useMemo(
    () =>
      getCurrentPoints(
        rankingHistory,
        matches,
        player.id,
        mode
      ),
    [rankingHistory, matches, player.id, mode]
  );

  const division = getDivision(points);

  /*
   * CLASSEMENT
   *
   * Chaque joueur est classé avec son dernier
   * ranking_history.new_points pour le sport sélectionné.
   */
  const rankedPlayers = useMemo(() => {
    const modeMatchIds = new Set(
      matches
        .filter((match) => match.sport === mode)
        .map((match) => match.id)
    );

    const activeIds = new Set(
      matchPlayers
        .filter(
          (item) =>
            item.player_id &&
            modeMatchIds.has(item.match_id)
        )
        .map((item) => item.player_id)
    );

    return players
      .filter((item) => activeIds.has(item.id))
      .map((item) => ({
        player: item,
        points: getCurrentPoints(
          rankingHistory,
          matches,
          item.id,
          mode
        ),
      }))
      .sort(
        (a, b) => b.points - a.points
      );
  }, [
    matches,
    matchPlayers,
    mode,
    players,
    rankingHistory,
  ]);

  const rankIndex = rankedPlayers.findIndex(
    (item) => item.player.id === player.id
  );

  const rank =
    rankIndex >= 0 ? rankIndex + 1 : null;

  /*
   * HISTORIQUE DES MATCHS
   *
   * La date affichée et l'ordre des matchs
   * utilisent matches.created_at.
   */
  const history = useMemo(() => {
    const playerLinks = matchPlayers.filter(
      (item) => item.player_id === player.id
    );

    const playerMatches = playerLinks
      .map((link) => {
        const match = matches.find(
          (item) => item.id === link.match_id
        );

        return match ? { match, link } : null;
      })
      .filter(
        (
          item
        ): item is {
          match: Match;
          link: MatchPlayer;
        } => Boolean(item)
      )
      .filter(
        ({ match }) => match.sport === mode
      )
      .sort((a, b) => {
        const dateDifference =
          new Date(
            b.match.created_at
          ).getTime() -
          new Date(
            a.match.created_at
          ).getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return b.match.id.localeCompare(
          a.match.id
        );
      });

    const result: MatchResult[] = [];

    for (const { match, link } of playerMatches) {
      const opponents = matchPlayers.filter(
        (item) =>
          item.match_id === match.id &&
          item.team !== link.team
      );

      const opponentNames = opponents.map(
        (opponent) => {
          const profile = players.find(
            (item) =>
              item.id === opponent.player_id
          );

          return profile
            ? getPlayerName(profile)
            : "Joueur";
        }
      );

      const matchSets = sets
        .filter(
          (set) => set.match_id === match.id
        )
        .sort(
          (a, b) =>
            a.set_number - b.set_number
        );

      if (matchSets.length === 0) {
        continue;
      }

      let playerSetWins = 0;
      let opponentSetWins = 0;

      const scores = matchSets.map((set) => {
        const playerScore =
          link.team === 1
            ? set.team_1_score
            : set.team_2_score;

        const opponentScore =
          link.team === 1
            ? set.team_2_score
            : set.team_1_score;

        if (playerScore > opponentScore) {
          playerSetWins++;
        }

        if (opponentScore > playerScore) {
          opponentSetWins++;
        }

        return `${set.team_1_score}-${set.team_2_score}`;
      });

      if (playerSetWins === opponentSetWins) {
        continue;
      }

      result.push({
        match,
        opponentName:
          opponentNames.join(" / ") ||
          "Joueur",
        result:
          playerSetWins > opponentSetWins
            ? "Victoire"
            : "Défaite",
        scores,
      });
    }

    return result;
  }, [
    matchPlayers,
    matches,
    mode,
    player.id,
    players,
    sets,
  ]);

  const wins = history.filter(
    (item) => item.result === "Victoire"
  ).length;

  const losses = history.filter(
    (item) => item.result === "Défaite"
  ).length;

  const totalMatches = wins + losses;

  const winRate =
    totalMatches > 0
      ? Math.round((wins / totalMatches) * 100)
      : 0;

  const currentStreak = useMemo(() => {
    let streak = 0;

    for (const item of history) {
      if (item.result !== "Victoire") {
        break;
      }

      streak++;
    }

    return streak;
  }, [history]);

  const currentChampion = championHistory.find(
    (item) =>
      item.sport === mode &&
      item.ended_at === null
  );

  const modeChampionHistory =
    championHistory.filter(
      (item) => item.sport === mode
    );

  const name = getPlayerName(player);
  const initials = getInitials(player);

  const hasSportingProfile = Boolean(
    player.dominant_hand ||
      player.playing_style ||
      player.backhand_style ||
      player.preferred_surface ||
      player.height_cm ||
      player.weight_kg ||
      player.forehand_style ||
      player.backhand_preference ||
      player.down_the_line_style ||
      player.cross_court_style ||
      player.volley_level ||
      player.serve_style ||
      player.court_position ||
      player.player_strength ||
      player.player_weakness
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 pb-32 pt-5 text-foreground sm:px-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 8%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 70% 85%, rgba(79,45,127,0.18) 0%, transparent 45%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-lg pb-8">

        {/* HEADER */}

        <header className="flex items-center justify-between">
          <Link
            href="/ranking"
            aria-label="Retour au classement"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-muted backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/10 hover:text-foreground active:scale-95"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/5 px-3 py-1.5">
            <SportIcon
              sport={mode}
              className="h-3.5 w-3.5 text-accent"
            />

            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
              {getSportName(mode)}
            </span>
          </div>
        </header>

        {/* HERO */}

        <section className="glass-strong relative mt-5 overflow-hidden rounded-[30px] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-white/2.5 blur-3xl" />

          <div className="relative">
            <div className="flex items-start gap-4">
              {avatarUrl ? (
                <div className="relative shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={name}
                    width={88}
                    height={88}
                    className="h-22 w-22 rounded-[26px] border border-white/10 object-cover shadow-2xl"
                  />

                  <div className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-[#171922] bg-accent text-[#0b0d13] shadow-[0_0_18px_var(--accent-glow)]">
                    <SportIcon
                      sport={mode}
                      className="h-3.5 w-3.5"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative shrink-0">
                  <div className="grid h-22 w-22 place-items-center rounded-[26px] border border-accent/15 bg-accent/10 font-display text-2xl font-bold text-accent shadow-[0_0_35px_var(--accent-glow)]">
                    {initials}
                  </div>

                  <div className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-[#171922] bg-accent text-[#0b0d13] shadow-[0_0_18px_var(--accent-glow)]">
                    <SportIcon
                      sport={mode}
                      className="h-3.5 w-3.5"
                    />
                  </div>
                </div>
              )}

              <div className="min-w-0 flex-1 pt-1">
                <p className="eyebrow">
                  Profil joueur
                </p>

                <h1 className="mt-1 truncate font-display text-[26px] font-bold tracking-tight">
                  {name}
                </h1>

                {player.username && (
                  <p className="mt-1 truncate text-sm text-muted">
                    @{player.username}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-white/6 bg-white/4.5 px-3.5 py-3">
                <p className="eyebrow">Points</p>

                <p className="mt-1 font-display text-xl font-bold">
                  {points}
                </p>
              </div>

              <div className="rounded-2xl border border-white/6 bg-white/4.5 px-3.5 py-3">
                <p className="eyebrow">Classement</p>

                <p className="mt-1 font-display text-xl font-bold">
                  {rank ? `#${rank}` : "—"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ADN SPORTIF */}

        {hasSportingProfile && (
          <section className="mt-8">
            <SectionHeading
              icon={<UserIcon className="h-4 w-4" />}
              eyebrow="ADN du joueur"
              title="Son profil sportif"
            />

            <div className="grid grid-cols-2 gap-3">
              <CharacteristicCard
                label="Main dominante"
                value={player.dominant_hand}
              />

              <CharacteristicCard
                label="Style de jeu"
                value={player.playing_style}
              />

              <CharacteristicCard
                label="Revers"
                value={player.backhand_style}
              />

              <CharacteristicCard
                label="Position"
                value={player.court_position}
              />

              <CharacteristicCard
                label="Surface préférée"
                value={player.preferred_surface}
              />

              <CharacteristicCard
                label="Point fort"
                value={player.player_strength}
              />

              <CharacteristicCard
                label="À améliorer"
                value={player.player_weakness}
              />

              <CharacteristicCard
                label="Taille"
                value={
                  player.height_cm
                    ? `${player.height_cm} cm`
                    : null
                }
              />

              <CharacteristicCard
                label="Poids"
                value={
                  player.weight_kg
                    ? `${player.weight_kg} kg`
                    : null
                }
              />
            </div>
          </section>
        )}

        {/* PROFIL TECHNIQUE */}

        {hasSportingProfile && (
          <section className="mt-8">
            <SectionHeading
              icon={
                <SportIcon
                  sport={mode}
                  className="h-4 w-4"
                />
              }
              eyebrow="Profil technique"
              title="Son jeu"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <CharacteristicCard
                label="Coup droit"
                value={player.forehand_style}
              />

              <CharacteristicCard
                label="Préférence revers"
                value={player.backhand_preference}
              />

              <CharacteristicCard
                label="Long de ligne"
                value={player.down_the_line_style}
              />

              <CharacteristicCard
                label="Diagonale"
                value={player.cross_court_style}
              />

              <CharacteristicCard
                label="Volée"
                value={player.volley_level}
              />

              <CharacteristicCard
                label="Service"
                value={player.serve_style}
              />
            </div>
          </section>
        )}

        {/* CLASSEMENT */}

        <section className="mt-8">
          <SectionHeading
            icon={
              <SportIcon
                sport={mode}
                className="h-4 w-4"
              />
            }
            eyebrow="Classement"
            title={getSportName(mode)}
          />

          <div className="glass-strong relative overflow-hidden rounded-[28px] p-5">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Points actuels</p>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold tracking-tight">
                      {points}
                    </span>

                    <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                      pts
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="eyebrow">Position</p>

                  <p className="mt-1 font-display text-2xl font-bold">
                    {rank ? `#${rank}` : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-px bg-white/5" />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Division</p>

                  <p className="mt-1 text-sm font-semibold">
                    {division.name}
                  </p>
                </div>

                <span className="rounded-full border border-accent/15 bg-accent/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
                  {division.name}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/5 bg-white/2.5 px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {division.description}
                  </span>

                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-2">
                    {rank
                      ? `${rankedPlayers.length} joueurs`
                      : "Non classé"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATISTIQUES */}

        <section className="mt-8">
          <SectionHeading
            icon={<ChartIcon className="h-4 w-4" />}
            eyebrow="Performances"
            title={getSportName(mode)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-[22px] p-5">
              <p className="eyebrow">Matchs</p>

              <p className="mt-2 font-display text-3xl font-bold">
                {totalMatches}
              </p>

              <p className="mt-1 text-xs text-muted">
                joués
              </p>
            </div>

            <div className="glass rounded-[22px] p-5">
              <p className="eyebrow">Taux de victoire</p>

              <p className="mt-2 font-display text-3xl font-bold">
                {winRate}%
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{
                    width: `${winRate}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-accent/15 bg-accent/5 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                Gagnés
              </p>

              <p className="mt-2 font-display text-3xl font-bold">
                {wins}
              </p>
            </div>

            <div className="rounded-[22px] border border-danger/15 bg-danger/5 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-danger">
                Perdus
              </p>

              <p className="mt-2 font-display text-3xl font-bold">
                {losses}
              </p>
            </div>
          </div>

          <div className="glass mt-3 overflow-hidden rounded-3xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Série actuelle
                </p>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold">
                    {currentStreak}
                  </span>

                  <span className="text-xs text-muted">
                    {currentStreak > 1
                      ? "victoires consécutives"
                      : "victoire consécutive"}
                  </span>
                </div>
              </div>

              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/15 bg-accent/10 text-accent">
                <ChartIcon />
              </div>
            </div>
          </div>
        </section>

        {/* CHAMPION ACTUEL */}

        {currentChampion && (
          <section className="glass-strong relative mt-8 overflow-hidden rounded-[28px] p-5">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/12 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-[#0b0d13] shadow-[0_0_24px_var(--accent-glow)]">
                  <TrophyIcon />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                    Champion actuel
                  </p>

                  <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                    Champion {getSportName(mode)}
                  </h2>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between rounded-2xl border border-accent/10 bg-accent/5 p-4">
                <div>
                  <p className="text-xs text-muted">
                    Matchs en tant que champion
                  </p>

                  <p className="mt-1 font-display text-3xl font-bold">
                    {currentChampion.matches_as_champion}
                  </p>
                </div>

                <TrophyIcon className="h-7 w-7 text-accent/60" />
              </div>
            </div>
          </section>
        )}

        {/* PALMARÈS */}

        {modeChampionHistory.length > 0 && (
          <section className="mt-8">
            <SectionHeading
              icon={<TrophyIcon className="h-4 w-4" />}
              eyebrow="Palmarès"
              title="Historique des titres"
            />

            <div className="space-y-3">
              {modeChampionHistory.map((item) => (
                <div
                  key={item.id}
                  className="glass rounded-3xl p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                      <TrophyIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {getSportName(mode)}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            Depuis{" "}
                            {new Date(
                              item.started_at
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-white/8 bg-white/4.5 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted">
                          {item.matches_as_champion} matchs
                        </span>
                      </div>

                      {item.ended_at && (
                        <div className="mt-4 border-t border-white/5 pt-3">
                          <p className="text-[11px] text-muted">
                            Fin du règne :{" "}
                            <span className="font-medium text-foreground">
                              {new Date(
                                item.ended_at
                              ).toLocaleDateString("fr-FR")}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HISTORIQUE */}

        <section className="mt-8">
          <SectionHeading
            icon={<ChartIcon className="h-4 w-4" />}
            eyebrow="Historique"
            title="Dernières confrontations"
          />

          {history.length === 0 ? (
            <div className="glass-strong rounded-[28px] p-7 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-accent/10 bg-accent/10 text-accent">
                <SportIcon
                  sport={mode}
                  className="h-5 w-5"
                />
              </div>

              <p className="mt-4 font-display font-bold">
                Aucun match enregistré
              </p>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-muted">
                Les résultats apparaîtront ici après
                les premiers matchs.
              </p>
            </div>
          ) : (
            <div className="relative space-y-3">
              {history.slice(0, 10).map((item) => (
                <Link
                  key={item.match.id}
                  href={
                    item.match.sport ===
                    "super_tiebreak"
                      ? `/supertiebreak/${item.match.id}`
                      : `/matches/${item.match.id}`
                  }
                  className="glass group relative block rounded-[26px] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/5 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-[#171922] ${
                        item.result === "Victoire"
                          ? "border-accent/15 text-accent"
                          : "border-danger/15 text-danger"
                      }`}
                    >
                      <SportIcon
                        sport={item.match.sport}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                              {item.opponentName}
                            </p>

                            <span className="rounded-full border border-white/5 bg-white/4.5 px-2 py-1 text-[8px] font-semibold uppercase tracking-widest text-muted">
                              {item.match.format ===
                              "singles"
                                ? "Simple"
                                : "Double"}
                            </span>
                          </div>

                          <p className="mt-1 text-[11px] text-muted">
                            {getSportName(
                              item.match.sport
                            )}{" "}
                            ·{" "}
                            {new Date(
                              item.match.created_at
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest ${
                            item.result === "Victoire"
                              ? "border-accent/15 bg-accent/5 text-accent"
                              : "border-danger/15 bg-danger/5 text-danger"
                          }`}
                        >
                          {item.result}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.scores.map(
                          (score, index) => (
                            <span
                              key={`${item.match.id}-${index}`}
                              className="rounded-xl border border-white/5 bg-white/2.5 px-3 py-2 text-xs font-semibold text-muted"
                            >
                              Set {index + 1} : {score}
                            </span>
                          )
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-2">
                          Résultat
                        </span>

                        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-2 transition-colors group-hover:text-foreground">
                          Voir le match
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}