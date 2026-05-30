import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LessonExperience, type LessonContent } from "@/components/lesson/LessonExperience";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/auth/login");

  const path = await prisma.learningPath.findUnique({
    where: { userId: user.id },
    include: {
      lessons: {
        orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
        include: { progress: { where: { userId: user.id } } },
      },
    },
  });
  if (!path) redirect("/onboarding");

  const idx = path.lessons.findIndex((l) => l.id === id);
  if (idx === -1) notFound(); // lesson exists but isn't in this user's path

  const target = path.lessons[idx];
  const nextIndex = path.lessons.findIndex((l) => !l.progress[0]?.completed);

  // Sequential gate: only the next-up lesson or already-completed ones are open.
  const isCompleted = !!target.progress[0]?.completed;
  const allowed = isCompleted || idx === nextIndex;
  if (!allowed) {
    const nextId = nextIndex >= 0 ? path.lessons[nextIndex].id : null;
    redirect(nextId ? `/lesson/${nextId}` : "/dashboard");
  }

  const lesson: LessonContent = {
    id: target.id,
    type: target.type,
    headline: target.headline,
    coreIdea: target.coreIdea,
    example: target.example,
    realWorldUse: target.realWorldUse,
    estimatedSec: target.estimatedSec,
    quiz: target.quiz as unknown as LessonContent["quiz"],
  };

  return (
    <LessonExperience
      lesson={lesson}
      lessonNumber={idx + 1}
      totalLessons={path.lessons.length}
      subsequentLessonId={path.lessons[idx + 1]?.id ?? null}
    />
  );
}
