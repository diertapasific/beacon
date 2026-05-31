"use client";

import { motion } from "framer-motion";

export function XPBar({
  level,
  progressPct,
  toNext,
  totalXp,
}: {
  level: number;
  progressPct: number;
  toNext: number;
  totalXp: number;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-ink text-accent-300 text-xs font-bold font-mono">
            {level}
          </span>
          <span className="text-sm font-medium text-zinc-600">Level {level}</span>
        </div>
        <span className="font-mono text-xs text-zinc-500 tabular-nums">
          {totalXp.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-zinc-200 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-accent-600"
        />
      </div>
      <p className="mt-1.5 text-xs text-zinc-400">
        {toNext > 0 ? `${toNext.toLocaleString()} XP to level ${level + 1}` : "Max level reached"}
      </p>
    </div>
  );
}
