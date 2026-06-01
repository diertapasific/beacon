import { groq, PATH_MODEL } from "@/lib/groq";
import { getUser } from "@/lib/auth";

// Rotating domain angles so repeated clicks don't all return tech topics.
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

export async function POST() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

  try {
    const completion = await groq.chat.completions.create({
      model: PATH_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You suggest one specific, genuinely interesting skill a curious person could start learning today. Reply with ONLY the skill name — 1 to 4 words, in Title Case, no punctuation, no quotes, no explanation.",
        },
        {
          role: "user",
          content: `Suggest ${angle} that feels fresh and worth learning right now. Be specific and a little unexpected — never a generic textbook subject.`,
        },
      ],
      max_tokens: 20,
      temperature: 1,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
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
