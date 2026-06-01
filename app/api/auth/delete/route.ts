import { prisma } from "@/lib/prisma";
import { getUser, clearAuthCookie } from "@/lib/auth";

// Permanently deletes the signed-in user. Paths, progress, streak and
// achievements are removed automatically via onDelete: Cascade.
export async function POST() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.delete({ where: { id: user.id } });
  await clearAuthCookie();

  return Response.json({ deleted: true });
}
