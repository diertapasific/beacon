import { genAI, GEN_MODEL, buildPhasePrompt, parsePhaseResponse, getPathStructure } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { Prisma, LessonType } from "@prisma/client";

export const maxDuration = 60;

const VALID_TYPES = new Set<string>(Object.values(LessonType));
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pathId: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { pathId } = await params;
  const { phaseNumber } = await req.json().catch(() => ({}));

  if (!phaseNumber || typeof phaseNumber !== "number") {
    return Response.json({ error: "phaseNumber required" }, { status: 400 });
  }

  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    include: {
      lessons: { orderBy: [{ phaseNumber: "asc" }, { order: "asc" }] },
    },
  });

  if (!path || path.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (phaseNumber > path.totalPhases) {
    return Response.json({ error: "Phase exceeds planned total" }, { status: 400 });
  }

  // Idempotent — if already generated just return ok
  if (path.lessons.some((l) => l.phaseNumber === phaseNumber)) {
    return Response.json({ ok: true });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Generation not configured" }, { status: 503 });
  }

  try {
    const { minLessons, maxLessons } = getPathStructure(path.level, path.hoursPerWeek);
    // Pass all existing lesson headlines so the model doesn't repeat covered topics
    const coveredTopics = path.lessons.map((l) => l.headline);

    const model = genAI.getGenerativeModel({
      model: GEN_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 12000,
        temperature: 0.7,
      },
    });

    const responseText = await withRetry(async () => {
      const result = await model.generateContent(
        buildPhasePrompt(
          path.skill, path.level, path.hoursPerWeek,
          path.goal ?? undefined, phaseNumber, path.totalPhases,
          minLessons, maxLessons, coveredTopics
        )
      );
      return result.response.text();
    });

    const phase = parsePhaseResponse(responseText, phaseNumber);

    await prisma.lesson.createMany({
      data: phase.lessons.map((lesson) => ({
        pathId,
        phaseNumber: phase.phase,
        order: lesson.order,
        type: coerceType(lesson.type),
        headline: lesson.headline,
        coreIdea: lesson.coreIdea,
        example: lesson.example,
        realWorldUse: lesson.realWorldUse,
        estimatedSec: lesson.estimatedSec ?? 90,
        quiz: lesson.quiz as unknown as Prisma.InputJsonValue,
      })),
    });

    // Append the new phase to rawJson so phaseThemes stays in sync on the dashboard
    const existing = path.rawJson as { skill: string; totalPhases: number; phases: unknown[] };
    await prisma.learningPath.update({
      where: { id: pathId },
      data: {
        rawJson: {
          ...existing,
          phases: [...(existing.phases ?? []), { phase: phase.phase, theme: phase.theme, lessons: phase.lessons }],
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 0;
    if (status === 429 || status === 503) {
      return Response.json(
        { error: "AI is over capacity. Please try again in a moment.", code: "rate_limited" },
        { status: 429 }
      );
    }
    console.error("Phase generation failed:", err);
    return Response.json({ error: "Generation failed, please try again" }, { status: 500 });
  }
}
