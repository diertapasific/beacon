// XP rewards and non-linear level thresholds.

export const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  LESSON_COMPLETE: 50,
  LESSON_COMPLETE_BONUS: 75, // 1.5x after lesson #2 per day
  DAILY_CHALLENGE: 100,
  STREAK_MILESTONE: 50, // every 7-day milestone
} as const;

export const MAX_LEVEL = 50;

// Cumulative XP required to reach each level (index 0 = Level 1).
export const LEVEL_THRESHOLDS: number[] = [
  0, // L1 starts at 0
  ...Array.from({ length: 10 }, (_, i) => (i + 1) * 100), // L2-11 boundaries: 100 XP each
  ...Array.from({ length: 20 }, (_, i) => 1000 + (i + 1) * 200), // 200 XP each
  ...Array.from({ length: 20 }, (_, i) => 5000 + (i + 1) * 400), // 400 XP each
];

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, MAX_LEVEL);
}

/** Percentage (0-100) of progress from the current level toward the next. */
export function getProgressToNextLevel(xp: number): number {
  const level = getLevelFromXP(xp);
  if (level >= MAX_LEVEL) return 100;
  const current = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level];
  return Math.round(((xp - current) / (next - current)) * 100);
}

/** Absolute XP needed to reach the next level (for "X XP to go" UI). */
export function getXpToNextLevel(xp: number): number {
  const level = getLevelFromXP(xp);
  if (level >= MAX_LEVEL) return 0;
  return LEVEL_THRESHOLDS[level] - xp;
}
