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

interface RateLimit {
  limited: boolean; // server rejected us for a limit (429) or oversized request (413)
  retryAfterSec: number;
  daily: boolean; // hit the per-day token cap (TPD) rather than a per-minute burst
  tooLarge: boolean; // request bigger than the model's per-minute window (413 / TPM)
  shouldRetry: boolean;
}

/** Best-effort extraction of rate-limit details from a Groq SDK error. */
function readRateLimit(err: unknown): RateLimit {
  const e = err as {
    status?: number;
    headers?: Headers | Record<string, string>;
    error?: { error?: { message?: string } };
    message?: string;
  };
  const h = e?.headers;
  const get = (k: string): string | null => {
    if (!h) return null;
    if (typeof (h as Headers).get === "function") return (h as Headers).get(k);
    return (h as Record<string, string>)[k] ?? null;
  };
  const status = e?.status ?? 0;
  const msg = e?.error?.error?.message ?? e?.message ?? "";
  return {
    limited: status === 429 || status === 413,
    retryAfterSec: Number(get("retry-after")) || 0,
    shouldRetry: get("x-should-retry") !== "false",
    daily: /per day|\bTPD\b/i.test(msg),
    tooLarge: status === 413 || /request too large|tokens per minute|\bTPM\b/i.test(msg),
  };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 4, baseDelayMs = 1500): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const { limited, retryAfterSec, daily, tooLarge, shouldRetry } = readRateLimit(err);
      // Only retry short, transient per-minute bursts. Daily caps and
      // request-too-large errors can't be fixed by waiting a few seconds, and
      // retrying would just burn the function's time budget (maxDuration).
      const transient = limited && shouldRetry && !daily && !tooLarge && retryAfterSec <= 30;
      if (transient && attempt < retries) {
        const wait = Math.max(baseDelayMs * 2 ** attempt, retryAfterSec * 1000) + 200;
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
    const { limited, retryAfterSec, daily, tooLarge } = readRateLimit(err);
    if (tooLarge) {
      // The model's per-minute token window is smaller than our request
      // (e.g. gpt-oss-20b free tier, TPM 8000). Retrying can't help — this is a
      // model-choice issue, surfaced loudly for the operator.
      console.error(
        `[generate] 413 request too large for model "${PATH_MODEL}". Its per-minute ` +
          `token limit is below the request size. Use a higher-TPM model ` +
          `(e.g. llama-3.3-70b-versatile) via GROQ_PATH_MODEL, or upgrade the Groq tier.`,
      );
      return Response.json(
        { error: "The AI model is over capacity right now. Please try again in a few minutes.", code: "too_large" },
        { status: 503 },
      );
    }
    if (limited) {
      const mins = retryAfterSec ? Math.max(1, Math.ceil(retryAfterSec / 60)) : null;
      const message = daily
        ? `Beacon's daily AI limit has been reached${mins ? ` — try again in about ${mins} min` : ""}. Sorry about that.`
        : `Too many requests right now${mins ? ` — try again in about ${mins} min` : ", give it a moment"}.`;
      return Response.json(
        { error: message, code: "rate_limited", retryAfter: retryAfterSec || null },
        { status: 429, ...(retryAfterSec ? { headers: { "Retry-After": String(retryAfterSec) } } : {}) },
      );
    }
    console.error("Groq path generation failed:", err);
    return Response.json({ error: "Generation failed, please try again" }, { status: 500 });
  }
}
