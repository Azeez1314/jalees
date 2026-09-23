import OpenAI from "openai";
import { buildBuddySystemPrompt, buildGrammarGraderPrompt } from "./prompts.js";
import { normalizeArabic } from "./lessons.js";
import type { BuddyTurn, GrammarViolation } from "./types.js";

// The buddy model is what the real app would run in production — keep this on
// whatever cheap tier the product actually ships with.
const BUDDY_MODEL = "gpt-4o-mini";

// The grader only runs during this dev-time eval (~100 calls, never per-user),
// so its cost is negligible — use the most reliable model available on this
// key. Currently the same cheap tier because this OpenAI project has no
// access to a stronger model yet; bump this once that's sorted (e.g. to
// "gpt-6-sol" after org verification) without touching BUDDY_MODEL.
const GRADER_MODEL = "gpt-4o-mini";

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}

export async function getBuddyTurn(
  client: OpenAI,
  lessonNo: number,
  scenarioGoal: string,
  learnerTurn: string
): Promise<BuddyTurn> {
  const system = buildBuddySystemPrompt(lessonNo, scenarioGoal);
  const res = await client.chat.completions.create({
    model: BUDDY_MODEL,
    max_completion_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: learnerTurn },
    ],
  });
  const text = res.choices[0].message.content ?? "";
  const parsed = extractJson(text) as BuddyTurn;
  if (typeof parsed.reply_diacritized !== "string") {
    throw new Error(`Malformed buddy JSON: ${text}`);
  }
  return parsed;
}

export async function getGrammarViolations(
  client: OpenAI,
  lessonNo: number,
  buddyReply: string
): Promise<GrammarViolation[]> {
  const prompt = buildGrammarGraderPrompt(lessonNo, buddyReply);
  const res = await client.chat.completions.create({
    model: GRADER_MODEL,
    max_completion_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.choices[0].message.content ?? "";
  const parsed = extractJson(text) as { within_scope: boolean; violations: GrammarViolation[] };
  const violations = parsed.violations ?? [];

  // Grader models occasionally hallucinate "evidence" that isn't actually in the
  // text they were grading (observed with gpt-4o-mini citing a verb that never
  // appeared). Drop anything that doesn't normalize-match a real substring.
  const normalizedReply = normalizeArabic(buddyReply);
  return violations.filter((v) => v.evidence && normalizedReply.includes(normalizeArabic(v.evidence)));
}
