"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

// Duolingo buttons — solid fill with a 3D coloured bottom edge that sinks on press.
const VARIANTS: Record<Variant, string> = {
  primary:   "bg-clay text-cream border-2 border-transparent shadow-hard-clay press-clay",
  secondary: "bg-cream text-ink border-2 border-line shadow-hard press",
  ghost:     "text-ink border-2 border-transparent hover:bg-paper-2 active:scale-[0.97]",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-8 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold uppercase tracking-wide
        disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
