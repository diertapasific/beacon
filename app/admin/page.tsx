import { redirect } from "next/navigation";
import { requireAdmin, getAdminStats } from "@/lib/admin";
import { getProfileData } from "@/lib/queries";
import { AppShell } from "@/components/layout/AppShell";
import { AdminView } from "@/components/admin/AdminView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  // Non-admins (and logged-out visitors) are bounced to the app — no hint the
  // page exists.
  if (!admin) redirect("/dashboard");

  const [stats, me] = await Promise.all([getAdminStats(), getProfileData(admin.id)]);

  return (
    <AppShell streak={me?.streak.current ?? 0} level={me?.xp.level ?? 1} isAdmin>
      <AdminView stats={stats} />
    </AppShell>
  );
}
