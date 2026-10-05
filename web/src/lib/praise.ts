import { normalizeArabic } from "@/content/lessons";

/**
 * The model praises nearly every reply ("مُمْتَازٌ!" opened ~85% of replies even when told praise must be rare), which makes it
 * meaningless and robotic — and it ignores the instruction. So frequency is enforced here, in code, like the other guards:
 * praise is allowed only if none of the last few buddy replies had any, and never alongside a correction.
 */

/** Praise words, normalized (no diacritics, ة→ه), without the feminine ending. */
const PRAISE = new Set(["ممتاز", "جيد", "رائع", "صحيح", "حسن", "حسنا", "مبروك"].map(normalizeArabic));
/** How many recent buddy replies must be praise-free before another is allowed (so at most ~1 reply in 4). */
export const PRAISE_COOLDOWN = 3;

const clean = (token: string) => normalizeArabic(token.replace(/[.!?؟،,]/g, ""));
const isPraiseToken = (token: string) => {
  const t = clean(token);
  return PRAISE.has(t) || (t.endsWith("ه") && PRAISE.has(t.slice(0, -1))); // feminine: جيدة
};
/** "نعم،" before a praise word still counts as an opener ("نعم، ممتاز"). */
const isYes = (token: string) => clean(token) === normalizeArabic("نعم");

const SENTENCE = /[^.!?؟\n]+[.!?؟]?\s*/g;

/** The sentence's tokens that are praise at the start of the sentence (after an optional "نعم"), as [from, to) indexes, or null. */
function openingPraise(tokens: string[]): [number, number] | null {
  const i = isYes(tokens[0] ?? "") ? 1 : 0;
  // "ما شاء الله"
  if (tokens.length >= i + 3 && clean(tokens[i]) === "ما" && clean(tokens[i + 1]) === normalizeArabic("شاء") && clean(tokens[i + 2]) === normalizeArabic("الله")) {
    return [i, i + 3];
  }
  if (tokens[i] !== undefined && isPraiseToken(tokens[i])) return [i, i + 1];
  return null;
}

/** True if the text opens any sentence with an allowed praise expression. */
export function containsPraise(text: string): boolean {
  return (text.match(SENTENCE) ?? []).some((s) => openingPraise(s.trim().split(/\s+/).filter(Boolean)) !== null);
}

/**
 * Removes sentence-opening praise ("مُمْتَازٌ! …", "نَعَمْ، صَحِيحٌ. …", "مَا شَاءَ اللَّهُ، …"). Praise that isn't an opener (e.g. in
 * "هَلْ هَذَا صَحِيحٌ؟") is left alone. If removing it would leave nothing, the original text is returned.
 */
export function stripPraise(text: string): string {
  const kept: string[] = [];
  for (const sentence of text.match(SENTENCE) ?? []) {
    const tokens = sentence.trim().split(/\s+/).filter(Boolean);
    const span = openingPraise(tokens);
    if (!span) {
      kept.push(sentence.trim());
      continue;
    }
    const [from, to] = span;
    const rest = [...tokens.slice(0, from), ...tokens.slice(to)];
    if (!rest.length || rest.every((t) => isYes(t))) continue; // the sentence was only praise
    // Keep the original sentence's end punctuation if the removed praise token carried it.
    kept.push(rest.join(" "));
  }
  const result = kept.join(" ").trim();
  return result || text;
}

/** Applies the cooldown: returns `reply` unchanged if praise is allowed now, otherwise `reply` without opening praise. */
export function limitPraise(reply: string, recentBuddyReplies: string[], hasRecast: boolean): string {
  const cooledDown = !recentBuddyReplies.slice(-PRAISE_COOLDOWN).some(containsPraise);
  return !hasRecast && cooledDown ? reply : stripPraise(reply);
}
