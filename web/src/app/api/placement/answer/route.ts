import { getUser } from "@/lib/auth/server";
import { submitAnswer } from "@/lib/placement-store";

const MAX_ANSWER_CHARS = 300;

/**
 * Takes the learner's answer to the current question. The response never says whether an answer was right — only what to ask
 * next, or (when finished) where to start — so the test feels like a conversation, not an exam.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  let body: { attemptId?: unknown; text?: unknown; index?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_ANSWER_CHARS || typeof body.attemptId !== "string" || !Number.isInteger(body.index)) {
    return Response.json({ error: `Type or say your answer (up to ${MAX_ANSWER_CHARS} characters).` }, { status: 400 });
  }

  const state = await submitAnswer(user.id, body.attemptId, text, body.index as number);
  if (!state) return Response.json({ error: "Placement not found" }, { status: 404 });
  return Response.json({ index: state.index, prompt: state.item?.prompt ?? null, done: state.done, placement: state.placement });
}
