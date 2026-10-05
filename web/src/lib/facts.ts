export const MAX_FACT_CHARS = 140;
/** Per-learner cap, so the list stays reviewable and the prompt stays small. */
export const MAX_FACTS = 40;
/** How many facts the buddy is given per session (rotated, see queries.pickFactsForSession). */
export const FACTS_PER_SESSION = 3;

/**
 * Whether the Arabic buddy is shown the learner's facts. OFF on purpose. Measured with gpt-4o-mini on the Lesson 3
 * "Who are you?" scenario (npm run try:turn -- ... --fact "..."): replies containing words above the lesson went from
 * 5/38 (13%) without facts to 15/38 (39%) with three facts — the model reaches for أخت / عمل / بلد etc. despite being told
 * to use a fact only if it can be said with the allowed vocabulary. At Book 1 almost no personal fact is sayable in-lesson,
 * so the upside is ~zero. Facts still personalize the English parts of the app (recaps, memory page). To re-enable, re-run
 * that comparison first (throttle to ~5 parallel runs: the 200k tokens/min limit skews bigger batches).
 */
export const BUDDY_SPEAKS_MEMORY = false;

/** Identity of a fact, so the same thing written twice (different case/punctuation) isn't stored twice. */
export function factKey(fact: string): string {
  return fact
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Validates a fact before it's stored (whether typed by the learner or extracted by the model). Refuses contact details
 * and long numbers: the buddy remembers context for learning, not identifiers.
 */
export function sanitizeFact(raw: string): { fact: string } | { error: string } {
  const fact = raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!fact) return { error: "Write something short about yourself." };
  if (fact.length > MAX_FACT_CHARS) return { error: `Keep it under ${MAX_FACT_CHARS} characters.` };
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(fact) || /https?:\/\/|www\./i.test(fact) || (fact.match(/\d/g) ?? []).length >= 7) {
    return { error: "Please don't include emails, links, phone numbers or long numbers." };
  }
  if (!factKey(fact)) return { error: "Write something short about yourself." };
  return { fact };
}
