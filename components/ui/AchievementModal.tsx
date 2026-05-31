"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { Stamp } from "./Riso";

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
      colors: ["#ff9600", "#1cb0f6", "#ffc800", "#ff4b4b"],
    });
  }, [achievement.type]);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[#05060f]/85 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0, opacity: 0, rotate: -4 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="relative w-full max-w-sm rounded-2xl bg-cream p-8 text-center border-2 border-line shadow-hard-lg"
      >
        <Stamp spin={12} tone="clay" className="absolute -top-4 -right-4 w-16 h-16 bg-sun-tint shadow-hard-sm">
          Nice one
        </Stamp>

        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">
          Achievement unlocked
        </p>
        <motion.div
          initial={{ rotate: -12, scale: 0.6 }}
          animate={{ rotate: -4, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className="mx-auto my-5 grid place-items-center w-20 h-20 rounded-2xl bg-clay text-cream border-2 border-line shadow-hard"
        >
          <Icon name={achievement.icon} size={40} weight="fill" />
        </motion.div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{achievement.label}</h2>
        <p className="mt-1 text-sm text-ink-soft">{achievement.desc}</p>
        <Button onClick={onClose} className="mt-6 w-full">
          Keep going
        </Button>
      </motion.div>
    </motion.div>
  );
}
