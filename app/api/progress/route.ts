import { getUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const pathId = new URL(req.url).searchParams.get("pathId");
  if (!pathId) return Response.json({ error: "pathId is required" }, { status: 400 });

  const data = await getDashboardData(user.id, pathId);
  if (!data) return Response.json({ error: "Path not found" }, { status: 404 });

  return Response.json(data);
}
