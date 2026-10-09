import { normalizeArabic, prefixMarker, suffixMarker, verbMarker } from "@/content/lessons";
import type { VocabViolation } from "@/content/types";

// Arabic letters + tatweel + tashkeel + superscript alef + Quranic annotation marks —
// deliberately excludes Arabic punctuation (،  ؛  ؟) and digits, which live in the same
// Unicode block, so punctuation doesn't get glued onto the preceding word as one "token".
const ARABIC_WORD = /[ء-غـ-ٰٟۖ-ۭ]+/g;

/**
 * Prefixes that attach to a word without changing lesson scope. Only "ال" (the) and "و" (and) are always on; the rest are
 * switched on by the lesson that teaches them (a "@p:…" marker in the allowed set, from `newAffixes` in lessons.ts):
 * "ا" is the yes/no question أَ (lesson 1), "ل" means 'for / belonging to' and "لل" is ل + ال (lesson 6).
 */
const ALWAYS_PREFIXES = ["ال", "و"];
const OPTIONAL_PREFIXES: Record<string, string[]> = { ا: ["ا"], ل: ["لل", "ل"] };

/**
 * Attached-pronoun suffixes, each switched on by its "@s:…" marker (lesson 10 teaches ـي ـك ـه ـها). Without the marker a word
 * with a suffix is NOT matched to its base, so the buddy can't use a possessive before the learner has met it.
 */
const SUFFIXES = ["كما", "هما", "كم", "هن", "هم", "نا", "ها", "ي", "ك", "ه", "ان"];

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
      if (base.endsWith(s) && base.length > s.length + 1) forms.add(base.slice(0, base.length - s.length));
    }
  }
  return [...forms];
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
    const isVerb = allowed.has(verbMarker(norm)) || (norm.startsWith("و") && norm.length > 2 && allowed.has(verbMarker(norm.slice(1))));
    const known = isVerb || candidateForms(norm, prefixes, suffixes).some((f) => allowed.has(f));
    if (!known) {
      violations.push({ token: raw, reason: "not in cumulative allowed vocab (after affix stripping)" });
    }
  }
  return violations;
}
