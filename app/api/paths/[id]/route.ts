import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const path = await prisma.learningPath.findUnique({ where: { id }, select: { userId: true } });

  if (!path || path.userId !== user.id) {
    return Response.json({ error: "Path not found" }, { status: 404 });
  }

  await prisma.learningPath.delete({ where: { id } });
  return Response.json({ deleted: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const path = await prisma.learningPath.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: [{ phaseNumber: "asc" }, { order: "asc" }] },
    },
  });

  if (!path || path.userId !== user.id) {
    return Response.json({ error: "Path not found" }, { status: 404 });
  }

  return Response.json(path);
}
