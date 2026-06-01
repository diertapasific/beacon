import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models are swappable via env so you can trade quality for a larger free
// daily token budget without a redeploy.
//
// PATH_MODEL — path/lesson generation. Token-heavy, benefits from a strong
// (or reasoning) model. Defaults to the high-quality 70B.
export const PATH_MODEL = process.env.GROQ_PATH_MODEL || "llama-3.3-70b-versatile";

// CHAT_MODEL — the tutor chat and skill suggestion. Short outputs + streaming,
// so a fast NON-reasoning model is the right fit (reasoning models can blow the
// tiny token caps these use). Lives on its own daily token bucket too.
export const CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";

const PHASE_THEMES = [
  "Foundations — core mental models, key terminology, why this skill matters",
  "Core Techniques — essential tools, libraries, and hands-on workflows",
  "Depth — advanced concepts, tradeoffs, edge cases, comparing approaches",
  "Real-World Application — projects, common mistakes, putting it into practice",
  "Mastery — expert patterns, debugging, real-world application, career context",
] as const;

/** Pick phase themes evenly across however many phases the path has. */
function pickThemes(totalPhases: number): string[] {
  const all = PHASE_THEMES as unknown as string[];
  if (totalPhases >= all.length) return all.slice(0, totalPhases);
  // Spread evenly: always start with Foundations, always end with Mastery
  const indices = [0];
  const step = (all.length - 1) / (totalPhases - 1);
  for (let i = 1; i < totalPhases - 1; i++) indices.push(Math.round(i * step));
  indices.push(all.length - 1);
  return indices.map((i) => all[i]);
}

/** How many phases and how many lessons per phase based on level + commitment. */
export function getPathStructure(level: string, hoursPerWeek: number): {
  phaseCount: number;
  minLessons: number;
  maxLessons: number;
} {
  const h = Number(hoursPerWeek);

  const phaseCount =
    level === "beginner"     ? (h <= 2 ? 3 : 4) :
    level === "advanced"     ? (h <= 2 ? 4 : 5) :
    /* intermediate */          (h <= 2 ? 3 : h >= 5 ? 5 : 4);

  const minLessons = h <= 2 ? 4 : h <= 4 ? 5 : 6;
  const maxLessons = h <= 2 ? 5 : h <= 4 ? 7 : 8;

  return { phaseCount, minLessons, maxLessons };
}

export function buildPhasePrompt(
  skill: string,
  level: string,
  hoursPerWeek: number,
  goal: string | undefined,
  phaseNumber: number,
  totalPhases: number,
  minLessons: number,
  maxLessons: number,
  coveredTopics: string[] = [],
): string {
  const themes = pickThemes(totalPhases);
  const theme = themes[phaseNumber - 1];
  const exclusionBlock = coveredTopics.length > 0
    ? `\nALREADY COVERED — DO NOT REPEAT OR OVERLAP THESE TOPICS:\n${coveredTopics.map((t) => `- ${t}`).join("\n")}\nEvery lesson in this path MUST be meaningfully distinct from the above. Build forward, not sideways.\n`
    : "";
  return `
You are a world-class instructional designer. Generate Phase ${phaseNumber} of ${totalPhases} for a micro-learning curriculum.

Skill: ${skill}
Level: ${level}
Hours per week: ${hoursPerWeek}
Goal: ${goal || "General mastery"}
Phase ${phaseNumber} focus: ${theme}${exclusionBlock}

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

PHASE ${phaseNumber} MUST INCLUDE:
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
  "phase": ${phaseNumber},
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
- matching: ALWAYS exactly 3 pairs. options = [term1,term2,term3,def1,def2,def3].
    Terms (first 3): 1-4 words, NO colons, NO punctuation inside the string.
    Definitions (last 3): 8-14 words each, must unambiguously describe exactly one term.
    correct = "term1:def1,term2:def2,term3:def3" — strings COPIED VERBATIM from options, colons ONLY as the term:def separator, NO other colons anywhere.
    Question text: a plain instruction ONLY — never list the terms in the question.
    EXAMPLE:
      options: ["Gradient Descent","Learning Rate","Loss Function","Iteratively adjusts weights to minimise the prediction error","Scales how large each weight update step is","Measures the gap between predicted and actual output values"]
      correct: "Gradient Descent:Iteratively adjusts weights to minimise the prediction error,Learning Rate:Scales how large each weight update step is,Loss Function:Measures the gap between predicted and actual output values"
    ILLEGAL — never do these:
      - Putting descriptions inside the correct field that don't exactly match an option string
      - Terms or definitions that contain colons
      - Fewer or more than 3 pairs
      - Listing terms inside the question text
- sequence: options = 4-5 SHORT individual steps in SCRAMBLED order (each is one brief action, NOT a full sentence with commas). correct = those exact strings joined by | in correct order.
- spot_the_bug: question = short code with one bug. options = 4 bug descriptions. correct = full text of correct option.
`;
}

/** Legacy single-call prompt — kept for reference, use buildPhasePrompt instead. */
export function buildPathPrompt(
  skill: string,
  level: string,
  hoursPerWeek: number,
  goal?: string
): string {
  const { phaseCount, minLessons, maxLessons } = getPathStructure(level, hoursPerWeek);
  return Array.from({ length: phaseCount }, (_, i) => i + 1)
    .map((p) => buildPhasePrompt(skill, level, hoursPerWeek, goal, p, phaseCount, minLessons, maxLessons))
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

interface GeneratedPhase {
  phase: number;
  theme: string;
  lessons: GeneratedLesson[];
}

export interface GeneratedPath {
  skill: string;
  totalPhases: number;
  phases: GeneratedPhase[];
}

function stripFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

/** Parse a single-phase response from buildPhasePrompt. */
export function parsePhaseResponse(raw: string, phaseNumber: number): GeneratedPhase {
  const parsed = JSON.parse(stripFences(raw)) as { phase?: number; theme?: string; lessons?: GeneratedLesson[] };
  if (!Array.isArray(parsed.lessons) || parsed.lessons.length < 1) {
    throw new Error(`Phase ${phaseNumber} returned no lessons`);
  }
  return {
    phase: phaseNumber,
    theme: parsed.theme ?? PHASE_THEMES[phaseNumber - 1],
    lessons: parsed.lessons,
  };
}

/** Legacy: parse a single full-path response. */
export function parsePathResponse(raw: string): GeneratedPath {
  const parsed = JSON.parse(stripFences(raw)) as GeneratedPath;
  if (!parsed.phases || !Array.isArray(parsed.phases) || parsed.phases.length === 0) {
    throw new Error("Generated path has no phases");
  }
  for (const phase of parsed.phases) {
    if (!Array.isArray(phase.lessons) || phase.lessons.length === 0) {
      throw new Error(`Phase ${phase.phase} has no lessons`);
    }
  }
  return parsed;
}
