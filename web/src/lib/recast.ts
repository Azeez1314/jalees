import { cumulativeGenders } from "@/content/genders";
import { normalizeArabic } from "@/content/lessons";

/**
 * Deterministic check that a model-proposed correction is a *minimal, safe* fix. The model (gpt-4o-mini) will
 * sometimes "correct" a sentence by swapping the learner's noun for a different word (كتاب → كتابة) and teach
 * wrong Arabic, so a correction may only:
 *   - swap/add function words (demonstratives, personal pronouns), or
 *   - add/remove the feminine ة on a word that is not a known noun (i.e. adjective agreement).
 * It may never introduce a new content word or change a noun. Conservative by design: valid corrections of other
 * kinds (e.g. a genuine word-choice fix) are rejected and simply not shown.
 */

const FUNCTION_WORDS = new Set(
  ["هذا", "هذه", "ذلك", "تلك", "هو", "هي", "أنت", "أنتِ", "أنا", "في", "على", "من", "إلى", "مع", "هل", "ما", "أين"].map(normalizeArabic)
);

function tokens(text: string): string[] {
  return (normalizeArabic(text).match(/[ء-ي]+/g) ?? []).map((t) => t.replace(/^ال(?=.)/, ""));
}

export function isSafeRecast(original: string, corrected: string, lessonNo: number): boolean {
  const orig = tokens(original);
  const corr = tokens(corrected);
  if (!orig.length || !corr.length) return false;
  if (orig.join(" ") === corr.join(" ")) return false; // diacritics-only: not a correction

  const g = cumulativeGenders(lessonNo);
  const nouns = new Set([...g.masculine, ...g.feminine].flatMap((w) => tokens(w)));
  const origSet = new Set(orig);

  for (const c of corr) {
    if (origSet.has(c) || FUNCTION_WORDS.has(c)) continue;
    // Feminine ة (normalized to ه) added to / removed from an adjective the learner already wrote.
    const base = c.endsWith("ه") ? c.slice(0, -1) : c;
    const isGenderSwap = origSet.has(base) || origSet.has(base + "ه");
    if (isGenderSwap && !nouns.has(base)) continue;
    return false;
  }
  return true;
}
