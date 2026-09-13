"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: "⌂",
  },
  {
    href: "/matches",
    label: "Matchs",
    icon: "🎾",
  },
  {
    href: "/ranking",
    label: "Classement",
    icon: "🏆",
  },
  {
    href: "/players",
    label: "Joueurs",
    icon: "👥",
  },
  {
    href: "/profile",
    label: "Profil",
    icon: "👤",
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="h-20 md:hidden" />

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {items.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active
                    ? "text-black"
                    : "text-gray-500"
                }`}
              >
                <span className="text-xl leading-none">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}