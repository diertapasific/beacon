import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalized = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: normalized,
      password: await hashPassword(password),
      name: name ? String(name).trim() : null,
      streak: { create: {} },
    },
  });

  await setAuthCookie(signToken(user.id));
  return Response.json({ id: user.id, email: user.email, name: user.name });
}
