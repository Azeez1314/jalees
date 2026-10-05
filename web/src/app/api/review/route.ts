import { tips } from "@/content/tips";
import { getUser } from "@/lib/auth/server";
import { sameWords } from "@/lib/agreement";
import { applyReview, getOwnMistake } from "@/lib/mistake-bank";
import { ERROR_TYPES, type ErrorType } from "@/lib/prompt";

const MAX_ANSWER_CHARS = 300;

/** Checks a review answer against the verified correction and reschedules the mistake on the 1/3/7/21-day ladder. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });

  let body: { mistakeId?: unknown; answer?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (!answer || answer.length > MAX_ANSWER_CHARS || typeof body.mistakeId !== "string") {
    return Response.json({ error: `Type your corrected sentence (up to ${MAX_ANSWER_CHARS} characters).` }, { status: 400 });
  }

  const mistake = await getOwnMistake(user.id, body.mistakeId);
  if (!mistake) return Response.json({ error: "Mistake not found" }, { status: 404 });

  try {
    // Same normalization as everywhere else: diacritics, hamza/alef spelling and a leading ال don't matter.
    const correct = sameWords(answer, mistake.corrected);
    const state = await applyReview(user.id, mistake, correct);
    const type: ErrorType = ERROR_TYPES.includes(mistake.errorType as ErrorType) ? (mistake.errorType as ErrorType) : "other";
    return Response.json({
      correct,
      corrected: mistake.corrected,
      tip: tips[type].tip,
      mastered: state.mastered,
      nextInDays: state.nextInDays,
    });
  } catch (err) {
    console.error("review failed", err);
    return Response.json({ error: "Couldn't save that. Please try again." }, { status: 502 });
  }
}
