import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { updateStreak } from "@/lib/streak";
import { getLevelFromXP } from "@/lib/xp";
import { XP_REWARDS } from "@/lib/xp";
import { checkAchievements } from "@/lib/achievements";
import type { QuizQuestion } from "@/lib/groq";

const PASS_THRESHOLD = 80; // BRD: >=80% to pass a micro-lesson quiz

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { answers } = await req.json().catch(() => ({ answers: [] }));
  const selected: string[] = Array.isArray(answers) ? answers : [];

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });

  const quiz = lesson.quiz as unknown as QuizQuestion[];
  const results = quiz.map((q, i) => ({
    correct: selected[i] === q.correct,
    expected: q.correct,
  }));
  const correctCount = results.filter((r) => r.correct).length;
  const score = quiz.length ? Math.round((correctCount / quiz.length) * 100) : 0;
  const passed = score >= PASS_THRESHOLD;
  const today = new Date().toISOString().split("T")[0];

  // XP for correct answers is always awarded.
  let xpEarned = correctCount * XP_REWARDS.CORRECT_ANSWER;

  if (!passed) {
    // Record the attempt, never block retries.
    await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: id } },
      update: { score, attempts: { increment: 1 } },
      create: { userId: user.id, lessonId: id, completed: false, score, attempts: 1 },
    });

    return Response.json({
      passed: false,
      score,
      xpEarned,
      results,
      message:
        score >= 50 ? "Almost there — give it another go." : "Review the lesson and try again.",
    });
  }

  // Lessons completed today before this one (for the 1.5x bonus after #2).
  const completedToday = await prisma.userProgress.count({
    where: { userId: user.id, completedOn: today, completed: true },
  });

  xpEarned +=
    completedToday >= 2 ? XP_REWARDS.LESSON_COMPLETE_BONUS : XP_REWARDS.LESSON_COMPLETE;

  await prisma.userProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: id } },
    update: {
      completed: true,
      score,
      completedAt: new Date(),
      completedOn: today,
      attempts: { increment: 1 },
    },
    create: {
      userId: user.id,
      lessonId: id,
      completed: true,
      score,
      completedAt: new Date(),
      completedOn: today,
      attempts: 1,
    },
  });

  const streak = await updateStreak(user.id);
  if (streak.current > 0 && streak.current % 7 === 0) {
    xpEarned += XP_REWARDS.STREAK_MILESTONE;
  }

  const prevXp = user.totalXp;
  const newXp = prevXp + xpEarned;
  const newLevel = getLevelFromXP(newXp);
  const leveledUp = newLevel > getLevelFromXP(prevXp);

  await prisma.user.update({
    where: { id: user.id },
    data: { totalXp: newXp, level: newLevel },
  });

  const unlockedAchievements = await checkAchievements(user.id, streak.current, newLevel);

  return Response.json({
    passed: true,
    score,
    xpEarned,
    results,
    leveledUp,
    newLevel,
    newXp,
    streak: streak.current,
    bonusXpActive: completedToday >= 2,
    unlockedAchievements,
  });
}
