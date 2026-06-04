import { genAI, CHAT_MODEL } from "@/lib/ai";
import { getUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const ANGLES = [
  "a practical technology, data, or AI skill",
  "a way to understand money, investing, or the economy",
  "a creative or artistic craft",
  "a hands-on, physical, or culinary hobby",
  "a communication, leadership, or people skill",
  "a strategic game or a sport's deeper tactics",
  "a language or a culture worth getting into",
  "a science, history, or big-idea subject",
];

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // 20 suggestions per user per 24 hours.
  const rl = rateLimit(`suggest:${user.id}`, 20, 24 * 60 * 60 * 1_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Daily suggestion limit reached. Come back tomorrow." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction:
        "You suggest one specific, genuinely interesting skill a curious person could start learning today. Reply with ONLY the skill name — 1 to 4 words, in Title Case, no punctuation, no quotes, no explanation.",
      generationConfig: { maxOutputTokens: 64, temperature: 1 },
    });

    const result = await model.generateContent(
      `Suggest ${angle} that feels fresh and worth learning right now. Be specific and a little unexpected — never a generic textbook subject.`
    );

    const raw = result.response.text();
    const skill = raw
      .split("\n")[0]
      .replace(/^["'\s]+|["'.\s]+$/g, "")
      .slice(0, 60)
      .trim();

    if (!skill) return Response.json({ error: "Could not suggest a skill" }, { status: 502 });
    return Response.json({ skill });
  } catch {
    return Response.json({ error: "Could not suggest a skill" }, { status: 500 });
  }
}
