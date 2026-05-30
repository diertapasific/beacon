import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const COOKIE_NAME = "beacon_token";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, getSecret(), { expiresIn: "30d" });
}

export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Resolves the authenticated user from the httpOnly JWT cookie.
 * Returns null when there is no valid session.
 */
export async function getUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { userId } = jwt.verify(token, getSecret()) as { userId: string };
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}
