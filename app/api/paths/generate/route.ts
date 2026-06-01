import { groq, buildPhasePrompt, parsePhaseResponse, getPathStructure, PATH_MODEL } from "@/lib/groq";
import type { GeneratedPath } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { Prisma, LessonType } from "@prisma/client";

// Path generation can take a little while — allow up to 60s on Vercel.
export const maxDuration = 60;

const VALID_TYPES = new Set<string>(Object.values(LessonType));

function coerceType(type: string): LessonType {
  return VALID_TYPES.has(type) ? (type as LessonType) : LessonType.concept_card;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 4, baseDelayMs = 1500): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < retries) {
        // Parse "try again in Xms" from the error message if available
        const msg = (err as { error?: { message?: string } }).error?.message ?? "";
        const match = msg.match(/try again in (\d+(?:\.\d+)?)(m?s)/i);
        let wait = baseDelayMs * Math.pow(2, attempt);
        if (match) {
          const val = parseFloat(match[1]);
          wait = Math.max(wait, match[2] === "s" ? val * 1000 : val) + 200;
        }
        await new Promise((res) => setTimeout(res, wait));
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

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "Generation is not configured (missing GROQ_API_KEY)" }, { status: 503 });
  }

  try {
    const { phaseCount, minLessons, maxLessons } = getPathStructure(String(level), Number(hoursPerWeek));

    // Generate phases sequentially to stay within free-tier TPM limits.
    const phaseNums = Array.from({ length: phaseCount }, (_, i) => i + 1);
    const phaseCompletions = [];
    for (const phase of phaseNums) {
      const completion = await withRetry(() =>
        groq.chat.completions.create({
          model: PATH_MODEL,
          messages: [
            {
              role: "user",
              content: buildPhasePrompt(skill, level, Number(hoursPerWeek), goal, phase, phaseCount, minLessons, maxLessons, covered),
            },
          ],
          max_tokens: 8000,
          temperature: 0.7,
          response_format: { type: "json_object" },
        })
      );
      phaseCompletions.push(completion);
    }

    const phases = phaseCompletions.map((c, i) =>
      parsePhaseResponse(c.choices[0]?.message?.content ?? "", i + 1)
    );

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
    console.error("Groq path generation failed:", err);
    return Response.json({ error: "Generation failed, please try again" }, { status: 500 });
  }
}
