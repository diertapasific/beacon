import { genAI, GEN_MODEL, buildPhasePrompt, parsePhaseResponse, getPathStructure } from "@/lib/ai";
import type { GeneratedPath } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { Prisma, LessonType } from "@prisma/client";

export const maxDuration = 60;

const VALID_TYPES = new Set<string>(Object.values(LessonType));
const VALID_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const DAILY_PATH_LIMIT = 5;

function coerceType(type: string): LessonType {
  return VALID_TYPES.has(type) ? (type as LessonType) : LessonType.concept_card;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status ?? 0;
      const retriable = status === 429 || status === 503;
      if (retriable && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { coveredTopics, goal } = body;

  // Validate and sanitize inputs before they reach the AI prompt.
  const rawLevel = String(body.level ?? "").toLowerCase();
  if (!VALID_LEVELS.has(rawLevel)) {
    return Response.json({ error: "level must be beginner, intermediate, or advanced" }, { status: 400 });
  }

  const rawSkill = String(body.skill ?? "").trim().replace(/[\n\r\t]/g, " ").slice(0, 100);
  if (!rawSkill) {
    return Response.json({ error: "skill is required" }, { status: 400 });
  }

  const rawHours = Number(body.hoursPerWeek);
  if (!Number.isInteger(rawHours) || rawHours < 1 || rawHours > 20) {
    return Response.json({ error: "hoursPerWeek must be an integer between 1 and 20" }, { status: 400 });
  }

  const rawGoal = goal
    ? String(goal).trim().replace(/[\n\r\t]/g, " ").slice(0, 500)
    : undefined;

  const covered: string[] = Array.isArray(coveredTopics) ? coveredTopics : [];

  // Per-user daily generation limit.
  const todayStart = new Date(new Date().toISOString().split("T")[0]);
  const pathsToday = await prisma.learningPath.count({
    where: { userId: user.id, createdAt: { gte: todayStart } },
  });
  if (pathsToday >= DAILY_PATH_LIMIT) {
    return Response.json(
      { error: `Daily path limit reached (${DAILY_PATH_LIMIT}/day). Come back tomorrow.`, code: "rate_limited" },
      { status: 429 }
    );
  }

  // Idempotency: if a path with the same skill+level was created by this user
  // in the last 2 minutes, return the existing one. This prevents duplicates
  // when the client retries after a network error that occurred after the
  // server had already persisted the path (generation can take ~30–60 s).
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1_000);
  const recentDuplicate = await prisma.learningPath.findFirst({
    where: {
      userId: user.id,
      skill: rawSkill,
      level: rawLevel,
      createdAt: { gte: twoMinutesAgo },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  if (recentDuplicate) {
    return Response.json({ pathId: recentDuplicate.id });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Generation is not available" }, { status: 503 });
  }

  try {
    const { phaseCount, minLessons, maxLessons } = getPathStructure(rawLevel, rawHours);

    const model = genAI.getGenerativeModel({
      model: GEN_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 12000,
        temperature: 0.7,
      },
    });

    const phase1Raw = await withRetry(async () => {
      const result = await model.generateContent(
        buildPhasePrompt(rawSkill, rawLevel, rawHours, rawGoal, 1, phaseCount, minLessons, maxLessons, covered)
      );
      return result.response.text();
    });

    const phase1 = parsePhaseResponse(phase1Raw, 1);

    const parsed: GeneratedPath = {
      skill: rawSkill,
      totalPhases: phaseCount,
      phases: [phase1],
    };

    const path = await prisma.learningPath.create({
      data: {
        userId: user.id,
        skill: rawSkill,
        level: rawLevel,
        hoursPerWeek: rawHours,
        goal: rawGoal ?? null,
        rawJson: parsed as unknown as Prisma.InputJsonValue,
        totalPhases: phaseCount,
        lessons: {
          create: phase1.lessons.map((lesson) => ({
            phaseNumber: phase1.phase,
            order: lesson.order,
            type: coerceType(lesson.type),
            headline: lesson.headline,
            coreIdea: lesson.coreIdea,
            example: lesson.example,
            realWorldUse: lesson.realWorldUse,
            estimatedSec: lesson.estimatedSec ?? 90,
            quiz: lesson.quiz as unknown as Prisma.InputJsonValue,
          })),
        },
      },
    });

    return Response.json({ pathId: path.id });
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 0;
    if (status === 429 || status === 503) {
      return Response.json(
        { error: "Beacon's AI is over capacity right now. Please try again in a minute.", code: "rate_limited" },
        { status: 429 }
      );
    }
    console.error("Path generation failed:", err);
    return Response.json({ error: "Generation failed, please try again" }, { status: 500 });
  }
}
