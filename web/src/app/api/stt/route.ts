import { extensionFor, transcribe } from "@/lib/ai/stt";
import { getUser } from "@/lib/auth/server";
import { paywall } from "@/lib/guard";
import { addUsage, getUsage } from "@/lib/usage";

export const maxDuration = 30;

const MAX_BYTES = 1_000_000; // 30 s of opus is ~250 KB; this leaves headroom without letting anyone upload a podcast
const MAX_SECONDS = 30;

/** Dictation. multipart: `audio` (file) + `seconds` (recording length as measured by the browser). Audio is never stored. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const locked = await paywall(user.id);
  if (locked) return locked;

  const usage = await getUsage(user.id);
  if (usage.remainingSeconds <= 0) {
    return Response.json(
      { error: "You've used today's voice time. Text practice still works — voice resets tomorrow.", remainingSeconds: 0 },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart upload" }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return Response.json({ error: "No audio received" }, { status: 400 });
  if (audio.size > MAX_BYTES) return Response.json({ error: "Recording too long — keep it under 30 seconds" }, { status: 413 });
  if (!extensionFor(audio.type)) return Response.json({ error: `Unsupported audio type: ${audio.type || "unknown"}` }, { status: 415 });

  // Charged to the daily cap by the browser-measured length, clamped to the 30 s maximum.
  const reported = Number(form.get("seconds"));
  const seconds = Math.min(MAX_SECONDS, Math.max(1, Number.isFinite(reported) ? reported : 5));

  try {
    const { text } = await transcribe({ bytes: new Uint8Array(await audio.arrayBuffer()), contentType: audio.type });
    const after = await addUsage(user.id, { stt: seconds });
    if (!text) {
      return Response.json(
        { error: "I couldn't hear anything — try again a little closer to the microphone.", remainingSeconds: after.remainingSeconds },
        { status: 422 }
      );
    }
    return Response.json({ text, remainingSeconds: after.remainingSeconds });
  } catch (err) {
    console.error("stt failed", err);
    return Response.json({ error: "Couldn't transcribe that. Please try again." }, { status: 502 });
  }
}
