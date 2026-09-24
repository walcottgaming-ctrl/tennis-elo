"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: "home",
  },
  {
    href: "/matches",
    label: "Matchs",
    icon: "matches",
  },
  {
    href: "/ranking",
    label: "Classement",
    icon: "ranking",
  },
  {
    href: "/players",
    label: "Joueurs",
    icon: "players",
  },
  {
    href: "/profile",
    label: "Profil",
    icon: "profile",
  },
] as const;

function NavIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: (typeof items)[number]["icon"];
  className?: string;
}) {
  if (icon === "home") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="m4 10 8-6 8 6" />
        <path d="M6.5 9.5V20h11V9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    );
  }

  if (icon === "matches") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8 5.2c1.7 1.4 2.8 3.8 2.8 6.8S9.7 17.4 8 18.8" />
        <path d="M16 5.2c-1.7 1.4-2.8 3.8-2.8 6.8s1.1 5.4 2.8 6.8" />
      </svg>
    );
  }

  if (icon === "ranking") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M5 20V10h4v10" />
        <path d="M10 20V4h4v16" />
        <path d="M15 20v-7h4v7" />
      </svg>
    );
  }

  if (icon === "players") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8" />
        <path d="M17 14.2c2.1.6 3.3 2.2 3.7 4.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" />
    </svg>
  );
}

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Espace réservé pour éviter que le contenu passe sous la navigation */}
      <div className="h-20 md:hidden" />

      <nav
        className="fixed inset-x-0 bottom-3 z-50 px-3 sm:px-4 md:hidden"
        aria-label="Navigation principale"
      >
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-[25px] border border-white/10 bg-[#11141c]/92 p-1.5 shadow-[0_-18px_50px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
            <div className="grid grid-cols-5 gap-1">
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
                    className={`group flex min-h-15 min-w-0 flex-col items-center justify-center rounded-[19px] px-0.5 text-[10px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                      active
                        ? "text-accent"
                        : "text-muted hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-accent text-[#0b0d13] shadow-[0_0_22px_var(--accent-glow)]"
                          : "text-muted group-hover:bg-white/5 group-hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <span
                          className="absolute -top-1 h-1 w-1 rounded-full bg-[#0b0d13]"
                          aria-hidden="true"
                        />
                      )}

                      <NavIcon
                        icon={item.icon}
                        className="h-4.75 w-4.75"
                      />
                    </span>

                    <span
                      className={`mt-1.5 whitespace-nowrap px-0.5 text-[10px] leading-none tracking-tight transition-colors duration-200 ${
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
    </>
  );
}