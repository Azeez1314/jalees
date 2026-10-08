import { lessons } from "@/content/lessons";
import { placementItems, type PlacementItem } from "@/content/placement";
import { detectAgreementError, wordsKey } from "@/lib/agreement";

/** Final ة and ه are interchangeable (learners type ه), so compare them as one letter. */
const canon = (w: string) => w.replace(/ة$/, "ه");
const wordsOf = (text: string) => wordsKey(text).split(" ").filter(Boolean).map(canon);

/**
 * Does the learner's Arabic answer the prompt? Every slot must be matched by one of its alternatives, and the answer must not
 * pair a demonstrative with a noun of the wrong gender. Deterministic: same answer, same verdict, no model involved.
 */
export function scoreAnswer(item: PlacementItem, answer: string): boolean {
  const words = new Set(wordsOf(answer));
  if (!words.size) return false;
  const slotsMet = item.slots.every((alternatives) => alternatives.some((alt) => wordsOf(alt).every((w) => words.has(w))));
  return slotsMet && detectAgreementError(answer, item.lessonNo) === null;
}

export interface ItemResult {
  itemId: string;
  lessonNo: number;
  pass: boolean;
}

/**
 * The next item to ask, or null when placement is over. Items are asked in order and placement STOPS at the first miss
 * (no humiliation spiral of questions the learner can't answer).
 */
export function nextItem(results: ItemResult[], items: PlacementItem[] = placementItems): PlacementItem | null {
  const byId = new Map(results.map((r) => [r.itemId, r]));
  for (const item of items) {
    const r = byId.get(item.id);
    if (!r) return item;
    if (!r.pass) return null;
  }
  return null;
}

export interface Placement {
  /** The lesson to practise (profiles.level_lesson). */
  lesson: number;
  /** True when the learner passed everything we can test and there is no further content to place them in. */
  beyondContent: boolean;
}

/** Highest lesson that has content (scenarios and vocabulary tables); grows automatically as lessons are added. */
export const maxContentLesson = () => Math.max(...lessons.map((l) => l.lessonNo));

/** Start lesson = the lesson of the first missed item; if nothing was missed, one past the last lesson tested (capped at the content). */
export function placeLearner(results: ItemResult[], items: PlacementItem[] = placementItems, contentMax: number = maxContentLesson()): Placement {
  const miss = items.map((i) => results.find((r) => r.itemId === i.id)).find((r) => r && !r.pass);
  if (miss) return { lesson: miss.lessonNo, beyondContent: false };
  const maxTested = Math.max(...items.map((i) => i.lessonNo));
  return { lesson: Math.min(maxTested + 1, contentMax), beyondContent: maxTested >= contentMax };
}

export function isFinished(results: ItemResult[], items: PlacementItem[] = placementItems): boolean {
  return nextItem(results, items) === null;
}
