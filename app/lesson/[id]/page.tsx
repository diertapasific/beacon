import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LessonExperience, type LessonContent } from "@/components/lesson/LessonExperience";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/auth/login");

  // Load the lesson with full content. For path navigation (finding index,
  // next lesson ID, phase membership) we only need lightweight nav fields —
  // selecting them avoids fetching quiz JSON blobs for every other lesson.
  const lessonRecord = await prisma.lesson.findUnique({
    where: { id },
    include: {
      path: {
        select: {
          id: true,
          userId: true,
          totalPhases: true,
          lessons: {
            orderBy: [{ phaseNumber: "asc" }, { order: "asc" }],
            select: {
              id: true,
              phaseNumber: true,
              order: true,
              progress: { where: { userId: user.id }, select: { completed: true } },
            },
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

  // Use lessonRecord directly for content — it IS the queried lesson.
  const lesson: LessonContent = {
    id: lessonRecord.id,
    type: lessonRecord.type,
    headline: lessonRecord.headline,
    coreIdea: lessonRecord.coreIdea,
    example: lessonRecord.example,
    realWorldUse: lessonRecord.realWorldUse,
    estimatedSec: lessonRecord.estimatedSec,
    quiz: lessonRecord.quiz as unknown as LessonContent["quiz"],
  };

  const subsequentLessonId = path.lessons[idx + 1]?.id ?? null;
  const generatedPhases = path.lessons.length > 0
    ? Math.max(...path.lessons.map((l) => l.phaseNumber))
    : 1;
  const nextPhaseNumber = !subsequentLessonId && generatedPhases < (path.totalPhases ?? 1)
    ? generatedPhases + 1
    : null;

  // True when this is the penultimate lesson of its phase — used to start
  // background generation of the next phase one lesson early.
  const phaseGroup = path.lessons.filter((l) => l.phaseNumber === target.phaseNumber);
  const posInPhase = phaseGroup.findIndex((l) => l.id === id);
  const isSecondToLastInPhase = nextPhaseNumber !== null && posInPhase === phaseGroup.length - 2;

  return (
    <LessonExperience
      lesson={lesson}
      lessonNumber={idx + 1}
      totalLessons={path.lessons.length}
      subsequentLessonId={subsequentLessonId}
      pathId={pathId}
      nextPhaseNumber={nextPhaseNumber}
      isSecondToLastInPhase={isSecondToLastInPhase}
    />
  );
}
