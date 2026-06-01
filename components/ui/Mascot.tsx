import Image from "next/image";

export type GlowState =
  | "idle"
  | "celebrate"
  | "thinking"
  | "correct"
  | "wrong"
  | "streak"
  | "level_up"
  | "sleeping";

const GIF: Record<GlowState, string> = {
  idle:      "/mascot/glow_01_idle_breathe.gif",
  celebrate: "/mascot/glow_02_happy_celebrate.gif",
  thinking:  "/mascot/glow_03_thinking.gif",
  correct:   "/mascot/glow_04_correct.gif",
  wrong:     "/mascot/glow_05_wrong.gif",
  streak:    "/mascot/glow_06_streak_active.gif",
  level_up:  "/mascot/glow_07_level_up.gif",
  sleeping:  "/mascot/glow_08_sleeping.gif",
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
  return (
    <Image
      key={state}
      src={GIF[state]}
      alt="Glow mascot"
      width={size}
      height={size}
      unoptimized
      className={className}
    />
  );
}
