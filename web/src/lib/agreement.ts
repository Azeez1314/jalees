import { cumulativeGenders } from "@/content/genders";
import { stripTashkeel } from "@/lib/arabic";

/**
 * Deterministic demonstrative–noun gender-agreement check (هذا/ذلك + masculine noun, هذه/تلك + feminine noun).
 * This is the commonest beginner error in lessons 1-5, and gpt-4o-mini is only intermittently reliable at flagging
 * it — so the app decides *whether* there is an error and *what the fix is* from the gender table, and the model's job
 * is reduced to restating it (see turn.ts). Conservative by design: only an adjacent demonstrative + a noun from the
 * lesson's gender table is judged; anything else returns null and is left to the model's (validated) judgment.
 */

const MASCULINE_DEMONSTRATIVES = new Set(["هذا", "ذلك", "ذاك"]);
const FEMININE_DEMONSTRATIVES = new Set(["هذه", "تلك"]);

/** The demonstrative of the opposite gender, fully diacritized (the learner types without tashkeel). */
const SWAP: Record<string, string> = {
  هذا: "هَذِهِ",
  هذه: "هَذَا",
  ذلك: "تِلْكَ",
  ذاك: "تِلْكَ",
  تلك: "ذَلِكَ",
};

/** Nouns whose gender varies between speakers/sources — never judged, to avoid "correcting" something valid. */
const NOT_JUDGED = new Set(["سوق"].map(norm));

const POSSESSIVE_SUFFIXES = ["كم", "هم", "نا", "ها", "ي", "ك", "ه"]; // longest first; taught from lesson 5

const WORD = /[ء-غـ-ٰٟ]+/g;
const SENTENCE_BREAK = /[.!?؟\n]/;

/**
 * Letters-only form that deliberately KEEPS ة. Unlike the vocab checker's normalizer (which folds ة into ه), this
 * must tell كتابة "writing" apart from كتابه "his book" — mistaking one for the other would "correct" valid Arabic.
 */
function norm(word: string): string {
  return stripTashkeel(word)
    .replace(/ـ/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي");
}

const bare = (word: string) => norm(word).replace(/^ال(?=.)/, "");

export interface AgreementError {
  /** The learner's sentence containing the error, exactly as typed. */
  original: string;
  /** The same sentence with the demonstrative swapped (that word diacritized; the rest as the learner typed it). */
  corrected: string;
  /** Normalized corrected demonstrative and the noun it must agree with — used to verify a reply models the fix. */
  fixedDemonstrative: string;
  noun: string;
}

/** A demonstrative, possibly with a fused و/ف ("and this" = وهذا). `prefixLength` counts the raw characters of that prefix. */
function demonstrativeOf(raw: string): { key: string; prefixLength: number } | null {
  const key = norm(raw);
  if (MASCULINE_DEMONSTRATIVES.has(key) || FEMININE_DEMONSTRATIVES.has(key)) return { key, prefixLength: 0 };
  if ((key[0] === "و" || key[0] === "ف") && key.length > 2) {
    const rest = key.slice(1);
    if (MASCULINE_DEMONSTRATIVES.has(rest) || FEMININE_DEMONSTRATIVES.has(rest)) {
      let i = 1;
      while (i < raw.length && /[\u064B-\u065F\u0670]/.test(raw[i])) i++; // the prefix letter plus its own diacritics
      return { key: rest, prefixLength: i };
    }
  }
  return null;
}

interface Token {
  raw: string;
  start: number;
  end: number;
}

function tokenize(text: string): Token[] {
  return [...text.matchAll(WORD)].map((m) => ({ raw: m[0], start: m.index, end: m.index + m[0].length }));
}

function nounGenderLookup(lessonNo: number): Map<string, "m" | "f"> {
  const map = new Map<string, "m" | "f">();
  const g = cumulativeGenders(lessonNo);
  const add = (words: string[], gender: "m" | "f") => {
    for (const w of words) {
      const key = bare(w);
      if (NOT_JUDGED.has(key)) continue;
      map.set(key, gender);
      // Learners often type ه for ة; accept it for feminine nouns so "مدرسه" is still recognised.
      if (key.endsWith("ة")) map.set(key.slice(0, -1) + "ه", gender);
    }
  };
  add(g.masculine, "m");
  add(g.feminine, "f");
  return map;
}

function genderOf(word: string, nouns: Map<string, "m" | "f">, lessonNo: number): "m" | "f" | null {
  const key = bare(word);
  const exact = nouns.get(key);
  if (exact) return exact;
  if (lessonNo < 5) return null; // attached pronouns aren't taught before lesson 5
  for (const suffix of POSSESSIVE_SUFFIXES) {
    if (!key.endsWith(suffix) || key.length <= suffix.length + 1) continue;
    const base = key.slice(0, -suffix.length);
    // A feminine noun's ة becomes ت before a suffix: سيارة → سيارتي.
    const candidates = base.endsWith("ت") ? [base, base.slice(0, -1) + "ة"] : [base];
    for (const c of candidates) {
      const g = nouns.get(c);
      if (g) return g;
    }
  }
  return null;
}

interface Pair {
  demonstrative: Token;
  /** Raw characters of a fused و/ف at the start of the demonstrative token; they are kept when swapping. */
  prefixLength: number;
  noun: Token;
  demonstrativeKey: string;
  demonstrativeGender: "m" | "f";
  nounGender: "m" | "f";
}

/** Every adjacent (demonstrative, known noun) pair in the text, in order. */
function findPairs(text: string, lessonNo: number): Pair[] {
  const nouns = nounGenderLookup(lessonNo);
  const tokens = tokenize(text);
  const pairs: Pair[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const dem = demonstrativeOf(tokens[i].raw);
    if (!dem) continue;
    const key = dem.key;
    const demonstrativeGender = MASCULINE_DEMONSTRATIVES.has(key) ? "m" : "f";
    const next = tokens[i + 1];
    if (!/^\s*$/.test(text.slice(tokens[i].end, next.start))) continue; // something (e.g. punctuation) sits between them
    const nounGender = genderOf(next.raw, nouns, lessonNo);
    if (nounGender) {
      pairs.push({ demonstrative: tokens[i], prefixLength: dem.prefixLength, noun: next, demonstrativeKey: key, demonstrativeGender, nounGender });
    }
  }
  return pairs;
}

/** The first demonstrative–noun gender mismatch in the learner's message, or null if there isn't one we can judge. */
export function detectAgreementError(text: string, lessonNo: number): AgreementError | null {
  const bads = findPairs(text, lessonNo).filter((p) => p.demonstrativeGender !== p.nounGender);
  const bad = bads[0];
  if (!bad) return null;

  // Limit the quote to the sentence containing the error.
  let start = bad.demonstrative.start;
  while (start > 0 && !SENTENCE_BREAK.test(text[start - 1])) start--;
  let end = bad.noun.end;
  while (end < text.length && !SENTENCE_BREAK.test(text[end])) end++;

  const sentence = text.slice(start, end);
  // Fix every mismatch inside the quoted sentence, right to left so earlier offsets stay valid.
  let corrected = sentence;
  for (const b of bads.filter((b) => b.demonstrative.start >= start && b.noun.end <= end).reverse()) {
    corrected =
      corrected.slice(0, b.demonstrative.start + b.prefixLength - start) +
      SWAP[b.demonstrativeKey] +
      corrected.slice(b.demonstrative.end - start);
  }

  return {
    original: sentence.trim(),
    corrected: corrected.trim(),
    fixedDemonstrative: norm(SWAP[bad.demonstrativeKey]),
    noun: bare(bad.noun.raw),
  };
}

/** True if the text pairs a demonstrative with a noun we know — i.e. we can vouch for whether it agrees. */
export function hasJudgeablePair(text: string, lessonNo: number): boolean {
  return findPairs(text, lessonNo).length > 0;
}

/** The demonstratives in the text, normalized, in order. */
function demonstratives(text: string): string[] {
  return tokenize(text)
    .map((t) => demonstrativeOf(t.raw)?.key)
    .filter((k): k is string => k !== undefined);
}

/** True if `corrected` changes which demonstratives appear compared with `original`. */
export function changesDemonstrative(original: string, corrected: string): boolean {
  return demonstratives(original).join(" ") !== demonstratives(corrected).join(" ");
}

/** Same words ignoring diacritics, alef/hamza spelling, and a leading ال. */
export function sameWords(a: string, b: string): boolean {
  const words = (s: string) => tokenize(s).map((t) => bare(t.raw)).join(" ");
  return words(a) === words(b);
}

/** True if the reply contains both the corrected demonstrative and the noun — i.e. it actually models the fix. */
export function replyModelsFix(reply: string, error: AgreementError): boolean {
  // "وهذا" counts as "هذا": collect each word both as written and without a fused و/ف.
  const words = new Set<string>();
  for (const t of tokenize(reply)) {
    const w = bare(t.raw);
    words.add(w);
    if ((w[0] === "و" || w[0] === "ف") && w.length > 2) words.add(w.slice(1));
  }
  return words.has(bare(error.fixedDemonstrative)) && words.has(error.noun);
}

/** Drops every sentence that contains a demonstrative–noun gender mismatch (used to sanitize the buddy's own replies). */
export function removeAgreementErrors(text: string, lessonNo: number): string {
  const sentences = text.match(/[^.!?؟\n]+[.!?؟]?\s*/g) ?? [text];
  return sentences.filter((s) => detectAgreementError(s, lessonNo) === null).join("").trim();
}
