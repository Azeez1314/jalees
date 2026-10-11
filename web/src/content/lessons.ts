import { normalizeArabic } from "@/lib/arabic";
import { generateForms, expandSlots } from "@/lib/verbs";
import { book1Lessons } from "./book1";
import { book2Lessons } from "./book2";
import type { Lesson, VerbEntry, VerbSlot } from "./types";

export { normalizeArabic };

/**
 * The course across all Madinah books. Each lesson has a book-local number (`lessonNo`, what the book prints) and a global
 * `position` (1-23 for Book 1, 24-54 for Book 2, …). Everything cumulative — vocabulary, grammar, verbs, genders — is keyed by
 * position, and a learner's level (`profiles.level_lesson`) is a position. For Book 1 position === lessonNo, so nothing that was
 * written against Book 1 changes.
 */
export interface PlacedLesson extends Lesson {
  position: number;
}

const authored: Lesson[] = [...book1Lessons, ...book2Lessons].sort((a, b) => a.book - b.book || a.lessonNo - b.lessonNo);
export const lessons: PlacedLesson[] = authored.map((l, i) => ({ ...l, position: i + 1 }));

/** The global position of Book `book`, lesson `lessonNo`. Throws for lessons that are not authored (typos in content fail loudly). */
export function positionOf(book: number, lessonNo: number): number {
  const l = lessons.find((x) => x.book === book && x.lessonNo === lessonNo);
  if (!l) throw new Error(`No such lesson: Book ${book}, Lesson ${lessonNo}`);
  return l.position;
}

/** "Book 2, Lesson 3" for a global position. */
export function describePosition(position: number): string {
  const l = lessons.find((x) => x.position === position);
  return l ? `Book ${l.book}, Lesson ${l.lessonNo}` : `Lesson ${position}`;
}

/** Feminine هذه and adjective agreement (ة forms) are taught from this lesson. */
export const FEMININE_FROM = 6;
/** Feminine تلك is taught from this lesson. */
export const FAR_FEMININE_FROM = 7;
/** The first lesson with an allowed verb. */
export const VERBS_FROM = 4;

/**
 * Words that are not "lesson vocabulary" but must never be flagged: greetings and set expressions, and "and". Deliberately NOT
 * grammar words: هذا, أين, هو, في, ما… are taught lesson by lesson (see the tables above), so the buddy can't use them early.
 */
export const alwaysAllowed = new Set([
  "و",
  "السلام", "عليكم", "وعليكم", "ورحمة", "رحمة", "وبركاته", "الله", "بسم", "الرحمن", "الرحيم", "الحمد", "رب", "العالمين",
  "صباح", "الخير", "مساء", "شكرا", "عفوا", "فضلك",
  // Praise (below): taught as whole expressions from lesson 1.
  "حسنا",
]);

/**
 * Set praise expressions available from lesson 1. Praise is the one thing a buddy always wants to say, and without a list
 * it reaches for words the learner hasn't studied (ممتاز, مبروك, ما شاء الله...). No verbs (so no أحسنت): those stay
 * banned. Adjectives agree with what they describe like any other. "شاء" is allowed only as part of ما شاء الله.
 */
export const praisePhrases = ["مُمْتَازٌ", "جَيِّدٌ", "رَائِعٌ", "صَحِيحٌ", "حَسَنٌ", "مَبْرُوكٌ", "مَا شَاءَ اللَّهُ"];
for (const phrase of praisePhrases) {
  const words = phrase.split(" ");
  for (const word of words) alwaysAllowed.add(normalizeArabic(word));
  if (words.length === 1) alwaysAllowed.add(normalizeArabic(phrase) + "ه"); // feminine form of an adjective: جيدة
}

/** Regular feminine of a masculine adjective: add ة (written ه once normalized). */
const feminine = (adjective: string) => normalizeArabic(adjective) + "ه";

/**
 * Markers live in the same set as words; they contain "@" so they can never collide with an Arabic token.
 *  - "@p:ل" / "@s:ي" switch a prefix / suffix on.
 *  - "@v:ذهب" is a hand-listed verb form (Book 1): it matches that exact spelling only, so أَذْهَبُ "I go" or اذْهَبْ "go!" can't
 *    sneak in as أ + ذهب.
 *  - "@g:يذهبون" is a form GENERATED from a verb's root and class for a slot the learner has been taught (see lib/verbs.ts).
 *    Unlike "@v:" it may carry an object pronoun (يحبونه), the future سـ, or a yes/no أ — `checkVocab` handles those.
 */
export const prefixMarker = (p: string) => `@p:${p}`;
export const suffixMarker = (s: string) => `@s:${s}`;
export const verbMarker = (v: string) => `@v:${normalizeArabic(v)}`;
export const generatedMarker = (form: string) => `@g:${normalizeArabic(form)}`;
export const objectMarker = (o: string) => `@o:${o}`;

const verbsThrough = (upto: number): VerbEntry[] => lessons.filter((l) => l.position <= upto).flatMap((l) => l.verbs ?? []);

/** Every conjugation slot unlocked through position N. */
export function unlockedSlots(uptoLesson: number): VerbSlot[] {
  const patterns = lessons.filter((l) => l.position <= uptoLesson).flatMap((l) => l.verbSlots ?? []);
  return expandSlots(patterns);
}

const vocabCache = new Map<number, Set<string>>();

/**
 * Cumulative allowed vocab through lesson position N (inclusive), normalized, plus markers (see above). Returns a copy, so
 * callers may add to it.
 */
export function cumulativeVocab(uptoLesson: number): Set<string> {
  const cached = vocabCache.get(uptoLesson);
  if (cached) return new Set(cached);

  const set = new Set<string>();
  for (const lesson of lessons) {
    if (lesson.position > uptoLesson) continue;
    for (const w of lesson.newVocab) set.add(normalizeArabic(w));
    for (const w of lesson.newVerbs ?? []) set.add(verbMarker(w));
    for (const w of lesson.newAdjectives ?? []) {
      set.add(normalizeArabic(w));
      if (uptoLesson >= FEMININE_FROM) set.add(feminine(w));
    }
    for (const p of lesson.newAffixes?.prefixes ?? []) set.add(prefixMarker(p));
    for (const s of lesson.newAffixes?.suffixes ?? []) set.add(suffixMarker(s));
    for (const o of lesson.newAffixes?.objects ?? []) set.add(objectMarker(o));
  }
  // Verbs taught as root + class: every unlocked slot of every verb known so far.
  const slots = unlockedSlots(uptoLesson);
  for (const verb of verbsThrough(uptoLesson)) {
    for (const slot of slots) for (const form of generateForms(verb, slot)) set.add(generatedMarker(form));
  }
  for (const w of alwaysAllowed) set.add(normalizeArabic(w));
  vocabCache.set(uptoLesson, set);
  return new Set(set);
}

/** The hand-listed exact verb forms (Book 1) allowed through position N, as written in the tables (diacritized). */
export function cumulativeVerbs(uptoLesson: number): string[] {
  return lessons.filter((l) => l.position <= uptoLesson).flatMap((l) => l.newVerbs ?? []);
}

/** The verbs (root + class) known through position N, de-duplicated by root and form (a later entry replaces an earlier one). */
export function cumulativeVerbLemmas(uptoLesson: number): VerbEntry[] {
  const byKey = new Map<string, VerbEntry>();
  for (const v of verbsThrough(uptoLesson)) byKey.set(`${normalizeArabic(v.root)}/${v.form ?? 1}`, v);
  return [...byKey.values()];
}

/** Cumulative allowed grammar tags through position N (inclusive), for the prompt. */
export function cumulativeGrammar(uptoLesson: number): string[] {
  return lessons
    .filter((l) => l.position <= uptoLesson)
    .flatMap((l) => l.newGrammar);
}
