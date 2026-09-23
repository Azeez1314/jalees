import { normalizeArabic } from "./lessons.js";
import type { VocabViolation } from "./types.js";

// Arabic letters + tatweel + tashkeel + superscript alef + Quranic annotation marks —
// deliberately excludes Arabic punctuation (،  ؛  ؟) and digits, which live in the same
// Unicode block, so punctuation doesn't get glued onto the preceding word as one "token".
const ARABIC_WORD = /[ء-غـ-ٰٟۖ-ۭ]+/g;

/** Prefixes attachable to a noun/verb that don't change lesson-scope (conjunctions, definite article, some prepositions). Stripped greedily, longest first, before whitelist lookup. */
const STRIPPABLE_PREFIXES = ["وال", "فال", "بال", "كال", "لل", "ال", "و", "ف", "ب", "ك", "ل"];

/** Attached pronoun suffixes taught by Lesson 5; stripped before whitelist lookup so e.g. كِتَابُهَا matches كِتَابٌ's root. */
const STRIPPABLE_SUFFIXES = ["كما", "هما", "كم", "هن", "هم", "نا", "ي", "ك", "ه", "ها"];

function candidateForms(token: string): string[] {
  const forms = new Set<string>([token]);
  for (const p of STRIPPABLE_PREFIXES) {
    if (token.startsWith(p) && token.length > p.length + 1) {
      forms.add(token.slice(p.length));
    }
  }
  const withoutPrefix = [...forms];
  for (const base of withoutPrefix) {
    for (const s of STRIPPABLE_SUFFIXES) {
      if (base.endsWith(s) && base.length > s.length + 1) {
        forms.add(base.slice(0, base.length - s.length));
      }
    }
  }
  return [...forms];
}

/**
 * Checks each Arabic word token in `text` against the cumulative allowed
 * vocab set. This is a heuristic whitelist match (normalize + strip common
 * affixes), not real morphological analysis — it will have false positives
 * and false negatives. Treat it as a triage signal, not ground truth; every
 * flagged token should be eyeballed by a human before acting on it.
 */
export function checkVocab(text: string, allowed: Set<string>): VocabViolation[] {
  const violations: VocabViolation[] = [];
  const tokens = text.match(ARABIC_WORD) ?? [];
  for (const raw of tokens) {
    const norm = normalizeArabic(raw);
    if (norm.length <= 1) continue; // single-letter attached particles already normalized away elsewhere
    const forms = candidateForms(norm);
    const known = forms.some((f) => allowed.has(f));
    if (!known) {
      violations.push({ token: raw, reason: "not in cumulative allowed vocab (after affix stripping)" });
    }
  }
  return violations;
}
