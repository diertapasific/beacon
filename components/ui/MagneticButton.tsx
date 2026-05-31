"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode, MouseEvent } from "react";

// Magnetic CTA — pulls toward the cursor via motion values (never useState, so
// pointer moves don't re-render). Hard ink shadow stays put for the sticker feel.
export function MagneticButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.35);
    y.set(relY * 0.35);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl h-14 px-8 text-base
        font-extrabold uppercase tracking-wide bg-clay text-cream border-2 border-transparent shadow-hard-clay
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40
        focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${className}`}
    >
      {children}
    </motion.button>
  );
}
