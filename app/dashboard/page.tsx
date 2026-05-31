import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getUserPathsSummary } from "@/lib/queries";
import { getStreak } from "@/lib/streak";
import { AppShell } from "@/components/layout/AppShell";
import { PathList } from "@/components/dashboard/PathList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const [paths, streak] = await Promise.all([
    getUserPathsSummary(user.id),
    getStreak(user.id),
  ]);

  if (paths.length === 0) redirect("/onboarding");

  return (
    <AppShell streak={streak?.current ?? 0} level={user.level}>
      <PathList paths={paths} userName={user.name} />
    </AppShell>
  );
}
