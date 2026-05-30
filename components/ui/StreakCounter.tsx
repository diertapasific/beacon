"use client";

import { motion } from "framer-motion";
import { Flame } from "@phosphor-icons/react";

// Perpetual "breathing" flame. Isolated client component so the loop never
// re-renders any parent layout.
export function StreakCounter({ days }: { days: number }) {
  const active = days > 0;
  return (
    <div className="inline-flex items-center gap-2">
      <motion.span
        aria-hidden
        animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className={active ? "text-accent-500" : "text-zinc-300"}
      >
        <Flame size={26} weight="fill" />
      </motion.span>
      <span className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold tabular-nums text-ink">{days}</span>
        <span className="text-sm text-zinc-500">day{days === 1 ? "" : "s"}</span>
      </span>
    </div>
  );
}
