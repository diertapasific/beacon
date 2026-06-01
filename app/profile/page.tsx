import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getProfileData } from "@/lib/queries";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const data = await getProfileData(user.id);
  if (!data) redirect("/auth/login");

  return (
    <AppShell streak={data.streak.current} level={data.xp.level}>
      <ProfileView data={data} />
    </AppShell>
  );
}
