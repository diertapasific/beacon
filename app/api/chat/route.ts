import { genAI, CHAT_MODEL } from "@/lib/groq";
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

  if (!lessonContext || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const recentMessages = messages.slice(-12);
  const history = recentMessages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));
  const lastMessage = recentMessages[recentMessages.length - 1];

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: buildSystemPrompt(lessonContext),
    generationConfig: { maxOutputTokens: 400, temperature: 0.65 },
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
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
