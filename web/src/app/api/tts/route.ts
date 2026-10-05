import { synthesize } from "@/lib/ai/tts";
import { getUser } from "@/lib/auth/server";
import { getOwnBuddyTurnText } from "@/lib/queries";
import { addUsage, getUsage } from "@/lib/usage";

/**
 * Speaks one of the buddy's own turns. Takes a turn id, not text: the server loads the text for a turn the user owns,
 * so this endpoint can't be used as a free general-purpose TTS.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  let turnId: unknown;
  try {
    turnId = ((await request.json()) as { turnId?: unknown }).turnId;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof turnId !== "string") return Response.json({ error: "turnId required" }, { status: 400 });

  const usage = await getUsage(user.id);
  if (usage.remainingSeconds <= 0) {
    return Response.json({ error: "You've used today's voice time.", remainingSeconds: 0 }, { status: 429 });
  }

  const text = await getOwnBuddyTurnText(user.id, turnId);
  if (!text) return Response.json({ error: "Turn not found" }, { status: 404 });

  try {
    const { bytes, contentType, estSeconds } = await synthesize(text);
    const after = await addUsage(user.id, { tts: estSeconds });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Voice-Remaining": String(Math.round(after.remainingSeconds)),
      },
    });
  } catch (err) {
    console.error("tts failed", err);
    return Response.json({ error: "Couldn't generate the audio." }, { status: 502 });
  }
}
