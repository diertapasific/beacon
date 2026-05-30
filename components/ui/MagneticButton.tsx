"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode, MouseEvent } from "react";

// Magnetic CTA — pulls toward the cursor. Uses motion values (NOT useState)
// so pointer moves never trigger React re-renders. MOTION_INTENSITY 6.
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
  const springX = useSpring(x, { stiffness: 200, damping: 18 });
  const springY = useSpring(y, { stiffness: 200, damping: 18 });

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.3);
    y.set(relY * 0.3);
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
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl h-14 px-8 text-base
        font-semibold tracking-tight bg-ink text-canvas
        shadow-[0_8px_24px_-8px_rgba(28,25,23,0.5)] focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-accent-400 ${className}`}
    >
      {children}
    </motion.button>
  );
}
