import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const PATH_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const WEEK_THEMES = [
  "Foundations — core mental models, key terminology, why this skill matters",
  "Core Techniques — essential tools, libraries, and hands-on workflows",
  "Depth — advanced concepts, tradeoffs, edge cases, comparing approaches",
  "Real-World Application — projects, common mistakes, putting it into practice",
  "Mastery — expert patterns, debugging, real-world application, career context",
] as const;

/** Pick week themes evenly across however many weeks the path has. */
function pickThemes(totalWeeks: number): string[] {
  const all = WEEK_THEMES as unknown as string[];
  if (totalWeeks >= all.length) return all.slice(0, totalWeeks);
  // Spread evenly: always start with Foundations, always end with Mastery
  const indices = [0];
  const step = (all.length - 1) / (totalWeeks - 1);
  for (let i = 1; i < totalWeeks - 1; i++) indices.push(Math.round(i * step));
  indices.push(all.length - 1);
  return indices.map((i) => all[i]);
}

/** How many weeks and how many lessons per week based on level + commitment. */
export function getPathStructure(level: string, hoursPerWeek: number): {
  weekCount: number;
  minLessons: number;
  maxLessons: number;
} {
  const h = Number(hoursPerWeek);

  const weekCount =
    level === "beginner"     ? (h <= 2 ? 3 : 4) :
    level === "advanced"     ? (h <= 2 ? 4 : 5) :
    /* intermediate */          (h <= 2 ? 3 : h >= 5 ? 5 : 4);

  const minLessons = h <= 2 ? 4 : h <= 4 ? 5 : 6;
  const maxLessons = h <= 2 ? 5 : h <= 4 ? 7 : 8;

  return { weekCount, minLessons, maxLessons };
}

export function buildWeekPrompt(
  skill: string,
  level: string,
  hoursPerWeek: number,
  goal: string | undefined,
  weekNumber: number,
  totalWeeks: number,
  minLessons: number,
  maxLessons: number,
): string {
  const themes = pickThemes(totalWeeks);
  const theme = themes[weekNumber - 1];
  return `
You are a world-class instructional designer. Generate Week ${weekNumber} of ${totalWeeks} for a micro-learning curriculum.

Skill: ${skill}
Level: ${level}
Hours per week: ${hoursPerWeek}
Goal: ${goal || "General mastery"}
Week ${weekNumber} focus: ${theme}

LESSON RULES (non-negotiable):
- Generate between ${minLessons} and ${maxLessons} lessons — choose the count that best fits the theme's natural scope. Do not pad to hit a number.
- Each lesson covers ONE focused, specific concept, mechanic, strategy, or comparison — never a vague overview
- Headlines must be specific and concrete ("How Rent Calculation Works in Monopoly" not "Understanding Rent")
- coreIdea: 3-5 sentences covering WHAT it is, HOW it works mechanically, and WHY it matters
- example: A precise real-world analogy, a named historical example, or a concrete scenario — no generic placeholders
- realWorldUse: A specific real example, published study, notable player story, or documented application of this concept
- estimatedSec: 120 to 180

CRITICAL — MATCH THE SKILL DOMAIN:
- The skill is "${skill}". Determine if it is a programming/software/technical skill or a non-technical skill (game, sport, art, language, history, etc.)
- If NON-TECHNICAL: NEVER include code_snippet lessons. NEVER mention Python, JavaScript, or any programming language. Use only concept_card, analogy, myth_vs_reality, did_you_know, or flashcard types.
- If TECHNICAL: code_snippet lessons are appropriate.

WEEK ${weekNumber} MUST INCLUDE:
- At least 1 lesson comparing two strategies, approaches, or mechanics directly
- At least 1 myth_vs_reality or did_you_know lesson
- At least 1 analogy lesson that connects the concept to everyday life
- No more than 2 consecutive lessons of the same type

QUIZ RULES:
- 3-4 questions per lesson
- Mix types aggressively — never 3 multiple_choice in a row
- Test understanding ("why does X happen") not just recall ("what is X")
- All multiple_choice options must be plausible — no obviously wrong distractors
- Every question MUST include a "hint" field: one sentence that nudges toward the answer without giving it away directly

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
          "explanation": "Why correct, why others are wrong",
          "hint": "One-sentence nudge toward the answer without revealing it"
        }
      ]
    }
  ]
}

Lesson type: concept_card | analogy | code_snippet | myth_vs_reality | did_you_know | flashcard
  (only use code_snippet if the skill is a programming/technical topic)

Quiz type: multiple_choice | true_false | matching | sequence | spot_the_bug
  (only use spot_the_bug if the skill is a programming/technical topic)

Quiz format (STRICT):
- multiple_choice: options = 4 strings. correct = full text of one option, copied exactly.
- true_false: options = ["True","False"]. correct = "True" or "False".
- matching: options = [term1,term2,term3,def1,def2,def3] — first 3 are SHORT terms (1-4 words each), last 3 are DESCRIPTIVE phrases (6+ words each explaining what the term means or does). correct = "term1:def1,term2:def2,term3:def3". The question must be a plain instruction like "Match each term with its correct description" — do NOT list the terms inside the question text, and do NOT use a bare noun or single word as a definition.
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
  const { weekCount, minLessons, maxLessons } = getPathStructure(level, hoursPerWeek);
  return Array.from({ length: weekCount }, (_, i) => i + 1)
    .map((w) => buildWeekPrompt(skill, level, hoursPerWeek, goal, w, weekCount, minLessons, maxLessons))
    .join("\n\n---\n\n");
}

/** Shape of a single quiz question stored in Lesson.quiz */
export interface QuizQuestion {
  type: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  hint?: string;
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
