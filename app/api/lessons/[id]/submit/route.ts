import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { updateStreak } from "@/lib/streak";
import { getLevelFromXP } from "@/lib/xp";
import { XP_REWARDS } from "@/lib/xp";
import { checkAchievements } from "@/lib/achievements";
import type { QuizQuestion } from "@/lib/groq";

const PASS_THRESHOLD = 80; // BRD: >=80% to pass a micro-lesson quiz

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { answers } = await req.json().catch(() => ({ answers: [] }));
  const selected: string[] = Array.isArray(answers) ? answers : [];

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) return Response.json({ error: "Lesson not found" }, { status: 404 });

  const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

  function editDistance(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  const resolveCorrect = (q: QuizQuestion): string => {
    const opts: string[] = Array.isArray(q.options) ? q.options.map(String) : [];
    const direct = opts.find((o) => norm(o) === norm(q.correct));
    if (direct) return direct;
    const letterIdx = ["a", "b", "c", "d"].indexOf(norm(q.correct));
    if (letterIdx !== -1 && opts[letterIdx]) return opts[letterIdx];
    const numIdx = parseInt(q.correct, 10) - 1;
    if (!isNaN(numIdx) && opts[numIdx]) return opts[numIdx];
    // For long strings (e.g. sequence options) find closest option by edit distance
    if (opts.length > 0 && q.correct.length > 15) {
      const nc = norm(q.correct);
      const best = opts.reduce((b, o) =>
        editDistance(norm(o), nc) < editDistance(norm(b), nc) ? o : b
      , opts[0]);
      if (editDistance(norm(best), nc) < nc.length * 0.5) return best;
    }
    return q.correct;
  };

  const quiz = lesson.quiz as unknown as QuizQuestion[];
  const results = quiz.map((q, i) => {
    const answer = selected[i] ?? "";
    const correctStr = String(q.correct ?? "");

    if (q.type === "matching") {
      const opts: string[] = Array.isArray(q.options) ? q.options.map(String) : [];
      // Mirror MatchingCard's old/new format detection exactly
      const termMatch = String(q.question).match(/terms?[:\s]+(.+)/i);
      const extractedTerms = termMatch
        ? termMatch[1].split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
        : [];
      const isOldFormat = extractedTerms.length > 0 && extractedTerms.length === opts.length;
      const terms = isOldFormat ? extractedTerms : opts.slice(0, Math.floor(opts.length / 2));
      const defs  = isOldFormat ? opts            : opts.slice(Math.floor(opts.length / 2));

      // Build correct pairs the same way MatchingCard does
      const correctPairs: Record<string, string> = isOldFormat
        ? Object.fromEntries(terms.map((t: string, i: number) => [norm(t), norm(defs[i] ?? "")]))
        : Object.fromEntries(
            correctStr.split(",").filter(Boolean).map((p) => {
              const [t, d] = p.split(":").map((s) => s.trim());
              return [norm(t ?? ""), norm(d ?? "")];
            })
          );

      // User answer: "term:def,term:def,..."
      const userPairs = Object.fromEntries(
        answer.split(",").filter(Boolean).map((p) => {
          const [t, d] = p.split(":").map((s) => s.trim());
          return [norm(t ?? ""), norm(d ?? "")];
        })
      );

      const isCorrect = Object.keys(correctPairs).length > 0 &&
        Object.keys(correctPairs).every((t) => userPairs[t] === correctPairs[t]);
      return { correct: isCorrect, expected: correctStr };
    }

    if (q.type === "sequence") {
      // If correct has no "|", Groq generated full-sequence options (pick-the-right-one)
      if (!correctStr.includes("|")) {
        const correct = resolveCorrect(q); // finds closest option even if phrasing differs
        return { correct: norm(answer) === norm(correct), expected: correct };
      }
      const correctSeq = correctStr.split("|").map((s) => norm(s.trim()));
      const userSeq    = answer.split("|").map((s) => norm(s.trim()));
      const isCorrect  = correctSeq.length === userSeq.length && correctSeq.every((s, i) => s === userSeq[i]);
      return { correct: isCorrect, expected: correctStr };
    }

    const correct = resolveCorrect(q);
    const isCorrect = norm(answer) === norm(correct);
    return { correct: isCorrect, expected: correct };
  });
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[submit] unhandled error:", stack ?? msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
