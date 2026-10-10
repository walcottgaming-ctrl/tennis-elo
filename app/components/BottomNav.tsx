"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useSportMode } from "@/app/context/SportModeContext";

const items = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10.5 12 3l8.5 7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.5V20h13V9.5" />
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "Matchs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path strokeLinecap="round" d="M7 7c2.2 2 3.5 4.3 3.8 7.1.2 1.8-.1 3.3-.8 4.9" />
      </svg>
    ),
  },
  {
    href: "/ranking",
    label: "Classements",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" d="M6 20V10" />
        <path strokeLinecap="round" d="M12 20V4" />
        <path strokeLinecap="round" d="M18 20v-7" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path strokeLinecap="round" d="M5 20c.8-3.8 3.1-5.8 7-5.8s6.2 2 7 5.8" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { mode } = useSportMode();

  const addMatchHref =
    mode === "super_tiebreak" ? "/supertiebreak/new" : "/matches/new";

  // Keep the primary navigation out of the public entry and authentication screens.
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/")
  ) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4"
      aria-label="Navigation principale"
    >
      <div className="mx-auto max-w-lg">
        <div className="rounded-[25px] border border-white/10 bg-[#11141c]/92 p-1.5 shadow-[0_-18px_50px_-24px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
          <div className="grid grid-cols-5 items-end">
            {items.slice(0, 2).map((item) => {
              const isCreateMatchRoute =
                pathname === "/matches/new" ||
                pathname.startsWith("/matches/new/") ||
                pathname === "/supertiebreak/new" ||
                pathname.startsWith("/supertiebreak/new/");

              const isMatchDetailRoute =
                (pathname.startsWith("/matches/") ||
                  pathname.startsWith("/supertiebreak/")) &&
                !isCreateMatchRoute;

              const active =
                pathname === item.href ||
                (item.href === "/matches" &&
                  (pathname === "/supertiebreak" || isMatchDetailRoute)) ||
                (item.href === "/ranking" &&
                  pathname.startsWith("/ranking/")) ||
                (item.href === "/profile" &&
                  pathname.startsWith("/profile/")) ||
                (item.href === "/dashboard" &&
                  pathname.startsWith("/dashboard/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-1.5"
                >
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`relative grid h-10 w-10 place-items-center rounded-xl transition-colors duration-200 ${
                      active
                        ? "bg-accent text-[#0b0d13] shadow-[0_0_22px_var(--accent-glow)]"
                        : "text-muted group-hover:bg-white/5 group-hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="bottom-nav-active"
                        className="absolute inset-0 rounded-xl bg-accent shadow-[0_0_22px_var(--accent-glow)]"
                        transition={{ type: "spring", stiffness: 520, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{item.icon}</span>
                  </motion.span>
                  <motion.span
                    animate={{ opacity: active ? 1 : 0.78 }}
                    transition={{ duration: 0.18 }}
                    className={`mt-1.5 max-w-full truncate text-[10px] font-semibold tracking-tight ${
                      active ? "text-accent" : "text-muted"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}

            <Link
              href={addMatchHref}
              aria-label={
                mode === "super_tiebreak"
                  ? "Ajouter un Super Tie-Break"
                  : `Ajouter un match de ${mode === "padel" ? "padel" : "tennis"}`
              }
              className="group -mt-5 flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-1.5"
            >
              <motion.span
                whileTap={{ scale: 0.92 }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="grid h-14 w-14 place-items-center rounded-[20px] border border-white/20 bg-accent text-[#0b0d13] shadow-[0_0_28px_var(--accent-glow)] transition-shadow duration-200 group-hover:shadow-[0_0_36px_var(--accent-glow)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-7 w-7" aria-hidden="true">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </motion.span>
              <span className="mt-1.5 text-[10px] font-bold text-accent">
                Ajouter
              </span>
            </Link>

            {items.slice(2).map((item) => {
              const isCreateMatchRoute =
                pathname === "/matches/new" ||
                pathname.startsWith("/matches/new/") ||
                pathname === "/supertiebreak/new" ||
                pathname.startsWith("/supertiebreak/new/");

              const isMatchDetailRoute =
                (pathname.startsWith("/matches/") ||
                  pathname.startsWith("/supertiebreak/")) &&
                !isCreateMatchRoute;

              const active =
                pathname === item.href ||
                (item.href === "/matches" &&
                  (pathname === "/supertiebreak" || isMatchDetailRoute)) ||
                (item.href === "/ranking" &&
                  pathname.startsWith("/ranking/")) ||
                (item.href === "/profile" &&
                  pathname.startsWith("/profile/")) ||
                (item.href === "/dashboard" &&
                  pathname.startsWith("/dashboard/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-1.5"
                >
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`relative grid h-10 w-10 place-items-center rounded-xl transition-colors duration-200 ${
                      active
                        ? "bg-accent text-[#0b0d13] shadow-[0_0_22px_var(--accent-glow)]"
                        : "text-muted group-hover:bg-white/5 group-hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="bottom-nav-active"
                        className="absolute inset-0 rounded-xl bg-accent shadow-[0_0_22px_var(--accent-glow)]"
                        transition={{ type: "spring", stiffness: 520, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{item.icon}</span>
                  </motion.span>
                  <motion.span
                    animate={{ opacity: active ? 1 : 0.78 }}
                    transition={{ duration: 0.18 }}
                    className={`mt-1.5 max-w-full truncate text-[10px] font-semibold tracking-tight ${
                      active ? "text-accent" : "text-muted"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
