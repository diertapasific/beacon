import { prisma } from "./prisma";
import { getStreak } from "./streak";
import { getLevelFromXP, getProgressToNextLevel, getXpToNextLevel } from "./xp";
import { ACHIEVEMENTS, type AchievementType } from "./achievements";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export interface LessonSummary {
  id: string;
  phaseNumber: number;
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
  path: { id: string; skill: string; level: string; goal: string | null };
  phaseThemes: Record<number, string>; // phaseNumber → short theme label
  lessons: LessonSummary[];
  nextLessonId: string | null;
  completedToday: number;
  totalCompleted: number;
  totalLessons: number;
  bonusXpActive: boolean;
  allDone: boolean;
  totalPhases: number;
  generatedPhases: number; // highest phaseNumber present in lessons
  nextPhaseNumber: number | null; // next phase to generate, null when all generated
  achievements: { type: string; label: string; icon: string; desc: string; unlockedAt: string }[];
}

export interface ProfileData {
  name: string | null;
  email: string;
  memberSince: string;
  xp: { total: number; level: number; progressPct: number; toNext: number };
  streak: { current: number; longest: number };
  totals: { paths: number; lessonsCompleted: number; achievements: number };
}

export interface PathSummary {
  id: string;
  skill: string;
  level: string;
  goal: string | null;
  createdAt: string;
  totalLessons: number;
  completedLessons: number;
}

/**
 * Single source of truth for everything the dashboard renders.
 * Requires an explicit pathId — works with multi-path accounts.
 * Returns null when the path doesn't exist or doesn't belong to the user.
 */
export async function getDashboardData(userId: string, pathId: string): Promise<DashboardData | null> {
  const today = todayKey();

  const [user, path, streak, achievements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        lessons: {
          orderBy: [{ phaseNumber: "asc" }, { order: "asc" }],
          include: { progress: { where: { userId } } },
        },
      },
    }),
    getStreak(userId),
    prisma.achievement.findMany({ where: { userId }, orderBy: { unlockedAt: "desc" } }),
  ]);

  if (!user || !path || path.userId !== userId) return null;

  const nextIndex = path.lessons.findIndex((l) => !l.progress[0]?.completed);
  const nextLesson = nextIndex >= 0 ? path.lessons[nextIndex] : null;

  const lessons: LessonSummary[] = path.lessons.map((l, i) => ({
    id: l.id,
    phaseNumber: l.phaseNumber,
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
  const generatedPhases = path.lessons.length > 0
    ? Math.max(...path.lessons.map((l) => l.phaseNumber))
    : 1;
  const totalPhases = path.totalPhases ?? 1;
  const nextPhaseNumber = generatedPhases < totalPhases ? generatedPhases + 1 : null;

  // Extract phase themes from rawJson (stored as GeneratedPath).
  // Falls back to the legacy `weeks` shape for paths generated before the rename.
  const phaseThemes: Record<number, string> = {};
  const raw = path.rawJson as {
    phases?: Array<{ phase: number; theme: string }>;
    weeks?: Array<{ week: number; theme: string }>;
  };
  const groups = raw.phases ?? raw.weeks?.map((w) => ({ phase: w.week, theme: w.theme })) ?? [];
  for (const g of groups) {
    // Trim everything after " — " to get just the short label e.g. "Foundations"
    phaseThemes[g.phase] = g.theme?.split(" — ")[0]?.trim() ?? `Phase ${g.phase}`;
  }

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
    path: { id: path.id, skill: path.skill, level: path.level, goal: path.goal },
    phaseThemes,
    lessons,
    nextLessonId: nextLesson?.id ?? null,
    completedToday,
    totalCompleted,
    totalLessons: lessons.length,
    bonusXpActive: completedToday >= 2,
    allDone: nextLesson === null && nextPhaseNumber === null,
    totalPhases,
    generatedPhases,
    nextPhaseNumber,
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

/** Account-level stats for the profile page. */
export async function getProfileData(userId: string): Promise<ProfileData | null> {
  const [user, streak, paths, lessonsCompleted, achievements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getStreak(userId),
    prisma.learningPath.count({ where: { userId } }),
    prisma.userProgress.count({ where: { userId, completed: true } }),
    prisma.achievement.count({ where: { userId } }),
  ]);

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    memberSince: user.createdAt.toISOString(),
    xp: {
      total: user.totalXp,
      level: getLevelFromXP(user.totalXp),
      progressPct: getProgressToNextLevel(user.totalXp),
      toNext: getXpToNextLevel(user.totalXp),
    },
    streak: { current: streak?.current ?? 0, longest: streak?.longest ?? 0 },
    totals: { paths, lessonsCompleted, achievements },
  };
}

/** Summary of all paths for the paths list page. */
export async function getUserPathsSummary(userId: string): Promise<PathSummary[]> {
  const paths = await prisma.learningPath.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      lessons: {
        include: { progress: { where: { userId } } },
      },
    },
  });

  return paths.map((p) => ({
    id: p.id,
    skill: p.skill,
    level: p.level,
    goal: p.goal,
    createdAt: p.createdAt.toISOString(),
    totalLessons: p.lessons.length,
    completedLessons: p.lessons.filter((l) => l.progress[0]?.completed).length,
  }));
}
