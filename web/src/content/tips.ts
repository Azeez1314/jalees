import type { ErrorType } from "@/lib/prompt";

/**
 * Hand-written grammar tips shown on recaps and in review. Deliberately NOT model-generated: a recap that explains grammar
 * wrongly would teach the wrong thing, so the model only writes the narrative and every rule here is reviewed by a human.
 */
export const tips: Record<ErrorType, { title: string; tip: string }> = {
  gender_agreement: {
    title: "Gender agreement",
    tip: "هذا and ذلك go with masculine nouns; هذه and تلك go with feminine nouns. Adjectives and pronouns match their noun as well — a feminine noun takes a feminine adjective (usually ending in ة).",
  },
  definiteness: {
    title: "Definite and indefinite",
    tip: "When an adjective describes a noun it matches the noun's definiteness: بيتٌ كبيرٌ (a big house) but البيتُ الكبيرُ (the big house). A sentence like البيتُ كبيرٌ (the house is big) is different — there the adjective is the predicate and takes no ال.",
  },
  preposition: {
    title: "Prepositions",
    tip: "Each preposition has its own job: في (in), على (on), من (from), إلى (to), مع (with), تحت (under), فوق (above), أمام (in front of), خلف (behind). Check the one you used against where the thing really is.",
  },
  word_choice: {
    title: "Word choice",
    tip: "Use the word you were taught for this meaning. If you're unsure, say it with words you already know — a simple correct sentence beats a fancy wrong one.",
  },
  word_order: {
    title: "Word order",
    tip: "In a simple sentence the topic comes first and the comment after it: الكتابُ على الطاولةِ. A demonstrative comes before its noun: هذا كتابٌ.",
  },
  number: {
    title: "Numbers",
    tip: "Counting exactly two uses the dual form of the noun (كِتَابَانِ), not the number plus a singular noun. From three, the number comes with a plural: ثَلَاثَةُ كُتُبٍ.",
  },
  other: {
    title: "Another small slip",
    tip: "Compare your sentence with the corrected one word by word and spot what changed.",
  },
};
