import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // 10 attempts per IP per 15 minutes.
  const ip = getClientIp(req);
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

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
