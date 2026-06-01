import { prisma } from "./prisma";
import { getUser } from "./auth";
import { getLevelFromXP } from "./xp";
import type { User } from "@prisma/client";

/**
 * Admins are an allowlist of emails set via the ADMIN_EMAILS env var
 * (comma-separated). Kept out of the DB so promoting/revoking access is a
 * config change, not a migration — and no schema column can be tampered with.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Returns the current user only if they are an admin, otherwise null. */
export async function requireAdmin(): Promise<User | null> {
  const user = await getUser();
  if (!user || !isAdmin(user.email)) return null;
  return user;
}

const WINDOW_DAYS = 30;

export interface DayPoint {
  date: string; // "YYYY-MM-DD" (UTC)
  count: number;
}

export interface AdminStats {
  generatedAt: string; // ISO — when this snapshot was computed
  totals: {
    users: number;
    paths: number;
    lessonsCompleted: number;
    activeStreaks: number;
    feedback: number;
  };
  engagement: {
    activeLearners7d: number; // distinct learners who completed a lesson in 7d
    completionRate: number; // % of started lessons that are completed (0-100)
    totalXp: number; // XP earned across the platform
    avgLessonsPerLearner: number; // lessons completed / learners (1dp)
  };
  deltas: {
    signups: WoW; // current 7d vs prior 7d
    lessons: WoW;
  };
  signups: DayPoint[]; // last 30 days (client slices to 7/14/30)
  lessons: DayPoint[]; // lessons completed, last 30 days
  topSkills: { skill: string; count: number }[];
  levels: { level: number; count: number }[]; // learner level distribution
  topLearners: { id: string; name: string | null; email: string; xp: number; level: number }[];
  feedbackCounts: { idea: number; bug: number; other: number; total: number };
  recentFeedback: {
    id: string;
    category: string;
    message: string;
    email: string | null;
    name: string | null;
    createdAt: string;
  }[];
}

export interface WoW {
  current: number; // this 7-day window
  prev: number; // the 7 days before that
}

/** Builds an ascending list of the last `n` UTC day-keys ("YYYY-MM-DD"). */
function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

/**
 * One round-trip's worth of platform-wide metrics for the admin dashboard.
 * Bucketing is done in JS (UTC) — fine at this scale and keeps it portable
 * across Postgres without raw SQL.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const window = lastNDays(WINDOW_DAYS);
  // Day-key sets for week-over-week comparison (last 7 vs the 7 before).
  const last14 = lastNDays(14);
  const last7 = new Set(last14.slice(7));
  const prev7 = new Set(last14.slice(0, 7));

  const [users, completed, totalProgress, paths, activeStreaks, topLearnerRows, feedbackGroups, feedbackTotal, recent] =
    await Promise.all([
      prisma.user.findMany({ select: { createdAt: true, totalXp: true } }),
      prisma.userProgress.findMany({
        where: { completed: true },
        select: { completedOn: true, userId: true },
      }),
      prisma.userProgress.count(),
      prisma.learningPath.findMany({ select: { skill: true } }),
      prisma.streak.count({ where: { current: { gt: 0 } } }),
      prisma.user.findMany({
        orderBy: { totalXp: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, totalXp: true },
      }),
      prisma.feedback.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.feedback.count(),
      prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { email: true, name: true } } },
      }),
    ]);

  // Signups bucketed across the 30-day window (+ WoW totals).
  const signupBuckets = new Map<string, number>(window.map((d) => [d, 0]));
  const signupWoW: WoW = { current: 0, prev: 0 };
  for (const u of users) {
    const key = u.createdAt.toISOString().split("T")[0];
    if (signupBuckets.has(key)) signupBuckets.set(key, signupBuckets.get(key)! + 1);
    if (last7.has(key)) signupWoW.current += 1;
    else if (prev7.has(key)) signupWoW.prev += 1;
  }

  // Lessons completed bucketed across the window (+ WoW + active learners).
  const lessonBuckets = new Map<string, number>(window.map((d) => [d, 0]));
  const lessonWoW: WoW = { current: 0, prev: 0 };
  const active7 = new Set<string>();
  for (const p of completed) {
    if (!p.completedOn) continue;
    if (lessonBuckets.has(p.completedOn)) lessonBuckets.set(p.completedOn, lessonBuckets.get(p.completedOn)! + 1);
    if (last7.has(p.completedOn)) {
      lessonWoW.current += 1;
      active7.add(p.userId);
    } else if (prev7.has(p.completedOn)) {
      lessonWoW.prev += 1;
    }
  }

  const signups = window.map((date) => ({ date, count: signupBuckets.get(date)! }));
  const lessons = window.map((date) => ({ date, count: lessonBuckets.get(date)! }));

  const totalXp = users.reduce((s, u) => s + u.totalXp, 0);
  const engagement = {
    activeLearners7d: active7.size,
    completionRate: totalProgress > 0 ? Math.round((completed.length / totalProgress) * 100) : 0,
    totalXp,
    avgLessonsPerLearner: users.length > 0 ? Math.round((completed.length / users.length) * 10) / 10 : 0,
  };

  const topLearners = topLearnerRows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    xp: u.totalXp,
    level: getLevelFromXP(u.totalXp),
  }));

  // Top skills — grouped case-insensitively, displayed by first-seen casing.
  const skillCounts = new Map<string, { display: string; count: number }>();
  for (const { skill } of paths) {
    const key = skill.trim().toLowerCase();
    const entry = skillCounts.get(key);
    if (entry) entry.count += 1;
    else skillCounts.set(key, { display: skill.trim(), count: 1 });
  }
  const topSkills = [...skillCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ display, count }) => ({ skill: display, count }));

  // Learner level distribution.
  const levelCounts = new Map<number, number>();
  for (const u of users) {
    const lvl = getLevelFromXP(u.totalXp);
    levelCounts.set(lvl, (levelCounts.get(lvl) ?? 0) + 1);
  }
  const levels = [...levelCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, count]) => ({ level, count }));

  const fc = { idea: 0, bug: 0, other: 0 };
  for (const g of feedbackGroups) {
    if (g.category === "bug") fc.bug = g._count._all;
    else if (g.category === "other") fc.other = g._count._all;
    else fc.idea += g._count._all; // "idea" + any legacy/unknown category
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      users: users.length,
      paths: paths.length,
      lessonsCompleted: completed.length,
      activeStreaks,
      feedback: feedbackTotal,
    },
    engagement,
    deltas: { signups: signupWoW, lessons: lessonWoW },
    signups,
    lessons,
    topSkills,
    levels,
    topLearners,
    feedbackCounts: { ...fc, total: feedbackTotal },
    recentFeedback: recent.map((f) => ({
      id: f.id,
      category: f.category,
      message: f.message,
      email: f.user?.email ?? null,
      name: f.user?.name ?? null,
      createdAt: f.createdAt.toISOString(),
    })),
  };
}
