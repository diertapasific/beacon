import { getUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getDashboardData(user.id);
  if (!data) return Response.json({ redirect: "/onboarding" });

  return Response.json(data);
}
