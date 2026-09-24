import type { Lesson } from "./types.js";

/**
 * DRAFT lesson ladder — Madinah Book 1, Lessons 1-5.
 *
 * This is a best-effort reconstruction of the well-known public topic
 * progression of Dr. V. Abdur Rahim's "Duroos al-Lughah al-Arabiyyah"
 * (Book 1), written from general knowledge of the curriculum's structure —
 * NOT copied from the book's text. It has NOT been verified line-by-line
 * against the actual book and must be reviewed/corrected before this eval's
 * results are trusted for anything beyond validating the harness itself.
 */
export const lessons: Lesson[] = [
  {
    book: 1,
    lessonNo: 1,
    title: "Demonstratives and basic nouns",
    newVocab: [
      "هَذَا", "هَذِهِ", "مَا", "بَيْتٌ", "كِتَابٌ", "قَلَمٌ", "بَابٌ",
      "مَسْجِدٌ", "مِفْتَاحٌ", "كُرْسِيٌّ", "سَرِيرٌ", "قَمِيصٌ", "وَلَدٌ",
      "بِنْتٌ", "رَجُلٌ", "اِمْرَأَةٌ", "صَدِيقٌ", "يَا", "نَعَمْ", "لَا",
    ],
    newGrammar: [
      "Nominal sentence: demonstrative (هذا/هذه) as مبتدأ + indefinite noun as خبر",
      "Interrogative ما هذا؟ / ما هذه؟",
      "Vocative particle يا",
      "Indefinite nunation (تنوين) on singular nouns",
    ],
  },
  {
    book: 1,
    lessonNo: 2,
    title: "The definite article and far demonstratives",
    newVocab: [
      "الْبَيْتُ", "الْكِتَابُ", "ذَلِكَ", "ذَاكَ", "تِلْكَ", "كَبِيرٌ", "صَغِيرٌ",
      "جَمِيلٌ", "جَدِيدٌ", "قَدِيمٌ", "أَيْنَ", "سَيَّارَةٌ", "كَثِيرٌ",
      "هُنَا", "هُنَاكَ", "أَيْضًا", "لَكِنْ",
    ],
    newGrammar: [
      "Definite article ال prefixed to nouns",
      "Far demonstratives ذلك (m.) / تلك (f.)",
      "Simple نعت (adjective) agreement in definiteness with a definite noun",
    ],
  },
  {
    book: 1,
    lessonNo: 3,
    title: "Personal pronouns and idafa",
    newVocab: [
      "هُوَ", "هِيَ", "أَنْتَ", "أَنْتِ", "أَنَا", "بَابُ الْبَيْتِ",
      "مِفْتَاحُ السَّيَّارَةِ", "طَالِبٌ", "مُدَرِّسٌ", "هَلْ",
    ],
    newGrammar: [
      "Detached personal pronouns هو/هي/أنت/أنتِ/أنا as مبتدأ",
      "Possessive إضافة construct (مضاف + مضاف إليه), e.g. باب البيت",
      "Yes/no question particle هل",
    ],
  },
  {
    book: 1,
    lessonNo: 4,
    title: "Prepositions of place",
    newVocab: [
      "فِي", "عَلَى", "مِنْ", "إِلَى", "مَعَ", "تَحْتَ", "فَوْقَ", "أَمَامَ",
      "خَلْفَ", "الْمَدْرَسَةُ", "السُّوقُ", "طَاوِلَةٌ", "مَكْتَبٌ",
    ],
    newGrammar: [
      "Prepositional phrase جار ومجرور as خبر (e.g. الكتاب في البيت)",
      "أين + preposition in the answer (أين الكتاب؟ – في البيت)",
    ],
  },
  {
    book: 1,
    lessonNo: 5,
    title: "Attached possessive pronouns and numbers 1-3",
    newVocab: [
      "كِتَابِي", "كِتَابُكَ", "كِتَابُكِ", "كِتَابُهُ", "كِتَابُهَا",
      "وَاحِدٌ", "اِثْنَانِ", "ثَلَاثَةٌ", "أَقْلَامٌ", "بُيُوتٌ", "كُتُبٌ",
      "عِنْدِي", "عِنْدَكَ", "عِنْدَكِ", "عِنْدَهُ", "عِنْدَهَا",
    ],
    newGrammar: [
      "Attached possessive pronoun suffixes ـي/ـكَ/ـكِ/ـهُ/ـهَا on nouns",
      "Sound/broken plural nouns introduced as vocabulary items (not full plural paradigm yet)",
      "Cardinal numbers 1-3 with a counted noun",
      "Possession construction عند + attached pronoun (عندي/عندك/عنده/عندها) meaning 'I have/you have/he has/she has'",
      "Dual noun and adjective forms (المثنى) when counting exactly two, e.g. كِتَابَانِ, تِلْكَ جَمِيلَتَانِ",
    ],
  },
];

/** Closed-class function words assumed available from the very first lesson (particles, basic pronouns already taught, discourse glue). Never flagged as a vocab violation. */
export const alwaysAllowed = new Set([
  "و", "ف", "ثم", "أم", "أو", "إن", "أن", "لن", "لم", "قد",
  "هذا", "هذه", "ذلك", "تلك", "هو", "هي", "أنت", "أنتِ", "أنا", "نحن", "هم", "هن",
  "ما", "من", "هل", "أين", "كيف", "متى", "لماذا", "كم",
  "نعم", "لا", "يا", "في", "على", "إلى",
  "السلام", "عليكم", "وعليكم", "الله", "بسم", "الرحمن", "الرحيم", "الحمد", "رب", "العالمين",
  "صباح", "الخير", "مساء", "شكرا", "عفوا", "من", "فضلك",
]);

/** Cumulative allowed vocab for lessons 1..N (inclusive), normalized. */
export function cumulativeVocab(uptoLesson: number): Set<string> {
  const set = new Set<string>();
  for (const lesson of lessons) {
    if (lesson.lessonNo <= uptoLesson) {
      for (const w of lesson.newVocab) set.add(normalizeArabic(w));
    }
  }
  for (const w of alwaysAllowed) set.add(normalizeArabic(w));
  return set;
}

/** Cumulative allowed grammar tags for lessons 1..N (inclusive), for the grader prompt. */
export function cumulativeGrammar(uptoLesson: number): string[] {
  return lessons
    .filter((l) => l.lessonNo <= uptoLesson)
    .flatMap((l) => l.newGrammar);
}

/** Strip tashkeel, normalize alef/hamza/ta-marbuta variants, remove tatweel. */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ٰٟۖ-ۭ]/g, "") // tashkeel + small marks
    .replace(/ـ/g, "") // tatweel
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}
