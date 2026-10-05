import { scenarios } from "@/content/scenarios";
import { getUser } from "@/lib/auth/server";
import { getRecentMistakes, getSession, getTurns, saveExchange, type VoiceInput } from "@/lib/queries";
import { generateBuddyTurn } from "@/lib/turn";

const MAX_LEARNER_CHARS = 300;
/** Cost guard until the daily voice-minute cap lands in Phase 2. */
const MAX_LEARNER_TURNS_PER_SESSION = 40;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  let body: { sessionId?: unknown; text?: unknown; voice?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_LEARNER_CHARS || typeof body.sessionId !== "string") {
    return Response.json({ error: `Send a message of 1-${MAX_LEARNER_CHARS} characters.` }, { status: 400 });
  }

  // Optional: the message was dictated. Keep what the recogniser heard next to what the learner confirmed.
  let voice: VoiceInput | null = null;
  if (body.voice && typeof body.voice === "object") {
    const v = body.voice as { asrText?: unknown; seconds?: unknown };
    if (typeof v.asrText === "string" && typeof v.seconds === "number" && Number.isFinite(v.seconds)) {
      voice = { asrText: v.asrText.slice(0, MAX_LEARNER_CHARS), seconds: Math.min(30, Math.max(0, v.seconds)) };
    }
  }

  const session = await getSession(user.id, body.sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  const scenario = scenarios.find((s) => s.id === session.scenarioId);
  if (!scenario) return Response.json({ error: "Scenario no longer exists" }, { status: 410 });

  const turns = await getTurns(session.id);
  if (turns.filter((t) => t.role === "learner").length >= MAX_LEARNER_TURNS_PER_SESSION) {
    return Response.json({ error: "This session is full — start a new one." }, { status: 429 });
  }

  try {
    const buddy = await generateBuddyTurn({
      scenario,
      history: turns.map((t) => ({
        role: t.role,
        text: t.role === "buddy" ? t.textDiacritized : (t.transcriptRaw ?? t.textDisplay),
      })),
      learnerText: text,
      recentMistakes: await getRecentMistakes(user.id),
    });
    const buddyTurnId = await saveExchange(user.id, session.id, text, voice, buddy);

    return Response.json({
      buddy: {
        id: buddyTurnId,
        textDiacritized: buddy.textDiacritized,
        textDisplay: buddy.textDisplay,
        recast: buddy.recast,
        promptRepeat: buddy.promptRepeat,
      },
    });
  } catch (err) {
    console.error("turn failed", err);
    return Response.json({ error: "The buddy couldn't reply. Please try again." }, { status: 502 });
  }
}
