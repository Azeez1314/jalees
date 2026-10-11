import { normalizeArabic } from "@/lib/arabic";
import type { Person, Tense, VerbEntry, VerbSlot } from "@/content/types";

/**
 * Verb paradigm generator for the Madinah books (triliteral verbs, Forms I and IV, the five weak/sound classes).
 *
 * It produces NORMALIZED forms — no diacritics, alef/hamza folded, ى→ي, ة→ه (see `normalizeArabic`) — because that is what the
 * vocabulary checker compares. That removes most vowel bookkeeping but not the real morphology: stems shorten or lengthen, weak
 * letters appear and disappear, doubled letters merge and split, and the five "nun" forms drop their ن in the subjunctive and
 * jussive. Everything here is covered by `scripts/check-verbs.ts` against paradigms written out in full.
 */

export const PERSONS: Person[] = ["3ms", "3fs", "3md", "3fd", "3mp", "3fp", "2ms", "2fs", "2d", "2mp", "2fp", "1s", "1p"];
export const TENSES: Tense[] = ["past", "pres", "subj", "juss", "imp"];

const IMPERATIVE_PERSONS: Person[] = ["2ms", "2fs", "2d", "2mp", "2fp"];
/** Persons whose present ends in ـان / ـون / ـين (the "five verbs": they keep ن in the indicative and drop it otherwise). */
const NUN_SUFFIX: Partial<Record<Person, string>> = { "3md": "ان", "3fd": "ان", "2d": "ان", "3mp": "ون", "2mp": "ون", "2fs": "ين" };
const DROPPED: Partial<Record<Person, string>> = { "3md": "ا", "3fd": "ا", "2d": "ا", "3mp": "وا", "2mp": "وا", "2fs": "ي" };

const PRESENT_PREFIX: Record<Person, string> = {
  "3ms": "ي", "3fs": "ت", "3md": "ي", "3fd": "ت", "3mp": "ي", "3fp": "ي", "2ms": "ت", "2fs": "ت", "2d": "ت", "2mp": "ت", "2fp": "ت", "1s": "ا", "1p": "ن",
};

const uniq = (xs: string[]) => [...new Set(xs.map((x) => normalizeArabic(x)).filter(Boolean))];

interface Radicals {
  r1: string;
  r2: string;
  r3: string;
}
function radicals(v: VerbEntry): Radicals {
  const letters = [...normalizeArabic(v.root)];
  if (letters.length !== 3) throw new Error(`verb root must have three letters: ${v.root}`);
  return { r1: letters[0], r2: letters[1], r3: letters[2] };
}

// ---- past ----------------------------------------------------------------------------------------------------------------

/**
 * Attaches a subject suffix. When the stem ends in the letter the suffix starts with (ت or ن) the two are written as one
 * shadda'd letter — كُنَّا (not كننا), سَكَنَّ, مُتُّ, ظَنَنَّا — and without diacritics that is a single letter.
 */
function attach(stem: string, suffix: string): string {
  const first = suffix[0];
  return (first === "ت" || first === "ن") && stem.endsWith(first) ? stem + suffix.slice(1) : stem + suffix;
}

function pastForm(v: VerbEntry, person: Person): string[] {
  const { r1, r2, r3 } = radicals(v);
  const iv = v.form === 4 ? "ا" : "";
  const base = r1 + r2;

  let out: string;
  switch (v.cls) {
    case "sound":
    case "assimilated": {
      const stem = r1 + r2 + r3;
      out = pastWith(stem, stem, person);
      break;
    }
    case "hollow": {
      // قال: long stem (قال) before vowels and تا/ت of "she"; short stem (قل) before the subject consonants ت تم تن تما ن نا.
      out = pastWith(r1 + "ا" + r3, r1 + r3, person);
      break;
    }
    case "doubled": {
      // مدّ: merged (مد) before vowels and the "she" ت; unmerged (مدد) before the subject consonants.
      out = pastWith(r1 + r2, r1 + r2 + r3, person);
      break;
    }
    case "defective": {
      out = pastDefective(base, v, person);
      break;
    }
  }
  return [iv + out];
}

/** Past with a long stem (before vowels / she-ت) and a short stem (before consonant-initial subject suffixes). */
function pastWith(long: string, short: string, person: Person): string {
  switch (person) {
    case "3ms": return long;
    case "3fs": return long + "ت"; // the feminine ت is a separate letter: ماتت, سكتت
    case "3md": return long + "ا";
    case "3fd": return long + "تا";
    case "3mp": return long + "وا";
    case "3fp": return attach(short, "ن");
    case "2ms":
    case "2fs":
    case "1s": return attach(short, "ت");
    case "2d": return attach(short, "تما");
    case "2mp": return attach(short, "تم");
    case "2fp": return attach(short, "تن");
    case "1p": return attach(short, "نا");
  }
}

function pastDefective(base: string, v: VerbEntry, person: Person): string {
  const waw = v.weak === "و" && !v.kasraPast;
  switch (person) {
    case "3ms": return base + (waw ? "ا" : "ي");
    case "3fs": return base + (v.kasraPast ? "يت" : "ت");
    case "3md": return base + (waw ? "وا" : "يا");
    case "3fd": return base + (v.kasraPast ? "يتا" : "تا");
    case "3mp": return base + "وا";
    case "3fp": return base + (waw ? "ون" : "ين");
    case "2ms":
    case "2fs":
    case "1s": return base + (waw ? "وت" : "يت");
    case "2d": return base + (waw ? "وتما" : "يتما");
    case "2mp": return base + (waw ? "وتم" : "يتم");
    case "2fp": return base + (waw ? "وتن" : "يتن");
    case "1p": return base + (waw ? "ونا" : "ينا");
  }
}

// ---- present / subjunctive / jussive -------------------------------------------------------------------------------------

type Mood = "pres" | "subj" | "juss";

function presentForm(v: VerbEntry, person: Person, mood: Mood): string[] {
  const { r1, r2, r3 } = radicals(v);
  const pre = PRESENT_PREFIX[person];
  const nunSuffix = NUN_SUFFIX[person];
  const femininePlural = person === "3fp" || person === "2fp";
  const ending = femininePlural ? "ن" : nunSuffix ? (mood === "pres" ? nunSuffix : DROPPED[person]!) : "";
  // A bare jussive has no ending at all (لم يقل، لم يدع، لم يمدّ): weak letters drop and doubled letters may split.
  const bareJussive = mood === "juss" && !nunSuffix && !femininePlural;

  const forms: string[] = [];
  switch (v.cls) {
    case "sound":
      // Hamza-initial verbs merge their hamza with the I-prefix: أكل → آكل (normalized: اكل).
      forms.push(attach(pre + (person === "1s" && r1 === "ا" ? r2 + r3 : r1 + r2 + r3), ending));
      break;
    case "assimilated":
      forms.push(attach(pre + (v.keepsWaw ? r1 : "") + r2 + r3, ending));
      break;
    case "hollow": {
      const mid = v.form === 4 ? "ي" : (v.weak ?? "و");
      if (femininePlural || bareJussive) forms.push(attach(pre + r1 + r3, ending)); // يقلن، لم يقل
      else forms.push(attach(pre + r1 + mid + r3, ending));
      break;
    }
    case "doubled": {
      if (femininePlural) forms.push(attach(pre + r1 + r2 + r3, ending)); // يمددن
      else if (bareJussive) forms.push(pre + r1 + r2 + ending, pre + r1 + r2 + r3 + ending); // لم يمد / لم يمدد
      else forms.push(pre + r1 + r2 + ending);
      break;
    }
    case "defective": {
      const weak = v.weak === "و" ? "و" : "ي";
      const base = r1 + r2;
      if (bareJussive) forms.push(pre + base); // لم يدع، لم يرم
      else if (femininePlural) forms.push(pre + base + weak + ending); // يدعون / يرمين
      else if (person === "2fs") forms.push(pre + base + (mood === "pres" ? "ين" : "ي")); // تدعين / تدعي
      else if (nunSuffix && (person === "3mp" || person === "2mp")) forms.push(pre + base + (mood === "pres" ? "ون" : "وا"));
      else if (nunSuffix) forms.push(pre + base + weak + (mood === "pres" ? "ان" : "ا")); // يدعوان / يرميان
      else forms.push(pre + base + weak); // يدعو / يرمي
      break;
    }
  }
  return forms;
}

// ---- imperative ----------------------------------------------------------------------------------------------------------

function imperativeForm(v: VerbEntry, person: Person): string[] {
  if (!IMPERATIVE_PERSONS.includes(person)) return [];
  // The imperative is the 2nd-person jussive without its prefix, plus a leading alef when the stem would start with two consonants.
  const stems = presentForm(v, person, "juss").map((f) => f.slice(1)); // drop the ت
  const { r1, r2, r3 } = radicals(v);
  const withAlef = (st: string) => (st.startsWith("ا") ? st : "ا" + st);

  if (v.form === 4) return stems.map(withAlef); // أرسل، أرد، أحبب
  switch (v.cls) {
    case "hollow": return stems; // قل، قولي، قلن
    case "assimilated": return v.keepsWaw ? stems.map(withAlef) : stems; // صل، قف
    case "doubled": {
      // مُدَّ / امدُدْ (2ms), مُدّي، مُدّا، مُدّوا (merged, no alef), امدُدْنَ (2fp, unmerged).
      if (person === "2ms") return [r1 + r2, "ا" + r1 + r2 + r3];
      if (person === "2fp") return stems.map(withAlef);
      return stems;
    }
    default: return stems.map(withAlef); // اذهب، ادع، ارم
  }
}

// ---- public API -------------------------------------------------------------------------------------------------------------

/** All normalized forms of `verb` for one slot (empty for impossible slots such as an imperative for the 3rd person). */
export function generateForms(verb: VerbEntry, slot: VerbSlot): string[] {
  const override = verb.overrides?.[slot];
  if (override) return uniq(override);
  const [tense, person] = slot.split(":") as [Tense, Person];
  switch (tense) {
    case "past": return uniq(pastForm(verb, person));
    case "pres":
    case "subj":
    case "juss": return uniq(presentForm(verb, person, tense));
    case "imp": return uniq(imperativeForm(verb, person));
  }
}

/** Every slot that exists in the language (the imperative only has 2nd-person slots). */
export const ALL_SLOTS: VerbSlot[] = TENSES.flatMap((t) =>
  (t === "imp" ? IMPERATIVE_PERSONS : PERSONS).map((p) => `${t}:${p}` as VerbSlot)
);

/** Expands slot patterns like "past:*" or "*:3ms" into concrete slots. */
export function expandSlots(patterns: string[]): VerbSlot[] {
  const out = new Set<VerbSlot>();
  for (const pat of patterns) {
    const [t, p] = pat.split(":");
    for (const slot of ALL_SLOTS) {
      const [st, sp] = slot.split(":");
      if ((t === "*" || t === st) && (p === "*" || p === sp)) out.add(slot);
    }
  }
  return [...out];
}
