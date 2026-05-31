import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const PATH_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const WEEK_THEMES = [
  "Foundations — core mental models, key terminology, why this skill matters",
  "Core Techniques — essential tools, libraries, and hands-on workflows",
  "Depth — advanced concepts, tradeoffs, edge cases, comparing approaches",
  "Mastery — expert patterns, debugging, real-world application, career context",
] as const;

export function buildWeekPrompt(
  skill: string,
  level: string,
  hoursPerWeek: number,
  goal: string | undefined,
  weekNumber: number
): string {
  const theme = WEEK_THEMES[weekNumber - 1];
  return `
You are a world-class instructional designer. Generate Week ${weekNumber} of 4 for a micro-learning curriculum.

Skill: ${skill}
Level: ${level}
Hours per week: ${hoursPerWeek}
Goal: ${goal || "General mastery"}
Week ${weekNumber} focus: ${theme}

LESSON RULES (non-negotiable):
- Generate EXACTLY 6 lessons. No fewer.
- Each lesson covers ONE focused, specific concept, tool, or comparison — never a vague overview
- Headlines must be specific ("How Gradient Descent Minimizes Loss" not "Training Models")
- coreIdea: 3-5 sentences covering WHAT it is, HOW it works mechanically, and WHY it matters
- example: Concrete working code snippet OR a precise analogy with named specifics — no placeholders
- realWorldUse: Name a specific company, product, or research result that uses this
- estimatedSec: 120 to 180

WEEK ${weekNumber} MUST INCLUDE:
- At least 2 lessons about specific tools, libraries, or APIs
- At least 1 lesson comparing two approaches or algorithms directly
- At least 1 myth_vs_reality or did_you_know lesson
- No more than 2 consecutive lessons of the same type

QUIZ RULES:
- 3-4 questions per lesson
- Mix types aggressively — never 3 multiple_choice in a row
- Test understanding ("why does X happen") not just recall ("what is X")
- All multiple_choice options must be plausible — no obviously wrong distractors

Return ONLY valid JSON, no markdown:
{
  "week": ${weekNumber},
  "theme": "${theme}",
  "lessons": [
    {
      "order": 1,
      "type": "concept_card",
      "headline": "Specific title",
      "coreIdea": "3-5 sentences with real depth",
      "example": "Concrete code or named analogy",
      "realWorldUse": "Named company/product/research",
      "estimatedSec": 150,
      "quiz": [
        {
          "type": "multiple_choice",
          "question": "Question testing understanding",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": "Option A",
          "explanation": "Why correct, why others are wrong"
        }
      ]
    }
  ]
}

Lesson type: concept_card | analogy | code_snippet | myth_vs_reality | did_you_know | flashcard
Quiz type: multiple_choice | true_false | fill_blank | matching | sequence | spot_the_bug

Quiz format (STRICT):
- multiple_choice: options = 4 strings. correct = full text of one option, copied exactly.
- true_false: options = ["True","False"]. correct = "True" or "False".
- fill_blank: question contains ___. options = []. correct = exact word/phrase.
- matching: options = [term1,term2,term3,def1,def2,def3] — 3 terms then 3 defs. correct = "term1:def1,term2:def2,term3:def3".
- sequence: options = 4-5 SHORT individual steps in SCRAMBLED order (each is one brief action, NOT a full sentence with commas). correct = those exact strings joined by | in correct order.
- spot_the_bug: question = short code with one bug. options = 4 bug descriptions. correct = full text of correct option.
`;
}

/** Legacy single-call prompt — kept for reference, use buildWeekPrompt instead. */
export function buildPathPrompt(
  skill: string,
  level: string,
  hoursPerWeek: number,
  goal?: string
): string {
  return [1, 2, 3, 4].map((w) => buildWeekPrompt(skill, level, hoursPerWeek, goal, w)).join("\n\n---\n\n");
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

function stripFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

/** Parse a single-week response from buildWeekPrompt. */
export function parseWeekResponse(raw: string, weekNumber: number): GeneratedWeek {
  const parsed = JSON.parse(stripFences(raw)) as GeneratedWeek;
  if (!Array.isArray(parsed.lessons) || parsed.lessons.length < 1) {
    throw new Error(`Week ${weekNumber} returned no lessons`);
  }
  return {
    week: weekNumber,
    theme: parsed.theme ?? WEEK_THEMES[weekNumber - 1],
    lessons: parsed.lessons,
  };
}

/** Legacy: parse a single full-path response. */
export function parsePathResponse(raw: string): GeneratedPath {
  const parsed = JSON.parse(stripFences(raw)) as GeneratedPath;
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
