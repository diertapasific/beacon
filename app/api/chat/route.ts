import { groq, PATH_MODEL } from "@/lib/groq";
import { getUser } from "@/lib/auth";

interface LessonContext {
  headline: string;
  type: string;
  coreIdea: string;
  example: string;
  realWorldUse: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(ctx: LessonContext): string {
  return `You are a focused learning tutor inside Beacon, a micro-learning app.

The student is currently studying this lesson:

Title: ${ctx.headline}
Core concept: ${ctx.coreIdea}
Example: ${ctx.example}
Real-world application: ${ctx.realWorldUse}

Your rules:
- Answer questions about this lesson's material clearly and concisely
- If a question naturally extends from this topic, answer briefly and connect it back
- If asked something completely unrelated, politely redirect to the lesson topic
- Keep responses to 2-4 sentences unless the question genuinely requires more
- Never repeat the lesson text verbatim — rephrase and explain differently to deepen understanding
- Be encouraging but direct. No filler phrases.`;
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, lessonContext } = (await req.json()) as {
    messages: ChatMessage[];
    lessonContext: LessonContext;
  };

  if (!lessonContext || !Array.isArray(messages)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const stream = await groq.chat.completions.create({
    model: PATH_MODEL,
    messages: [
      { role: "system", content: buildSystemPrompt(lessonContext) },
      ...messages.slice(-12),
    ],
    stream: true,
    max_tokens: 400,
    temperature: 0.65,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
