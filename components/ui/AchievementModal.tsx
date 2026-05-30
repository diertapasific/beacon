"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Icon } from "./Icon";
import { Button } from "./Button";

export interface UnlockedAchievement {
  type: string;
  label: string;
  icon: string;
  desc: string;
}

export function AchievementModal({
  achievement,
  onClose,
}: {
  achievement: UnlockedAchievement;
  onClose: () => void;
}) {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ["#f59e0b", "#fbbf24", "#1c1917", "#fde68a"],
    });
  }, [achievement.type]);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center
          shadow-[0_30px_60px_-20px_rgba(28,25,23,0.4)] border border-zinc-100"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">
          Achievement unlocked
        </p>
        <motion.div
          initial={{ rotate: -12, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className="mx-auto my-5 grid place-items-center w-20 h-20 rounded-3xl bg-accent-50 text-accent-500"
        >
          <Icon name={achievement.icon} size={40} weight="fill" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">{achievement.label}</h2>
        <p className="mt-1 text-sm text-zinc-500">{achievement.desc}</p>
        <Button onClick={onClose} className="mt-6 w-full">
          Keep going
        </Button>
      </motion.div>
    </motion.div>
  );
}
