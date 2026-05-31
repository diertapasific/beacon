"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export type GlowState =
  | "idle"
  | "celebrate"
  | "thinking"
  | "correct"
  | "wrong"
  | "streak"
  | "level_up"
  | "sleeping";

const ANIM: Record<GlowState, { file: string; loop: boolean }> = {
  idle:      { file: "/mascot/glow_01_idle_breathe.json",    loop: true  },
  celebrate: { file: "/mascot/glow_02_happy_celebrate.json", loop: false },
  thinking:  { file: "/mascot/glow_03_thinking.json",        loop: true  },
  correct:   { file: "/mascot/glow_04_correct.json",         loop: false },
  wrong:     { file: "/mascot/glow_05_wrong.json",           loop: false },
  streak:    { file: "/mascot/glow_06_streak_active.json",   loop: true  },
  level_up:  { file: "/mascot/glow_07_level_up.json",        loop: false },
  sleeping:  { file: "/mascot/glow_08_sleeping.json",        loop: true  },
};

export function Mascot({
  state = "idle",
  size = 120,
  className = "",
}: {
  state?: GlowState;
  size?: number;
  className?: string;
}) {
  const [data, setData] = useState<object | null>(null);
  const { file, loop } = ANIM[state];

  useEffect(() => {
    setData(null);
    fetch(file)
      .then((r) => r.json())
      .then(setData);
  }, [file]);

  // Stable placeholder so layout doesn't jump while fetching
  if (!data) return <div style={{ width: size, height: size }} className={className} />;

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
