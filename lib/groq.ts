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

Format rules per type (STRICT — follow exactly):
- multiple_choice: "options" = 4 answer strings. "correct" = full text of one option, copied exactly.
- true_false: "options" = ["True","False"]. "correct" = "True" or "False".
- fill_blank: "question" has a blank shown as ___. "options" = []. "correct" = the word/phrase that fills the blank.
- matching: "options" = [term1, term2, term3, def1, def2, def3] — first half terms, second half definitions, equal count. "correct" = "term1:def1,term2:def2,term3:def3" using colon pairs separated by commas.
- sequence: "options" = steps in SCRAMBLED order. "correct" = steps joined by "|" in the CORRECT order, using the exact same strings as in options.
- spot_the_bug: "question" contains a short code snippet with a bug. "options" = 4 strings describing where/what the bug is. "correct" = full text of the correct option.
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
