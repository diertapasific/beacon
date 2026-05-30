import { prisma } from "./prisma";
import type { Streak } from "@prisma/client";

const DAY_MS = 86_400_000;

function dayKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Records today's activity against the user's streak.
 * - Same day already counted → no change.
 * - Last activity was yesterday → increment.
 * - Otherwise → reset to 1.
 */
export async function updateStreak(userId: string): Promise<Streak> {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - DAY_MS));
  const lastDate = streak?.lastCompletedAt ? dayKey(streak.lastCompletedAt) : null;

  if (lastDate === today) return streak!; // already updated today

  const newCurrent = lastDate === yesterday ? (streak?.current ?? 0) + 1 : 1;
  const newLongest = Math.max(newCurrent, streak?.longest ?? 0);

  return prisma.streak.upsert({
    where: { userId },
    update: { current: newCurrent, longest: newLongest, lastCompletedAt: new Date() },
    create: { userId, current: 1, longest: 1, lastCompletedAt: new Date() },
  });
}

export async function getStreak(userId: string): Promise<Streak | null> {
  return prisma.streak.findUnique({ where: { userId } });
}
