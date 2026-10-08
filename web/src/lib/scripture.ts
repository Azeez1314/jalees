import { normalizeArabic } from "@/content/lessons";

/**
 * The buddy must never quote, paraphrase or attribute anything to the Qur'an or hadith (docs/product-spec.md: scripture is
 * retrieval-only, never model-generated; "one fabricated hadith kills the product"). The prompt says so, and this guard enforces it
 * in code, because a prompt rule alone can't be trusted. Everyday expressions the course teaches (السلام عليكم, بسم الله, الحمد لله)
 * are NOT flagged: they are greetings, not quotations. What is flagged is anything that frames or points at scripture.
 */

const MARKER_WORDS = ["قران", "القران", "حديث", "الحديث", "ايه", "سوره", "تعالي", "سبحانه", "ﷺ"].map(normalizeArabic);
/** Whole phrases (normalized): attributions like "قال الله", "قال رسول الله". */
const MARKER_PHRASES = ["قال الله", "قال رسول", "قال النبي", "قال تعالي", "رسول الله", "صلي الله عليه", "عز وجل", "رضي الله"].map(normalizeArabic);
const QUOTE_BRACKETS = /[﴿﴾]/;

const tokens = (text: string) => normalizeArabic(text).replace(/[^ء-ي؀-ۿﷺ\s]/g, " ").split(/\s+/).filter(Boolean);

export function containsScripture(text: string): boolean {
  if (QUOTE_BRACKETS.test(text) || text.includes("ﷺ")) return true;
  const words = tokens(text);
  if (words.some((w) => MARKER_WORDS.includes(w))) return true;
  const joined = ` ${words.join(" ")} `;
  return MARKER_PHRASES.some((p) => joined.includes(` ${p}`));
}

const SENTENCE = /[^.!?؟\n]+[.!?؟]?\s*/g;

/** Drops every sentence that frames scripture; returns "" if nothing is left (the caller then falls back to a safe line). */
export function stripScripture(text: string): string {
  return (text.match(SENTENCE) ?? []).filter((s) => !containsScripture(s)).join("").trim();
}
