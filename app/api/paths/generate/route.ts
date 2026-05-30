import { groq, buildPathPrompt, parsePathResponse, PATH_MODEL } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { Prisma, LessonType } from "@prisma/client";

// Path generation can take a little while — allow up to 60s on Vercel.
export const maxDuration = 60;

const VALID_TYPES = new Set<string>(Object.values(LessonType));

function coerceType(type: string): LessonType {
  return VALID_TYPES.has(type) ? (type as LessonType) : LessonType.concept_card;
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // One skill per user — never regenerate an existing path (cached forever).
  const existing = await prisma.learningPath.findUnique({ where: { userId: user.id } });
  if (existing) return Response.json({ pathId: existing.id });

  const { skill, level, hoursPerWeek, goal } = await req.json().catch(() => ({}));
  if (!skill || !level || !hoursPerWeek) {
    return Response.json({ error: "skill, level and hoursPerWeek are required" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "Generation is not configured (missing GROQ_API_KEY)" }, { status: 503 });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: PATH_MODEL,
      messages: [
        { role: "user", content: buildPathPrompt(skill, level, Number(hoursPerWeek), goal) },
      ],
      max_tokens: 8000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parsePathResponse(raw);

    const path = await prisma.learningPath.create({
      data: {
        userId: user.id,
        skill: String(skill),
        level: String(level),
        hoursPerWeek: Number(hoursPerWeek),
        goal: goal ? String(goal) : null,
        rawJson: parsed as unknown as Prisma.InputJsonValue,
        lessons: {
          create: parsed.weeks.flatMap((week) =>
            week.lessons.map((lesson) => ({
              weekNumber: week.week,
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
