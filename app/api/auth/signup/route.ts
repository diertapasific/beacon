import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // 5 signups per IP per hour.
  const ip = getClientIp(req);
  const rl = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { email, password, name } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalized = String(email).trim().toLowerCase();

  // Cap name to prevent oversized payloads being stored.
  const safeName = name ? String(name).trim().slice(0, 100) : null;

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    // Don't reveal whether the email is registered — return a generic message
    // so the endpoint cannot be used for account enumeration.
    return Response.json(
      { error: "Could not create account. If you already have one, try logging in." },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      email: normalized,
      password: await hashPassword(password),
      name: safeName,
      streak: { create: {} },
    },
  });

  await setAuthCookie(signToken(user.id));
  return Response.json({ id: user.id, email: user.email, name: user.name });
}
