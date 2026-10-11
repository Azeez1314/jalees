/** Verb classes of the triliteral verb (Madinah Book 2 teaches them in this order: sound, then the weak classes). */
export type VerbClass = "sound" | "assimilated" | "hollow" | "defective" | "doubled";

export type Tense = "past" | "pres" | "subj" | "juss" | "imp";
export type Person = "3ms" | "3fs" | "3md" | "3fd" | "3mp" | "3fp" | "2ms" | "2fs" | "2d" | "2mp" | "2fp" | "1s" | "1p";
/** A conjugation slot such as "past:3ms" or "pres:2fp". */
export type VerbSlot = `${Tense}:${Person}`;

/**
 * A verb stored as root + class (not as a list of forms): `lib/verbs.ts` generates every conjugation from it, and lessons unlock
 * which slots (tense × person) may be used. Forms are generated without diacritics, which is how the vocabulary checker reads them.
 */
export interface VerbEntry {
  /** The three radicals, e.g. "ذهب". Hamza may be written أ/ء/ا. */
  root: string;
  /** The dictionary form, diacritized: the he-form of the past (ذَهَبَ، أَحَبَّ). Shown to the buddy and in the UI. */
  lemma: string;
  cls: VerbClass;
  /** Form I (default), Form IV (أَفْعَلَ: أحب، أراد، أرسل) or Form VIII (اِفْتَعَلَ: اشترى — sound and defective verbs only). */
  form?: 1 | 4 | 8;
  /**
   * hollow: the middle letter shown in the present (قال يقول → "و", باع يبيع → "ي", خاف يخاف → "ا"; Form IV hollow is always ي).
   * defective: the weak third radical ("و" دعا, "ي" رمى).
   */
  weak?: "و" | "ي" | "ا";
  /** defective verbs whose past takes kasra (نَسِيَ، رَضِيَ): she-form نسيت, they-form نسوا. */
  kasraPast?: boolean;
  /** assimilated verbs lose their initial waw in the present (وَصَلَ يَصِلُ → يصل, imperative صل). Default true. */
  keepsWaw?: boolean;
  /** Explicit normalized forms for irregular verbs (كل، خذ، مر، رأى …), replacing what would be generated for that slot. */
  overrides?: Partial<Record<VerbSlot, string[]>>;
  /** English gloss, for the prompt and for authors. */
  gloss: string;
}

export interface Lesson {
  book: number;
  lessonNo: number;
  title: string;
  /** New vocab introduced in this lesson, fully diacritized. Cumulative allowed set = union of this + all prior lessons in the book. */
  newVocab: string[];
  /** New grammar structures introduced in this lesson, as short human-readable tags the grader model reasons over. */
  newGrammar: string[];
  /**
   * Verb forms taught in this lesson, EXACT forms only (e.g. ذَهَبَ "he went"). No other person, tense or mood of the same verb
   * is allowed, and the vocabulary checker does no verb morphology — so every form a lesson permits must be listed here.
   */
  newVerbs?: string[];
  /**
   * Adjectives introduced in this lesson (masculine singular, indefinite). From the lesson that teaches feminine agreement,
   * their ة forms are allowed automatically (see `cumulativeVocab`). Adjectives with no regular feminine go in `newVocab`.
   */
  newAdjectives?: string[];
  /** Verbs introduced in this lesson as root + class (see `VerbEntry`). Use `newVerbs` only for Book 1's hand-listed exact forms. */
  verbs?: VerbEntry[];
  /**
   * Conjugation slots that become usable here, for ALL verbs introduced up to this lesson. Cumulative. Patterns are allowed:
   * "past:3ms", "past:*" (every person), "*:3ms" (every tense), "imp:*".
   */
  verbSlots?: string[];
  /** Word-building particles that become usable here: a prefix like "ل", an attached-pronoun suffix like "ي". */
  newAffixes?: {
    prefixes?: string[];
    /** Possessive / attached-pronoun suffixes on nouns (ـي ـك ـه ـها …). */
    suffixes?: string[];
    /** Object pronouns on VERBS (يحبّني، رأيتُه): ني ك ه ها نا كم هم هن كما هما كن. Gated separately from the possessives. */
    objects?: string[];
  };
}

export interface ScenarioSeed {
  title: string;
  /** The learner's opening line for this test conversation (simulated single turn). */
  learnerTurn: string;
}

export interface BuddyTurn {
  reply_diacritized: string;
  reply_display: string;
  recast: { original: string; corrected: string; error_type: string } | null;
  prompt_repeat: boolean;
}

export interface VocabViolation {
  token: string;
  reason: string;
}

export interface GrammarViolation {
  structure: string;
  evidence: string;
  severity: "minor" | "major";
}

export interface EvalCase {
  lesson: number;
  scenario: string;
  learnerTurn: string;
  buddyTurn: BuddyTurn | null;
  vocabViolations: VocabViolation[];
  grammarViolations: GrammarViolation[];
  error?: string;
}
