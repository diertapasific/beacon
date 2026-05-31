import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const normalized = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Same response for missing user and bad password — don't leak which emails exist.
  if (!user || !(await verifyPassword(password, user.password))) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await setAuthCookie(signToken(user.id));

  const hasPath = await prisma.learningPath.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    hasPath: !!hasPath,
  });
}
