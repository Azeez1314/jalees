export interface Lesson {
  book: number;
  lessonNo: number;
  title: string;
  /** New vocab introduced in this lesson, fully diacritized. Cumulative allowed set = union of this + all prior lessons in the book. */
  newVocab: string[];
  /** New grammar structures introduced in this lesson, as short human-readable tags the grader model reasons over. */
  newGrammar: string[];
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
