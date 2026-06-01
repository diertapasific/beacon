import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export default async function PathDashboardPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;

  const user = await getUser();
  if (!user) redirect("/auth/login");

  const data = await getDashboardData(user.id, pathId);
  if (!data) notFound();

  return (
    <AppShell
      streak={data.streak.current}
      level={data.xp.level}
      pathName={data.path.skill}
      pathId={pathId}
      nextLessonId={data.nextLessonId}
    >
      <Dashboard data={data} showTour={!user.hasOnboarded} />
    </AppShell>
  );
}
