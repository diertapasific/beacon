"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Tactile "physical" button — a solid bottom edge that compresses on press.
  primary:
    "bg-accent-400 text-ink shadow-[0_4px_0_var(--color-accent-600)] hover:bg-accent-400/90 active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-accent-600)]",
  secondary:
    "bg-white text-ink border border-zinc-200 shadow-[0_4px_0_#e4e4e7] hover:border-zinc-300 active:translate-y-[3px] active:shadow-[0_1px_0_#e4e4e7]",
  ghost: "text-zinc-600 hover:text-ink hover:bg-zinc-100 active:scale-[0.98]",
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
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight
        transition-[transform,box-shadow,background-color] duration-100 ease-out
        disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-ink/20 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
