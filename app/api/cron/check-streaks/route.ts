import { prisma } from "@/lib/prisma";

// Scheduled at 00:00 UTC via vercel.json. Resets any streak whose last
// activity is older than yesterday (i.e. the user missed a full day).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Start of today (UTC). Anyone whose last completion predates this and
  // wasn't yesterday has broken their streak.
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  const result = await prisma.streak.updateMany({
    where: {
      lastCompletedAt: { lt: startOfYesterday },
      current: { gt: 0 },
    },
    data: { current: 0 },
  });

  return Response.json({ ok: true, reset: result.count });
}
