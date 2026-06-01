import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

const CATEGORIES = ["idea", "bug", "other"] as const;
const MAX_LEN = 2000;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { message?: unknown; category?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return Response.json({ error: "Please write something first." }, { status: 400 });
  if (message.length > MAX_LEN) {
    return Response.json({ error: `Keep it under ${MAX_LEN} characters.` }, { status: 400 });
  }

  const category =
    typeof body.category === "string" && (CATEGORIES as readonly string[]).includes(body.category)
      ? body.category
      : "idea";

  await prisma.feedback.create({
    data: { userId: user.id, category, message },
  });

  return Response.json({ ok: true });
}
