import { getUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

// Returns the next uncompleted lesson plus today's progress context.
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const pathId = new URL(req.url).searchParams.get("pathId");
  if (!pathId) return Response.json({ error: "pathId is required" }, { status: 400 });

  const data = await getDashboardData(user.id, pathId);
  if (!data) return Response.json({ redirect: "/onboarding" });

  if (data.allDone || !data.nextLessonId) {
    return Response.json({
      status: "all_done",
      message: "You've completed the full path. Time to pick what's next.",
      completedToday: data.completedToday,
      streak: data.streak,
    });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: data.nextLessonId } });

  return Response.json({
    lesson,
    completedToday: data.completedToday,
    bonusXpActive: data.bonusXpActive,
    streak: data.streak,
  });
}
