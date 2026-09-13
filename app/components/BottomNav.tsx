"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Accueil", emoji: "🏠" },
  { href: "/matches", label: "Matchs", emoji: "🎾" },
  { href: "/ranking", label: "Classement", emoji: "🏆" },
  { href: "/players", label: "Joueurs", emoji: "👥" },
  { href: "/friends", label: "Amis", emoji: "🤝" },
  { href: "/profile", label: "Profil", emoji: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg leading-none">
                {item.emoji}
              </span>

              <span className="mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}