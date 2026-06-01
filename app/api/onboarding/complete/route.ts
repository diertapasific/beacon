import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

// Marks the first-time dashboard tour as seen so it never shows again.
// Idempotent — safe to call on finish or on dismiss.
export async function POST() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { hasOnboarded: true },
  });

  return Response.json({ ok: true });
}
