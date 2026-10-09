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
  /** Word-building particles that become usable here: a prefix like "ل", an attached-pronoun suffix like "ي". */
  newAffixes?: { prefixes?: string[]; suffixes?: string[] };
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
