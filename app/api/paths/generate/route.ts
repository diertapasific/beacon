import { genAI, GEN_MODEL, buildPhasePrompt, parsePhaseResponse, getPathStructure } from "@/lib/groq";
import type { GeneratedPath } from "@/lib/groq";
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
      // 429 = rate limited, 503 = temporary high demand — both are retriable
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

  const { skill, level, hoursPerWeek, goal, coveredTopics } = await req.json().catch(() => ({}));
  if (!skill || !level || !hoursPerWeek) {
    return Response.json({ error: "skill, level and hoursPerWeek are required" }, { status: 400 });
  }
  const covered: string[] = Array.isArray(coveredTopics) ? coveredTopics : [];

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Generation is not configured (missing GEMINI_API_KEY)" }, { status: 503 });
  }

  try {
    const { phaseCount, minLessons, maxLessons } = getPathStructure(String(level), Number(hoursPerWeek));

    const model = genAI.getGenerativeModel({
      model: GEN_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 12000,
        temperature: 0.7,
      },
    });

    // Sequential — parallel bursts trigger 503s on Gemini free tier, which causes
    // retries that waste RPD. Sequential uses exactly 1 RPD per phase (~5 phases max).
    const phaseNums = Array.from({ length: phaseCount }, (_, i) => i + 1);
    const phaseContents: string[] = [];
    for (const phase of phaseNums) {
      const content = await withRetry(async () => {
        const result = await model.generateContent(
          buildPhasePrompt(skill, level, Number(hoursPerWeek), goal, phase, phaseCount, minLessons, maxLessons, covered)
        );
        return result.response.text();
      });
      phaseContents.push(content);
    }

    const phases = phaseContents.map((content, i) => parsePhaseResponse(content, i + 1));

    const parsed: GeneratedPath = {
      skill: String(skill),
      totalPhases: phaseCount,
      phases,
    };

    const path = await prisma.learningPath.create({
      data: {
        userId: user.id,
        skill: String(skill),
        level: String(level),
        hoursPerWeek: Number(hoursPerWeek),
        goal: goal ? String(goal) : null,
        rawJson: parsed as unknown as Prisma.InputJsonValue,
        lessons: {
          create: parsed.phases.flatMap((phase) =>
            phase.lessons.map((lesson) => ({
              phaseNumber: phase.phase,
              order: lesson.order,
              type: coerceType(lesson.type),
              headline: lesson.headline,
              coreIdea: lesson.coreIdea,
              example: lesson.example,
              realWorldUse: lesson.realWorldUse,
              estimatedSec: lesson.estimatedSec ?? 90,
              quiz: lesson.quiz as unknown as Prisma.InputJsonValue,
            }))
          ),
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
    console.error("Gemini path generation failed:", err);
    return Response.json({ error: "Generation failed, please try again" }, { status: 500 });
  }
}
