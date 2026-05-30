import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const PATH_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export function buildPathPrompt(
  skill: string,
  level: string,
  hoursPerWeek: number,
  goal?: string
): string {
  return `
You are a world-class instructional designer. Generate a 4-week micro-learning curriculum.

Skill: ${skill}
Current level: ${level}
Hours per week: ${hoursPerWeek}
Goal: ${goal || "General learning"}

RULES:
- Each lesson covers EXACTLY ONE concept
- Each lesson takes 60-90 seconds to read
- Core idea must be 2-3 sentences MAX
- Generate 5-7 lessons per week (20-28 total)
- Quiz: 2-3 questions per lesson, pass threshold = 80%
- Vary lesson types across the curriculum

Return ONLY a valid JSON object (no markdown, no explanation) with this EXACT structure:
{
  "skill": "${skill}",
  "totalWeeks": 4,
  "weeks": [
    {
      "week": 1,
      "theme": "string — theme for this week",
      "lessons": [
        {
          "order": 1,
          "type": "concept_card",
          "headline": "One-line concept title",
          "coreIdea": "2-3 sentences max. Simple language.",
          "example": "One code snippet, analogy, or scenario",
          "realWorldUse": "One fun fact or industry application",
          "estimatedSec": 90,
          "quiz": [
            {
              "type": "multiple_choice",
              "question": "Question text",
              "options": ["A", "B", "C", "D"],
              "correct": "A",
              "explanation": "Why this is correct"
            }
          ]
        }
      ]
    }
  ]
}

Lesson "type" must be one of: concept_card, analogy, code_snippet, myth_vs_reality, did_you_know, flashcard (vary them).
Quiz "type" must be one of: multiple_choice, true_false, fill_blank, matching, sequence, spot_the_bug (vary them).
For every quiz question, "correct" must exactly match one of the strings in "options".
`;
}

/** Shape of a single quiz question stored in Lesson.quiz */
export interface QuizQuestion {
  type: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

interface GeneratedLesson {
  order: number;
  type: string;
  headline: string;
  coreIdea: string;
  example: string;
  realWorldUse: string;
  estimatedSec?: number;
  quiz: QuizQuestion[];
}

interface GeneratedWeek {
  week: number;
  theme: string;
  lessons: GeneratedLesson[];
}

export interface GeneratedPath {
  skill: string;
  totalWeeks: number;
  weeks: GeneratedWeek[];
}

/**
 * Strips accidental markdown fences and parses the model output into a
 * structurally-validated GeneratedPath. Throws if the shape is invalid.
 */
export function parsePathResponse(raw: string): GeneratedPath {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as GeneratedPath;

  if (!parsed.weeks || !Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
    throw new Error("Generated path has no weeks");
  }
  for (const week of parsed.weeks) {
    if (!Array.isArray(week.lessons) || week.lessons.length === 0) {
      throw new Error(`Week ${week.week} has no lessons`);
    }
  }
  return parsed;
}
