import { getUser } from "@/lib/auth/server";
import { exportUserData } from "@/lib/account";

/** "Download my data": a JSON file with everything stored about the signed-in learner (and nothing about anyone else). */
export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const data = await exportUserData(user.id, user.email ?? null);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="jalees-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
