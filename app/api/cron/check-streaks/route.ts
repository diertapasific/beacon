import { prisma } from "@/lib/prisma";

// Scheduled at 00:00 UTC via vercel.json. Resets any streak whose last
// activity is older than yesterday (i.e. the user missed a full day).
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Require a non-empty secret — an unset var must not silently open the endpoint.
  if (!cronSecret) {
    console.error("[cron] CRON_SECRET is not set — refusing to run");
    return Response.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  // x-vercel-cron is injected by Vercel's scheduler — provides defence-in-depth
  // so only the platform's own cron runner can trigger this, not arbitrary HTTP clients.
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron || auth !== `Bearer ${cronSecret}`) {
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
