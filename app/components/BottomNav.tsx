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
        className="h-4.75 w-4.75"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.5 10.5 12 3l8.5 7.5"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.5 9.5V20h13V9.5"
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
        className="h-4.75 w-4.75"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path
          strokeLinecap="round"
          d="M7 7c2.2 2 3.5 4.3 3.8 7.1.2 1.8-.1 3.3-.8 4.9"
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
        className="h-4.75 w-4.75"
      >
        <path
          strokeLinecap="round"
          d="M6 20V10"
        />
        <path
          strokeLinecap="round"
          d="M12 20V4"
        />
        <path
          strokeLinecap="round"
          d="M18 20v-7"
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
        className="h-4.75 w-4.75"
      >
        <circle cx="12" cy="8" r="3.2" />
        <path
          strokeLinecap="round"
          d="M5 20c.7-3.6 3-5.5 7-5.5s6.3 1.9 7 5.5"
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
        className="h-4.75 w-4.75"
      >
        <circle cx="9" cy="8" r="2.8" />
        <circle cx="16.5" cy="9" r="2.3" />
        <path
          strokeLinecap="round"
          d="M3.8 20c.7-3.5 2.6-5.2 5.6-5.2s4.9 1.7 5.6 5.2"
        />
        <path
          strokeLinecap="round"
          d="M14.5 15.2c2.8.1 4.6 1.7 5.2 4.8"
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
        className="h-4.75 w-4.75"
      >
        <circle cx="12" cy="8" r="3.5" />
        <path
          strokeLinecap="round"
          d="M5 20c.8-3.8 3.1-5.8 7-5.8s6.2 2 7 5.8"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4"
      aria-label="Navigation principale"
    >
      <div className="mx-auto max-w-lg">
        <div className="rounded-[25px] border border-white/10 bg-[#11141c]/92 p-1.5 shadow-[0_-18px_50px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
          <div className="grid grid-cols-6 items-center">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className="group flex min-w-0 flex-col items-center justify-center rounded-2xl px-0.5 py-1.5"
                >
                  <span
                    className={`relative grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-accent text-[#0b0d13] shadow-[0_0_22px_var(--accent-glow)]"
                        : "text-muted group-hover:bg-white/5 group-hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={`mt-1.5 max-w-full truncate px-0.5 text-[9px] font-semibold tracking-tight transition-colors duration-200 ${
                      active
                        ? "text-accent"
                        : "text-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}