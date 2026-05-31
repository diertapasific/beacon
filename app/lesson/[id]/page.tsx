import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LessonExperience, type LessonContent } from "@/components/lesson/LessonExperience";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/auth/login");

  // Get the lesson and its path together — supports multiple paths per user.
  const lessonRecord = await prisma.lesson.findUnique({
    where: { id },
    include: {
      path: {
        include: {
          lessons: {
            orderBy: [{ weekNumber: "asc" }, { order: "asc" }],
            include: { progress: { where: { userId: user.id } } },
          },
        },
      },
    },
  });

  if (!lessonRecord) notFound();
  if (lessonRecord.path.userId !== user.id) notFound();

  const { path } = lessonRecord;
  const pathId = path.id;
  const idx = path.lessons.findIndex((l) => l.id === id);
  if (idx === -1) notFound();

  const target = path.lessons[idx];
  const nextIndex = path.lessons.findIndex((l) => !l.progress[0]?.completed);

  const isCompleted = !!target.progress[0]?.completed;
  const allowed = isCompleted || idx === nextIndex;
  if (!allowed) {
    const nextId = nextIndex >= 0 ? path.lessons[nextIndex].id : null;
    redirect(nextId ? `/lesson/${nextId}` : `/dashboard/${pathId}`);
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
      pathId={pathId}
    />
  );
}
