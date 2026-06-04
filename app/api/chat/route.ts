import { genAI, CHAT_MODEL } from "@/lib/ai";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const CHAT_DAILY_LIMIT = 10;

function buildSystemPrompt(lesson: {
  headline: string;
  coreIdea: string;
  example: string;
  realWorldUse: string;
}): string {
  return `You are a focused learning tutor inside Beacon, a micro-learning app.

The student is currently studying this lesson:

Title: ${lesson.headline}
Core concept: ${lesson.coreIdea}
Example: ${lesson.example}
Real-world application: ${lesson.realWorldUse}

Your rules:
- Answer questions about this lesson's material clearly and concisely
- If a question naturally extends from this topic, answer briefly and connect it back
- If asked something completely unrelated, politely redirect to the lesson topic
- Keep responses to 2-4 sentences unless the question genuinely requires more
- Never repeat the lesson text verbatim — rephrase and explain differently to deepen understanding
- Be encouraging but direct. No filler phrases.`;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/** Returns the user's remaining daily chat quota. */
export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayKey();
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { chatMessagesUsedToday: true, chatMessagesResetDate: true },
  });
  if (!userData) return Response.json({ error: "Not found" }, { status: 404 });

  const used = userData.chatMessagesResetDate !== today ? 0 : userData.chatMessagesUsedToday;
  return Response.json({
    used,
    limit: CHAT_DAILY_LIMIT,
    remaining: Math.max(0, CHAT_DAILY_LIMIT - used),
  });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, lessonId } = (await req.json()) as {
    messages: ChatMessage[];
    lessonId: string;
  };

  if (!lessonId || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Fetch lesson from DB — client cannot inject arbitrary context.
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      headline: true,
      coreIdea: true,
      example: true,
      realWorldUse: true,
      path: { select: { userId: true } },
    },
  });
  if (!lesson || lesson.path.userId !== user.id) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Check daily quota.
  const today = todayKey();
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { chatMessagesUsedToday: true, chatMessagesResetDate: true },
  });
  if (!userData) return Response.json({ error: "Not found" }, { status: 404 });

  const isNewDay = userData.chatMessagesResetDate !== today;
  const currentUsed = isNewDay ? 0 : userData.chatMessagesUsedToday;

  if (currentUsed >= CHAT_DAILY_LIMIT) {
    return Response.json(
      { error: "You've reached your daily chat limit. Come back tomorrow.", remaining: 0 },
      { status: 429 }
    );
  }

  // Increment counter before streaming.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      chatMessagesUsedToday: isNewDay ? 1 : { increment: 1 },
      chatMessagesResetDate: today,
    },
  });

  const remaining = CHAT_DAILY_LIMIT - currentUsed - 1;

  const recentMessages = messages.slice(-12);
  const history = recentMessages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));
  const lastMessage = recentMessages[recentMessages.length - 1];

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: buildSystemPrompt(lesson),
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
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Chat-Remaining": String(remaining),
    },
  });
}
