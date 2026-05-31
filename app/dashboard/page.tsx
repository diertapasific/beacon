import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getUserPathsSummary } from "@/lib/queries";
import { Navbar } from "@/components/layout/Navbar";
import { PathList } from "@/components/dashboard/PathList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const paths = await getUserPathsSummary(user.id);
  if (paths.length === 0) redirect("/onboarding");

  return (
    <>
      <Navbar streak={0} level={1} />
      <PathList paths={paths} userName={user.name} />
    </>
  );
}
