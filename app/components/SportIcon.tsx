import type { SportMode } from "@/app/context/SportModeContext";

type SportIconProps = {
  sport: SportMode;
  className?: string;
};

export default function SportIcon({
  sport,
  className = "h-5 w-5",
}: SportIconProps) {
  if (sport === "tennis") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path
          strokeLinecap="round"
          d="M7 6.5c2.5 1.5 3.5 4 3.5 5.5S9.5 16 7 17.5M17 6.5c2.5 1.5 3.5 4 3.5 5.5s-1 4-3.5 5.5"
        />
      </svg>
    );
  }

  if (sport === "padel") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <rect
          x="4"
          y="3"
          width="16"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M4 8h16M4 16h16M8 3v5M16 3v5M8 16v5M16 16v5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }

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
      <path d="M12.5 3.5c.8 3.1-1.7 4.6-3.2 6.5-1.5 1.8-1.9 3.7-.8 5.6 1 1.7 2.8 2.7 4.7 2.7 3.5 0 6.3-2.7 6.3-6.1 0-3.1-2-5.5-4.3-7.2.2 2.1-.8 3.2-1.9 4.1.2-2.5-.3-4.3-.8-5.6Z" />
      <path d="M10.4 17.1c-.7 1.1-.5 2.4.4 3.3" />
    </svg>
  );
}