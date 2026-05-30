import { prisma } from "./prisma";

// `icon` maps to a Phosphor icon component name (rendered client-side).
// No emoji per project icon policy.
export const ACHIEVEMENTS = {
  first_lesson: { label: "First Step", icon: "Target", desc: "Completed your first lesson" },
  streak_7: { label: "Week Warrior", icon: "Flame", desc: "7-day streak" },
  streak_14: { label: "Fortnight Fire", icon: "Fire", desc: "14-day streak" },
  streak_21: { label: "Legendary", icon: "Crown", desc: "21-day streak" },
  streak_28: { label: "Unstoppable", icon: "Lightning", desc: "28-day streak" },
  perfect_week: { label: "Perfect Week", icon: "Sparkle", desc: "5+ lessons/day for 7 days" },
  speed_learner: { label: "Speed Learner", icon: "Rocket", desc: "5 lessons in one day" },
  accuracy_master: { label: "Accuracy Master", icon: "Crosshair", desc: "100% on 5 consecutive quizzes" },
  level_10: { label: "Level 10", icon: "Star", desc: "Reached Level 10" },
  level_25: { label: "Level 25", icon: "Diamond", desc: "Reached Level 25" },
  level_50: { label: "Max Level", icon: "Trophy", desc: "Reached Level 50" },
} as const;

export type AchievementType = keyof typeof ACHIEVEMENTS;

export interface UnlockedAchievement {
  type: AchievementType;
  label: string;
  icon: string;
  desc: string;
}

const DAY_KEY = () => new Date().toISOString().split("T")[0];

/**
 * Determines which achievements the user has newly earned, persists them,
 * and returns only the freshly-unlocked ones (for the celebration modal).
 */
export async function checkAchievements(
  userId: string,
  currentStreak: number,
  level: number
): Promise<UnlockedAchievement[]> {
  const [completedTotal, completedToday, existing] = await Promise.all([
    prisma.userProgress.count({ where: { userId, completed: true } }),
    prisma.userProgress.count({ where: { userId, completed: true, completedOn: DAY_KEY() } }),
    prisma.achievement.findMany({ where: { userId }, select: { type: true } }),
  ]);

  const owned = new Set(existing.map((a) => a.type));
  const eligible: AchievementType[] = [];

  if (completedTotal >= 1) eligible.push("first_lesson");
  if (completedToday >= 5) eligible.push("speed_learner");
  if (currentStreak >= 7) eligible.push("streak_7");
  if (currentStreak >= 14) eligible.push("streak_14");
  if (currentStreak >= 21) eligible.push("streak_21");
  if (currentStreak >= 28) eligible.push("streak_28");
  if (level >= 10) eligible.push("level_10");
  if (level >= 25) eligible.push("level_25");
  if (level >= 50) eligible.push("level_50");

  const fresh = eligible.filter((type) => !owned.has(type));
  if (fresh.length === 0) return [];

  await prisma.achievement.createMany({
    data: fresh.map((type) => ({ userId, type })),
    skipDuplicates: true,
  });

  return fresh.map((type) => ({ type, ...ACHIEVEMENTS[type] }));
}
