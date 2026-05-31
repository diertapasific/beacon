import type { ReactNode } from "react";

/* Shared playful decorations. Blobs are soft pastel shapes (multiply blend,
   blurred, pointer-events-none) that drift behind the UI. Stamps are friendly
   rounded badges with a tinted border. */

type Spot = "clay" | "teal" | "sun" | "ink";

const SPOT_BG: Record<Spot, string> = {
  clay: "bg-clay",
  teal: "bg-teal",
  sun: "bg-sun",
  ink: "bg-ink",
};

const BLOB_RADII = [
  "42% 58% 63% 37% / 41% 44% 56% 59%",
  "63% 37% 51% 49% / 37% 56% 44% 63%",
  "38% 62% 47% 53% / 62% 41% 59% 38%",
  "50% 50% 38% 62% / 56% 47% 53% 44%",
];

/**
 * Soft pastel shape — a blurred spot of colour that drifts behind the UI.
 * Multiply-blended so it tints the light surface gently. CSS-animated only.
 */
export function Blob({
  spot = "clay",
  shape = 0,
  spin = 0,
  motion = "drift",
  className = "",
}: {
  spot?: Spot;
  shape?: 0 | 1 | 2 | 3;
  spin?: number;
  motion?: "drift" | "float" | "none";
  className?: string;
}) {
  const anim = motion === "drift" ? "riso-drift" : motion === "float" ? "riso-float" : "";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute mix-blend-multiply blur-[64px] ${SPOT_BG[spot]} ${anim} ${className}`}
      style={{ borderRadius: BLOB_RADII[shape], ["--spin" as string]: `${spin}deg` }}
    />
  );
}

/** Friendly rounded badge — a tinted-border tag with a playful tilt. */
export function Stamp({
  children,
  spin = -8,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  spin?: number;
  tone?: Spot;
  className?: string;
}) {
  const ring =
    tone === "clay" ? "border-clay text-clay-deep"
    : tone === "teal" ? "border-teal text-teal-deep"
    : tone === "sun" ? "border-sun text-ink"
    : "border-line text-ink";
  return (
    <span
      className={`grid place-items-center rounded-2xl border-2 ${ring}
        font-extrabold text-[11px] uppercase tracking-wide text-center leading-tight ${className}`}
      style={{ transform: `rotate(${spin}deg)` }}
    >
      {children}
    </span>
  );
}
