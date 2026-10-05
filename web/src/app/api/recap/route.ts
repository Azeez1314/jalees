import { getUser } from "@/lib/auth/server";
import { getSession } from "@/lib/queries";
import { getOrCreateRecap } from "@/lib/recap-service";

/** Generates (once) and returns the recap for a session. See lib/recap-service.ts. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  let sessionId: unknown;
  try {
    sessionId = ((await request.json()) as { sessionId?: unknown }).sessionId;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof sessionId !== "string") return Response.json({ error: "sessionId required" }, { status: 400 });

  const session = await getSession(user.id, sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  try {
    const result = await getOrCreateRecap(user.id, session);
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ recap: result.recap });
  } catch (err) {
    console.error("recap failed", err);
    return Response.json({ error: "Couldn't build the recap. Please try again." }, { status: 502 });
  }
}
