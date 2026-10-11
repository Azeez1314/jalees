import { generatedMarker, normalizeArabic, objectMarker, prefixMarker, suffixMarker, verbMarker } from "@/content/lessons";
import type { VocabViolation } from "@/content/types";

// Arabic letters + tatweel + tashkeel + superscript alef + Quranic annotation marks —
// deliberately excludes Arabic punctuation (،  ؛  ؟) and digits, which live in the same
// Unicode block, so punctuation doesn't get glued onto the preceding word as one "token".
const ARABIC_WORD = /[ء-غـ-ٰٟۖ-ۭ]+/g;

/**
 * Prefixes that attach to a word without changing lesson scope. Only "ال" (the) and "و" (and) are always on; the rest are
 * switched on by the lesson that teaches them (a "@p:…" marker in the allowed set, from `newAffixes` in lessons.ts):
 * "ا" is the yes/no question أَ (lesson 1), "ل" means 'for / belonging to' and "لل" is ل + ال (lesson 6), "ب" means 'with / in / by'
 * (Book 2 lesson 1: بكم، بمائة، ليس بطالب).
 */
const ALWAYS_PREFIXES = ["ال", "و"];
const OPTIONAL_PREFIXES: Record<string, string[]> = { ا: ["ا"], ل: ["لل", "ل"], ب: ["ب"] };

/**
 * Attached-pronoun suffixes, each switched on by its "@s:…" marker (lesson 10 teaches ـي ـك ـه ـها). Without the marker a word
 * with a suffix is NOT matched to its base, so the buddy can't use a possessive before the learner has met it.
 */
const SUFFIXES = ["كما", "هما", "كم", "كن", "هن", "هم", "نا", "ها", "ي", "ك", "ه", "تان", "ان", "ون", "ات", "ا"];

/**
 * What the base looks like once a suffix is removed, beyond the plain remainder:
 *  - a feminine ة turns into ت before a pronoun or the dual, and into ا before ـات (سيارتي, نافذتان, سيارات → سيارة);
 *  - a final hamza written on a seat before a pronoun goes back to ء (أبناؤك, أبنائي → أبناء).
 */
function baseVariants(base: string, suffix: string): string[] {
  const out = [base];
  if (suffix === "تان" || suffix === "ات") out.push(base + "ه");
  if (base.endsWith("ت")) out.push(base.slice(0, -1) + "ه");
  if (base.endsWith("و") || base.endsWith("ي")) out.push(base.slice(0, -1) + "ء");
  return out;
}

function activePrefixes(allowed: Set<string>): string[] {
  const out = [...ALWAYS_PREFIXES];
  for (const [key, forms] of Object.entries(OPTIONAL_PREFIXES)) if (allowed.has(prefixMarker(key))) out.push(...forms);
  return out;
}

function candidateForms(token: string, prefixes: string[], suffixes: string[]): string[] {
  const forms = new Set<string>([token]);
  // Two passes so stacked prefixes work (و + ال, أ + ال, ل + ال is already لل).
  for (let pass = 0; pass < 2; pass++) {
    for (const base of [...forms]) {
      for (const p of prefixes) {
        if (base.startsWith(p) && base.length > p.length + 1) forms.add(base.slice(p.length));
      }
    }
  }
  const withoutPrefix = [...forms];
  for (const base of withoutPrefix) {
    for (const s of suffixes) {
      if (base.endsWith(s) && base.length > s.length + 1) for (const v of baseVariants(base.slice(0, base.length - s.length), s)) forms.add(v);
    }
  }
  return [...forms];
}

/**
 * An allowed verb form, exactly — optionally with a fused "و", or after the yes/no أَ (أَذَهَبْتُمْ؟). The أ case is accepted only
 * when what follows is clearly a past-tense ending (ـت ـتم ـنا ـوا ـن): a bare أذهب is ambiguous with "I go" (present), which is not taught.
 */
function verbMatches(norm: string, allowed: Set<string>): boolean {
  const has = (w: string) => allowed.has(verbMarker(w));
  if (has(norm)) return true;
  if (norm.startsWith("و") && norm.length > 2 && verbMatches(norm.slice(1), allowed)) return true;
  if (norm.startsWith("ا") && allowed.has(prefixMarker("ا"))) {
    const rest = norm.slice(1);
    if (rest.length > 3 && /(?:ت|تم|تن|نا|وا|ن)$/.test(rest) && has(rest)) return true;
  }
  return false;
}

/** Object pronouns that may follow a generated verb form, longest first. Each is switched on by its "@o:" marker. */
const OBJECT_SUFFIXES = ["كما", "هما", "كم", "كن", "هم", "هن", "ها", "ني", "نا", "ك", "ه"];
const PAST_ENDING = /(?:ت|تم|تن|تما|نا|وا|ن)$/;

/**
 * A form generated from a taught verb (see lib/verbs.ts), allowing what Arabic lets you attach to a verb: a fused "و" (and),
 * the future "س" (once taught), the yes/no أ, and an object pronoun (once taught). The أ is only peeled when what follows is
 * unmistakably a verb — it starts with a present prefix (ي ت ن) or ends in a past ending — because a bare أذهب is "I go".
 */
function generatedVerbMatches(norm: string, allowed: Set<string>): boolean {
  const generated = (w: string) => allowed.has(generatedMarker(w));
  const withObjects = (w: string): boolean => {
    if (generated(w)) return true;
    for (const o of OBJECT_SUFFIXES) {
      if (!allowed.has(objectMarker(o)) || !w.endsWith(o) || w.length <= o.length + 1) continue;
      const base = w.slice(0, -o.length);
      if (generated(base)) return true;
      if (base.endsWith("و") && (generated(base + "ا") || generated(base.slice(0, -1)))) return true; // كتبوه ← كتبوا, فهمتموه ← فهمتم
    }
    return false;
  };
  const withPrefixes = (w: string, depth: number): boolean => {
    if (withObjects(w)) return true;
    if (depth >= 3 || w.length < 4) return false;
    if (w.startsWith("و") && withPrefixes(w.slice(1), depth + 1)) return true;
    if (w.startsWith("س") && allowed.has(prefixMarker("س")) && /^[يتنا]/.test(w.slice(1)) && withPrefixes(w.slice(1), depth + 1)) return true;
    if (w.startsWith("ا") && allowed.has(prefixMarker("ا"))) {
      const rest = w.slice(1);
      const endsLikePast = (r: string) =>
        PAST_ENDING.test(r) ||
        OBJECT_SUFFIXES.some((o) => allowed.has(objectMarker(o)) && r.endsWith(o) && PAST_ENDING.test(r.slice(0, -o.length).replace(/و$/, "")));
      if (rest.length > 3 && (/^[يتن]/.test(rest) || endsLikePast(rest)) && withPrefixes(rest, depth + 1)) return true;
    }
    return false;
  };
  return withPrefixes(norm, 0);
}

/**
 * Checks each Arabic word token in `text` against the cumulative allowed
 * vocab set. This is a heuristic whitelist match (normalize + strip the affixes
 * the learner has been taught), not real morphological analysis — it will have
 * false positives and false negatives, and it knows nothing about verb forms
 * (every allowed verb form must be listed exactly). Treat it as a triage signal,
 * not ground truth; every flagged token should be eyeballed by a human before acting on it.
 */
export function checkVocab(text: string, allowed: Set<string>): VocabViolation[] {
  const violations: VocabViolation[] = [];
  const prefixes = activePrefixes(allowed);
  const suffixes = SUFFIXES.filter((s) => allowed.has(suffixMarker(s)));
  const tokens = text.match(ARABIC_WORD) ?? [];
  for (const raw of tokens) {
    const norm = normalizeArabic(raw);
    if (norm.length <= 1) continue; // single-letter attached particles already normalized away elsewhere
    // Verbs match exactly (optionally with a fused "و"): their forms are listed one by one, never derived by stripping.
    const isVerb = verbMatches(norm, allowed) || generatedVerbMatches(norm, allowed);
    const known = isVerb || candidateForms(norm, prefixes, suffixes).some((f) => allowed.has(f));
    if (!known) {
      violations.push({ token: raw, reason: "not in cumulative allowed vocab (after affix stripping)" });
    }
  }
  return violations;
}
