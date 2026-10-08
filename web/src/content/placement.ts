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
  // Lesson 1 — demonstratives and basic nouns
  { id: "p1a", lessonNo: 1, prompt: "This is a door.", slots: [["هذا"], ["باب"]], example: "هَذَا بَابٌ", wrong: ["هذه باب", "باب", "هذا"] },
  { id: "p1b", lessonNo: 1, prompt: "This is a girl.", slots: [["هذه"], ["بنت"]], example: "هَذِهِ بِنْتٌ", wrong: ["هذا بنت", "هذه ولد", "بنت"] },
  // Lesson 2 — the definite article, far demonstratives, adjectives, أين
  { id: "p2a", lessonNo: 2, prompt: "That house is big.", slots: [["ذلك", "ذاك"], ["بيت"], ["كبير"]], example: "ذَلِكَ الْبَيْتُ كَبِيرٌ", wrong: ["تلك البيت كبير", "ذلك البيت", "هذا كبير"] },
  { id: "p2b", lessonNo: 2, prompt: "Where is the book?", slots: [["أين"], ["كتاب"]], example: "أَيْنَ الْكِتَابُ؟", wrong: ["الكتاب", "أين"] },
  // Lesson 3 — personal pronouns, idafa, هل
  { id: "p3a", lessonNo: 3, prompt: "Are you a student?", slots: [["هل"], ["أنت"], ["طالب", "طالبة"]], example: "هَلْ أَنْتَ طَالِبٌ؟", wrong: ["أنت طالب", "هل طالب"] },
  { id: "p3b", lessonNo: 3, prompt: "This is the door of the house.", slots: [["هذا"], ["باب"], ["بيت"]], example: "هَذَا بَابُ الْبَيْتِ", wrong: ["هذه باب البيت", "هذا بيت", "باب البيت"] },
  // Lesson 4 — prepositions of place
  { id: "p4a", lessonNo: 4, prompt: "The book is on the table.", slots: [["كتاب"], ["على"], ["طاولة"]], example: "الْكِتَابُ عَلَى الطَّاوِلَةِ", wrong: ["الكتاب في الطاولة", "الكتاب الطاولة", "الكتاب على"] },
  { id: "p4b", lessonNo: 4, prompt: "The boy is in the school.", slots: [["ولد"], ["في"], ["مدرسة"]], example: "الْوَلَدُ فِي الْمَدْرَسَةِ", wrong: ["الولد على المدرسة", "الولد المدرسة", "في المدرسة"] },
  // Lesson 5 — attached pronouns, numbers 1-3, عند
  { id: "p5a", lessonNo: 5, prompt: "I have three pens.", slots: [["عندي"], ["ثلاثة"], ["أقلام"]], example: "عِنْدِي ثَلَاثَةُ أَقْلَامٍ", wrong: ["عندي قلم", "ثلاثة أقلام", "عندي"] },
  { id: "p5b", lessonNo: 5, prompt: "This is my book.", slots: [["هذا"], ["كتابي"]], example: "هَذَا كِتَابِي", wrong: ["هذا كتاب", "هذه كتابي", "كتابي"] },
];
