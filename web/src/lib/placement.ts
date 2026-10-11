import { lessons } from "@/content/lessons";
import { placementItems, type PlacementItem } from "@/content/placement";
import { detectAgreementError, wordsKey } from "@/lib/agreement";

/** Final ة and ه are interchangeable (learners type ه), so compare them as one letter. */
const canon = (w: string) => w.replace(/ة$/, "ه");
const wordsOf = (text: string) => wordsKey(text).split(" ").filter(Boolean).map(canon);
/** A learner's word, also without a fused "and" (وذلك → ذلك) or a yes/no أ (أهذا → هذا). Slots are matched against these. */
const withoutAttached = (w: string) => [w, ...(w.length > 3 && /^[وا]/.test(w) ? [w.slice(1)] : [])];

/**
 * Does the learner's Arabic answer the prompt? Every slot must be matched by one of its alternatives, and the answer must not
 * pair a demonstrative with a noun of the wrong gender. Deterministic: same answer, same verdict, no model involved.
 */
export function scoreAnswer(item: PlacementItem, answer: string): boolean {
  const words = new Set(wordsOf(answer).flatMap(withoutAttached));
  if (!words.size) return false;
  const slotsMet = item.slots.every((alternatives) => alternatives.some((alt) => wordsOf(alt).every((w) => words.has(w))));
  return slotsMet && detectAgreementError(answer, item.lessonNo) === null;
}

export interface ItemResult {
  itemId: string;
  lessonNo: number;
  pass: boolean;
}

/** After this many passes in a row the test starts skipping ahead; the skip grows by one every SKIP_EVERY passes. */
export const SKIP_EVERY = 3;

interface Walk {
  /** Index into `items` of the question to ask now, or null when the test is over. */
  next: number | null;
  /** True once the learner has missed an item, or every item up to the last one has been answered. */
  finished: boolean;
}

/**
 * Replays the stored answers to find where the test is. Items are asked in order; placement STOPS at the first miss (no
 * humiliation spiral). So that a strong learner is not asked every item of a 50-lesson course, the walk SKIPS AHEAD as the
 * learner keeps passing: three passes in a row, then every second item, then every third… (and the final, hardest item is always
 * asked before the test can end). Deterministic from the stored answers alone, so the server never needs more state.
 */
function walk(results: ItemResult[], items: PlacementItem[]): Walk {
  let pos = 0;
  let passes = 0;
  let lastAsked = -1;
  for (const r of results) {
    const asked = items.findIndex((i) => i.id === r.itemId);
    if (asked < 0) continue; // an item that no longer exists: ignore it
    lastAsked = Math.max(lastAsked, asked);
    if (!r.pass) return { next: null, finished: true };
    pos = asked + 1 + Math.floor(passes / SKIP_EVERY);
    passes++;
  }
  if (pos >= items.length) {
    // Skipped past the end: the hardest item must still be tested before we conclude "beyond".
    return lastAsked < items.length - 1 ? { next: items.length - 1, finished: false } : { next: null, finished: true };
  }
  return { next: pos, finished: false };
}

/** The next item to ask, or null when placement is over. */
export function nextItem(results: ItemResult[], items: PlacementItem[] = placementItems): PlacementItem | null {
  const { next } = walk(results, items);
  return next === null ? null : items[next];
}

export interface Placement {
  /** The lesson (global position) to practise (profiles.level_lesson). */
  lesson: number;
  /** True when the learner passed everything we can test and there is no further content to place them in. */
  beyondContent: boolean;
}

/** Highest lesson POSITION that has content (scenarios and vocabulary tables); grows automatically as lessons are added. */
export const maxContentLesson = () => Math.max(...lessons.map((l) => l.position));

/**
 * Start lesson = one past the highest lesson the learner demonstrably knows, i.e. the highest lesson below the missed item's lesson
 * in which they passed an item. (With every lesson tested that is simply the lesson of the miss; when the test skipped ahead it
 * starts the learner a little earlier rather than later.) If nothing was missed: one past the last lesson tested (capped at the
 * content), and "beyond content" when the whole course was passed.
 */
export function placeLearner(results: ItemResult[], items: PlacementItem[] = placementItems, contentMax: number = maxContentLesson()): Placement {
  const miss = results.find((r) => !r.pass);
  if (miss) {
    const knownBelow = results.filter((r) => r.pass && r.lessonNo < miss.lessonNo).map((r) => r.lessonNo);
    const known = knownBelow.length ? Math.max(...knownBelow) : 0;
    return { lesson: Math.min(known + 1, miss.lessonNo), beyondContent: false };
  }
  const maxTested = Math.max(...items.map((i) => i.lessonNo));
  return { lesson: Math.min(maxTested + 1, contentMax), beyondContent: maxTested >= contentMax };
}

export function isFinished(results: ItemResult[], items: PlacementItem[] = placementItems): boolean {
  return walk(results, items).finished;
}
