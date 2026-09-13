"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5v-9Z"
        />
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "Matchs",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path
          strokeLinecap="round"
          d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c-2.5 1.5-3.5 4-3.5 5.5s1 4 3.5 5.5"
        />
      </svg>
    ),
  },
  {
    href: "/ranking",
    label: "Classement",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 20V10M12 20V4M19 20v-7"
        />
      </svg>
    ),
  },
  {
    href: "/players",
    label: "Joueurs",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <circle cx="9" cy="8" r="3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.5 19c.7-3.2 2.5-5 5.5-5s4.8 1.8 5.5 5"
        />
        <path
          strokeLinecap="round"
          d="M16 11c2.5.2 4.2 1.7 4.7 4"
        />
      </svg>
    ),
  },
  {
    href: "/friends",
    label: "Amis",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM15.5 13a3 3 0 1 0 0-6"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.5 20c.6-3.5 2.5-5.5 6-5.5s5.4 2 6 5.5M15 15c3 .1 5 1.7 5.5 5"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profil",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <circle cx="12" cy="8" r="3.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 20c.8-3.8 3.1-5.8 7-5.8s6.2 2 7 5.8"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/[0.07] bg-[#17191c]/95 p-1.5 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-6">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex min-w-0 flex-col items-center justify-center rounded-[18px] py-2 transition-all duration-200 ${
                  active
                    ? "text-accent"
                    : "text-muted hover:text-white"
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${
                    active
                      ? "-translate-y-0.5"
                      : "group-hover:-translate-y-0.5"
                  }`}
                >
                  {item.icon}
                </span>

                <span
                  className={`mt-1 truncate text-[10px] font-semibold ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  {item.label}
                </span>

                {active && (
                  <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}