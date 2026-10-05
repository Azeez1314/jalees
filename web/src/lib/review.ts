import { wordsKey } from "@/lib/agreement";

/** Spaced-review ladder: a new mistake is first due after 1 day; each correct review moves it to the next rung. */
export const LADDER_DAYS = [1, 3, 7, 21] as const;
/** Correct reviews in a row after which a mistake counts as mastered and leaves the queue. */
export const MASTERED_AT = LADDER_DAYS.length;

export interface ReviewState {
  /** Correct reviews in a row. */
  reviewCount: number;
  mastered: boolean;
  /** Days until the next review (null once mastered). */
  nextInDays: number | null;
}

/** The new state after answering a review card. Correct = up one rung; wrong = back to the start (1 day). */
export function nextReview(reviewCount: number, correct: boolean): ReviewState {
  if (!correct) return { reviewCount: 0, mastered: false, nextInDays: LADDER_DAYS[0] };
  const count = reviewCount + 1;
  if (count >= MASTERED_AT) return { reviewCount: count, mastered: true, nextInDays: null };
  return { reviewCount: count, mastered: false, nextInDays: LADDER_DAYS[count] };
}

/** Identity of a mistake: the corrected sentence's normalized words. Repeating the same slip maps to the same key. */
export function mistakeKey(corrected: string): string {
  return wordsKey(corrected);
}

/**
 * Only real, checkable errors go in the review bank: not the catch-all type, and not a pure deletion (a learner using a
 * word above their lesson isn't wrong). Review compares the learner's answer with `corrected`, so it must be a real fix.
 */
export function isBankable(recast: { original: string; corrected: string; errorType: string }): boolean {
  if (recast.errorType === "other") return false;
  const original = wordsKey(recast.original).split(" ").filter(Boolean);
  const corrected = wordsKey(recast.corrected).split(" ").filter(Boolean);
  if (!corrected.length || corrected.join(" ") === original.join(" ")) return false;
  const deletionOnly = corrected.length < original.length && corrected.every((w) => original.includes(w));
  return !deletionOnly;
}
