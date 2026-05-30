import { prisma } from "./prisma";
import { getStreak } from "./streak";
import { getLevelFromXP, getProgressToNextLevel, getXpToNextLevel } from "./xp";
import { ACHIEVEMENTS, type AchievementType } from "./achievements";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export interface LessonSummary {
  id: string;
  weekNumber: number;
  order: number;
  type: string;
  headline: string;
  estimatedSec: number;
  completed: boolean;
  score: number;
  locked: boolean;
}

export interface DashboardData {
  name: string | null;
  xp: { total: number; level: number; progressPct: number; toNext: number };
  streak: { current: number; longest: number; lastCompletedAt: string | null };
  path: { skill: string; level: string; goal: string | null };
  lessons: LessonSummary[];
  nextLessonId: string | null;
  completedToday: number;
  totalCompleted: number;
  totalLessons: number;
  bonusXpActive: boolean;
  allDone: boolean;
  achievements: { type: string; label: string; icon: string; desc: string; unlockedAt: string }[];
}

/**
 * Single source of truth for everything the dashboard renders. Reused by the
 * /api/progress and /api/lessons/today routes so client and server stay in sync.
 * Returns null when the user has no learning path yet (→ send to onboarding).
 */
export async function getDashboardData(userId: string): Promise<DashboardData | null> {
  const today = todayKey();

  const [user, path, streak, achievements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.learningPath.findUnique({
      where: { userId },
      include: {
        lessons: {
          orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
          include: { progress: { where: { userId } } },
        },
      },
    }),
    getStreak(userId),
    prisma.achievement.findMany({ where: { userId }, orderBy: { unlockedAt: "desc" } }),
  ]);

  if (!user || !path) return null;

  // First uncompleted lesson is "next"; everything after it is locked (sequential).
  const nextIndex = path.lessons.findIndex((l) => !l.progress[0]?.completed);
  const nextLesson = nextIndex >= 0 ? path.lessons[nextIndex] : null;

  const lessons: LessonSummary[] = path.lessons.map((l, i) => ({
    id: l.id,
    weekNumber: l.weekNumber,
    order: l.order,
    type: l.type,
    headline: l.headline,
    estimatedSec: l.estimatedSec,
    completed: !!l.progress[0]?.completed,
    score: l.progress[0]?.score ?? 0,
    locked: nextIndex >= 0 && i > nextIndex,
  }));

  const completedToday = path.lessons.filter((l) => l.progress[0]?.completedOn === today).length;
  const totalCompleted = lessons.filter((l) => l.completed).length;

  return {
    name: user.name,
    xp: {
      total: user.totalXp,
      level: getLevelFromXP(user.totalXp),
      progressPct: getProgressToNextLevel(user.totalXp),
      toNext: getXpToNextLevel(user.totalXp),
    },
    streak: {
      current: streak?.current ?? 0,
      longest: streak?.longest ?? 0,
      lastCompletedAt: streak?.lastCompletedAt?.toISOString() ?? null,
    },
    path: { skill: path.skill, level: path.level, goal: path.goal },
    lessons,
    nextLessonId: nextLesson?.id ?? null,
    completedToday,
    totalCompleted,
    totalLessons: lessons.length,
    bonusXpActive: completedToday >= 2,
    allDone: nextLesson === null,
    achievements: achievements.map((a) => {
      const meta = ACHIEVEMENTS[a.type as AchievementType] ?? {
        label: a.type,
        icon: "Medal",
        desc: "",
      };
      return { type: a.type, ...meta, unlockedAt: a.unlockedAt.toISOString() };
    }),
  };
}
