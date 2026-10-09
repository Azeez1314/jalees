/**
 * Placement items: the learner is asked to produce a short Arabic sentence from an English prompt. Production, not
 * recognition (the spec's rule). Scored deterministically (lib/placement.ts), so a grade can't be hallucinated.
 *
 * - `slots`: every slot needs one of its alternative words in the answer (diacritics, alef/hamza spelling, a leading ال and a
 *   final ة/ه are ignored). Extra words are allowed — a learner who adds a harmless word isn't penalised.
 * - `example`: a model answer, used only by the content check (never shown to the learner).
 * - `wrong`: answers that must NOT pass (typical beginner errors) — also checked offline.
 *
 * Add items for a new lesson here and placement extends automatically.
 */
export interface PlacementItem {
  id: string;
  lessonNo: number;
  /** English sentence to say in Arabic. */
  prompt: string;
  slots: string[][];
  example: string;
  wrong: string[];
}

export const placementItems: PlacementItem[] = [
  // Lesson 1 — هذا + nouns, أ-questions
  { id: "p1a", lessonNo: 1, prompt: "This is a door.", slots: [["هذا"], ["باب"]], example: "هَذَا بَابٌ", wrong: ["هذه باب", "باب", "هذا"] },
  { id: "p1b", lessonNo: 1, prompt: "Is this a house?", slots: [["أهذا", "هذا"], ["بيت"]], example: "أَهَذَا بَيْتٌ؟", wrong: ["هذا", "بيت", "أهذا كتاب"] },
  // Lesson 2 — ذلك
  { id: "p2a", lessonNo: 2, prompt: "This is sugar and that is milk.", slots: [["هذا"], ["سكر"], ["ذلك", "ذاك"], ["لبن"]], example: "هَذَا سُكَّرٌ وَذَلِكَ لَبَنٌ", wrong: ["هذا سكر", "ذلك لبن", "هذا سكر وهذا لبن"] },
  // Lesson 3 — the definite article, adjectives
  { id: "p3a", lessonNo: 3, prompt: "The water is cold.", slots: [["ماء"], ["بارد"]], example: "الْمَاءُ بَارِدٌ", wrong: ["الماء", "بارد", "الماء حار"] },
  // Lesson 4 — prepositions, the first verbs
  { id: "p4a", lessonNo: 4, prompt: "The book is on the desk.", slots: [["كتاب"], ["على"], ["مكتب"]], example: "الْكِتَابُ عَلَى الْمَكْتَبِ", wrong: ["الكتاب في المكتب", "الكتاب المكتب", "الكتاب على"] },
  { id: "p4b", lessonNo: 4, prompt: "Khalid went to the school.", slots: [["ذهب"], ["خالد"], ["إلى"], ["مدرسة"]], example: "ذَهَبَ خَالِدٌ إِلَى الْمَدْرَسَةِ", wrong: ["خالد في المدرسة", "ذهب خالد", "ذهب إلى المدرسة"] },
  // Lesson 5 — idafa
  { id: "p5a", lessonNo: 5, prompt: "This is Muhammad's book.", slots: [["هذا"], ["كتاب"], ["محمد"]], example: "هَذَا كِتَابُ مُحَمَّدٍ", wrong: ["هذا كتاب", "هذا محمد", "كتاب محمد"] },
  // Lesson 6 — هذه, feminine agreement
  { id: "p6a", lessonNo: 6, prompt: "This is a new car.", slots: [["هذه"], ["سيارة"], ["جديدة"]], example: "هَذِهِ سَيَّارَةٌ جَدِيدَةٌ", wrong: ["هذا سيارة جديدة", "هذه سيارة جديد", "هذه سيارة"] },
  // Lesson 7 — تلك
  { id: "p7a", lessonNo: 7, prompt: "That is a garden.", slots: [["تلك"], ["حديقة"]], example: "تِلْكَ حَدِيقَةٌ", wrong: ["ذلك حديقة", "هذه حديقة", "حديقة"] },
  // Lesson 8 — أمام / خلف, جلس
  { id: "p8a", lessonNo: 8, prompt: "The student sat behind the teacher.", slots: [["جلس"], ["طالب"], ["خلف"], ["مدرس"]], example: "جَلَسَ الطَّالِبُ خَلْفَ الْمُدَرِّسِ", wrong: ["جلس الطالب أمام المدرس", "الطالب خلف المدرس", "جلس الطالب"] },
  // Lesson 9 — noun + adjective, أنا
  { id: "p9a", lessonNo: 9, prompt: "I am a new student.", slots: [["أنا"], ["طالب", "طالبة"], ["جديد", "جديدة"]], example: "أَنَا طَالِبٌ جَدِيدٌ", wrong: ["هو طالب جديد", "أنا طالب", "طالب جديد"] },
  // Lesson 10 — possessive suffixes, ل / عند + pronoun
  { id: "p10a", lessonNo: 10, prompt: "I have a brother.", slots: [["لي", "عندي"], ["أخ"]], example: "لِي أَخٌ", wrong: ["لك أخ", "أخ", "لي"] },
];
