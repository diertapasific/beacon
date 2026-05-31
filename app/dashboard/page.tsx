import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getUserPathsSummary } from "@/lib/queries";
import { AppShell } from "@/components/layout/AppShell";
import { PathList } from "@/components/dashboard/PathList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const paths = await getUserPathsSummary(user.id);
  if (paths.length === 0) redirect("/onboarding");

  return (
    <AppShell streak={0} level={1}>
      <PathList paths={paths} userName={user.name} />
    </AppShell>
  );
}
