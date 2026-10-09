import type { Lesson } from "./types";

/**
 * Madinah Book 1 ("Lessons in Arabic Language", Dr V. Abdur-Raheem), Lessons 1-10, aligned to the book's own numbering.
 *
 * Built from the book's lesson tables: which words and structures each lesson introduces, and in which lesson. Everything below
 * is word lists and short grammar descriptions in our own words — no sentences, exercises or explanations are copied from the
 * book (product spec: align to lesson numbers only). Words that the book only shows in drills or appendices (e.g. the
 * sun/moon-letter example list) are treated as NOT taught yet, which errs on the side of a smaller whitelist.
 *
 * Two things differ from what you might expect and shape the buddy's behaviour:
 *  - The book asks yes/no questions with the interrogative أَ on the first word (أَهَذَا بَيْتٌ؟); it does not use هَلْ here.
 *  - Verbs are vocabulary from lesson 4 (ذَهَبَ, خَرَجَ; جَلَسَ in 8) — exact 3rd-person masculine past forms only — and
 *    هَذِهِ / تِلْكَ (feminine) only arrive in lessons 6 and 7, so lessons 1-5 are practically all masculine.
 *
 * Lessons 11-23 are not authored yet; adding a lesson here (plus scenarios, genders and a placement item) extends the app.
 */
export const lessons: Lesson[] = [
  {
    book: 1,
    lessonNo: 1,
    title: "This is…: هَذَا and everyday nouns",
    newVocab: [
      "هَذَا", "مَا", "مَنْ", "نَعَمْ", "لَا",
      "بَابٌ", "مَسْجِدٌ", "بَيْتٌ", "مِفْتَاحٌ", "قَلَمٌ", "كِتَابٌ", "كُرْسِيٌّ", "سَرِيرٌ", "مَكْتَبٌ", "قَمِيصٌ",
      "نَجْمٌ", "مِنْدِيلٌ", "وَلَدٌ", "رَجُلٌ", "طَبِيبٌ", "طَالِبٌ", "تَاجِرٌ", "مُدَرِّسٌ",
      "كَلْبٌ", "قِطٌّ", "حِمَارٌ", "حِصَانٌ", "جَمَلٌ", "دِيكٌ",
    ],
    newGrammar: [
      "Nominal sentence: هذا (this, masculine) + an indefinite noun, e.g. هذا بيت",
      "Questions ما هذا؟ (what is this?) for things and من هذا؟ (who is this?) for people",
      "Yes/no question: put the interrogative أَ in front of the first word (أَهَذَا بَيْتٌ؟); answer نعم or لا. The question word هل is NOT used in this course",
      "Every noun in this lesson is masculine",
    ],
    newAffixes: { prefixes: ["ا"] },
  },
  {
    book: 1,
    lessonNo: 2,
    title: "That is…: ذَلِكَ",
    newVocab: ["ذَلِكَ", "إِمَامٌ", "حَجَرٌ", "سُكَّرٌ", "لَبَنٌ"],
    newGrammar: [
      "ذلك (that, masculine) for something farther away, in the same patterns as هذا: ذلك بيت، ما ذلك؟، من ذلك؟، أذلك كلب؟",
      "Contrasting near and far: هذا حصان وذلك حمار",
    ],
  },
  {
    book: 1,
    lessonNo: 3,
    title: "The definite article and describing things",
    newVocab: ["قَمَرٌ", "مَاءٌ", "وَرَقٌ", "دَفْتَرٌ", "دُكَّانٌ", "تُفَّاحٌ"],
    newAdjectives: [
      "جَدِيدٌ", "قَدِيمٌ", "وَسِخٌ", "نَظِيفٌ", "حَارٌّ", "بَارِدٌ", "صَغِيرٌ", "كَبِيرٌ", "مَفْتُوحٌ", "مَكْسُورٌ",
      "ثَقِيلٌ", "خَفِيفٌ", "جَمِيلٌ", "وَاقِفٌ", "جَالِسٌ", "قَرِيبٌ", "بَعِيدٌ", "حُلْوٌ", "مَرِيضٌ", "غَنِيٌّ",
      "فَقِيرٌ", "طَوِيلٌ", "قَصِيرٌ", "لَذِيذٌ",
    ],
    newGrammar: [
      "The definite article ال on a noun (الكتاب); it is written the same before sun letters even though the ل is not pronounced (النجم، الرجل)",
      "Nominal sentence: a definite subject + an indefinite adjective as predicate: القلم مكسور، الباب مفتوح",
      "Definite article ال and nunation (تنوين) do not go together: a noun with ال drops the tanween",
    ],
  },
  {
    book: 1,
    lessonNo: 4,
    title: "In, on, from, to: prepositions, where, and the first verbs",
    newVocab: [
      "فِي", "عَلَى", "إِلَى", "أَيْنَ", "هُوَ", "هِيَ", "أَنَا", "أَنْتَ",
      "مَدْرَسَةٌ", "فَصْلٌ", "حَمَّامٌ", "مِرْحَاضٌ", "مَطْبَخٌ", "غُرْفَةٌ", "جَامِعَةٌ", "سُوقٌ", "مُدِيرٌ",
      "سَاعَةٌ", "سَمَاءٌ", "شَمْسٌ",
      "الْيَابَانُ", "الصِّينُ", "الْهِنْدُ", "الْفِلِبِّينُ", "الْعِرَاقُ",
      "مُحَمَّدٌ", "خَالِدٌ", "حَامِدٌ", "يَاسِرٌ", "عَمَّارٌ", "سَعِيدٌ", "عَلِيٌّ", "عَبَّاسٌ",
      "آمِنَةُ", "زَيْنَبُ", "فَاطِمَةُ", "مَرْيَمُ", "عَائِشَةُ", "خَدِيجَةُ", "صَفِيَّةُ", "رُقَيَّةُ",
    ],
    newVerbs: ["ذَهَبَ", "خَرَجَ"],
    newGrammar: [
      "Prepositions في (in), على (on), من (from) and إلى (to); a noun + a prepositional phrase makes a sentence: الكتاب على المكتب",
      "أين (where?) and من أين أنت؟ (where are you from?), answered with من + a place or country: أنا من الهند",
      "هو (he) and هي (she) as the subject of a sentence, standing for a masculine or feminine noun already mentioned; أنا and أنت only in set questions like من أين أنت؟",
      "Two past-tense verbs, in the he-form only: ذهب (he went) and خرج (he left) — ذهب خالد إلى المدرسة، خرج من البيت. No other verb or form of these is allowed",
      "People's names and countries as subjects; yes/no questions with أ before a name or pronoun: أَعَلِيٌّ فِي الْبَيْتِ؟",
      "Feminine nouns (مدرسة، غرفة، جامعة) appear with هي and prepositions, but the feminine هذه/تلك is not taught yet",
    ],
  },
  {
    book: 1,
    lessonNo: 5,
    title: "Possession by juxtaposition (idafa) and calling someone",
    newVocab: [
      "بِنْتٌ", "يَا", "اِسْمٌ", "اِبْنٌ", "رَسُولٌ", "كَعْبَةٌ", "عَمٌّ", "خَالٌ", "حَقِيبَةٌ", "سَيَّارَةٌ", "شَارِعٌ",
      "مُهَنْدِسٌ", "مُغْلَقٌ", "تَحْتَ", "هُنَاكَ", "أُسْتَاذٌ", "شَيْخٌ", "دُكْتُورٌ", "وَزِيرٌ", "مَدِينَةٌ", "مُنَوَّرَةٌ",
    ],
    newGrammar: [
      "Idafa (possessive construct): the owned noun comes first with no ال and no tanween, then the owner: كتاب محمد، مفتاح السيارة، اسم الولد، بيت الله",
      "Whose is it? — كتاب من هذا؟ ('whose book is this?') answered with an idafa: هذا كتاب خالد",
      "Calling someone with يا + a name or title: يا محمد، يا أستاذ، يا شيخ",
      "ابن (son) and اسم (name) used in idafa: اسم هذا الشارع، ابن المدير",
    ],
  },
  {
    book: 1,
    lessonNo: 6,
    title: "This (feminine): هَذِهِ, feminine nouns and belonging",
    newVocab: [
      "هَذِهِ", "جِدًّا", "أَيْضًا",
      "مِكْوَاةٌ", "دَرَّاجَةٌ", "مِلْعَقَةٌ", "قِدْرٌ", "بَقَرَةٌ", "ثَلَّاجَةٌ", "قَهْوَةٌ", "نَافِذَةٌ", "دَجَاجَةٌ",
      "فَلَّاحٌ", "أَنْفٌ", "فَمٌ", "أُذُنٌ", "يَدٌ", "رِجْلٌ", "عَيْنٌ", "شَايٌ", "أُمٌّ", "أَبٌ", "أُخْتٌ",
      "طَبِيبَةٌ", "مُهَنْدِسَةٌ", "طَالِبَةٌ", "مُسْلِمٌ", "أَنَسٌ",
    ],
    newAdjectives: ["سَرِيعٌ"],
    newAffixes: { prefixes: ["ل"] },
    newGrammar: [
      "هذه (this, feminine) with a feminine noun: هذه سيارة. A noun ending in ة is usually feminine; so are many body parts that come in pairs (يد، أذن، عين)",
      "Adjectives agree with the noun they describe: add ة for a feminine noun (هذه سيارة جديدة، هذه غرفة كبيرة)",
      "The letter ل as a prefix means 'for / belonging to': لمن هذه؟ (whose is this?), هذه لخالد",
      "أيضا (also) and جدا (very)",
    ],
  },
  {
    book: 1,
    lessonNo: 7,
    title: "That (feminine): تِلْكَ",
    newVocab: ["تِلْكَ", "مُمَرِّضَةٌ", "مُؤَذِّنٌ", "نَاقَةٌ", "بَيْضَةٌ", "حَدِيقَةٌ", "بَطَّةٌ"],
    newGrammar: [
      "تلك (that, feminine) mirrors ذلك: تلك حديقة، ما تلك؟، أتلك بقرة؟",
      "Near and far with both genders: هذا قلم وذلك كتاب، هذه قدر وتلك ملعقة",
    ],
  },
  {
    book: 1,
    lessonNo: 8,
    title: "In front of, behind, countries, and sitting",
    newVocab: [
      "أَمَامَ", "خَلْفَ", "الْآنَ", "مُسْتَشْفَى", "سَبُّورَةٌ", "مِحْرَابٌ",
      "أَلْمَانِيَا", "إِنْكِلْتِرَا", "سُوِيسْرَا", "فَرَنْسَا", "أَمْرِيكَا",
      "عَبْدُ", "عَبْدُاللَّهِ", "عِيسَى", "مُوسَى", "مَحْمُودٌ",
    ],
    newVerbs: ["جَلَسَ"],
    newGrammar: [
      "ل + a noun for belonging, with ال written لل: السيارة للمدير، هذه الدراجة لفاطمة، لمن هذا الكتاب؟",
      "أمام (in front of) and خلف (behind) + a noun: السيارة أمام البيت، جلس خالد خلف المدرس",
      "من + a country to say where something or someone is from: هذه السيارة من اليابان",
      "Another past-tense verb, he-form only: جلس (he sat). Allowed verbs so far are exactly ذهب، خرج، جلس",
      "الآن (now)",
    ],
  },
  {
    book: 1,
    lessonNo: 9,
    title: "Describing with adjectives, I/you, 'who' and 'at'",
    newVocab: [
      "لِمَاذَا", "الَّذِي", "عِنْدَ",
      "لُغَةٌ", "طَائِرٌ", "عُصْفُورٌ", "اَلْيَوْمَ", "مَكْتَبَةٌ", "مِرْوَحَةٌ", "مُسْتَوْصَفٌ", "فَاكِهَةٌ", "كُوبٌ", "الْقَاهِرَةُ",
      "كَسْلَانُ", "جَوْعَانُ", "عَطْشَانُ", "غَضْبَانُ", "مَلْآنُ",
      "عَرَبِيَّةٌ", "إِنْجِلِيزِيَّةٌ", "ثَانَوِيَّةٌ", "بِلَالٌ", "فَيْصَلٌ",
    ],
    newAdjectives: ["شَهِيرٌ", "حَادٌّ", "سَهْلٌ", "صَعْبٌ", "مُجْتَهِدٌ"],
    newGrammar: [
      "A noun followed by its adjective, matching in definiteness and gender: الطالب الجديد (the new student), طالب جديد (a new student), المدرسة الكبيرة",
      "A sentence with an indefinite subject and a described predicate: عباس تاجر غني",
      "أنا and أنت as the subject of a noun sentence: أنا طالب، أنت مدرس، أأنت طالب جديد؟",
      "الذي (who / which) joining a description to a definite noun: الطالب الذي خرج الآن، الرجل الذي في المكتب",
      "عند (at / with a person): هو عند المدير",
      "لماذا (why?) and the adjectives of state جوعان (hungry), عطشان (thirsty), غضبان (angry), كسلان (lazy), which have no regular feminine in this course",
    ],
  },
  {
    book: 1,
    lessonNo: 10,
    title: "About me: my, your, his, her; having and being with",
    newVocab: [
      "لِي", "لَكَ", "لَهُ", "لَهَا", "مَعَ",
      "أَخٌ", "أَبُو", "أَخُو", "زَمِيلٌ", "زَوْجٌ", "وَاحِدٌ", "فَتًى", "طِفْلٌ",
      "الْكُوَيْتُ", "الرِّيَاضُ", "الطَّائِفُ",
      "أُسَامَةُ", "حَمْزَةُ", "طَلْحَةُ", "مُعَاوِيَةُ", "عِكْرِمَةُ",
      "الْأُرْدِيَّةُ", "الْيَابَانِيَّةُ",
    ],
    newAffixes: { suffixes: ["ي", "ك", "ه", "ها"] },
    newGrammar: [
      "Attached possessive pronouns on a noun: ـي (my), ـك (your), ـه (his), ـها (her) — اسمي، اسمك، اسمه، اسمها، بيتي، أبوك، أخوها",
      "عند + a pronoun suffix means 'have' for things: عندي كتاب، عندك سيارة، عنده قلم. Negate with ما: ما عندي سيارة",
      "ل + a pronoun suffix means 'have' for people and family: لي أخ، لك أخت، له ابن. معي، معك، معه، معها = with me/you/him/her",
      "Getting to know someone: ما اسمك؟ (what is your name?), من أين أنت؟, ما لغتك؟ (what is your language?)",
    ],
  },
];

/** Feminine هذه and adjective agreement (ة forms) are taught from this lesson. */
export const FEMININE_FROM = 6;
/** Feminine تلك is taught from this lesson. */
export const FAR_FEMININE_FROM = 7;
/** The first lesson with an allowed verb. */
export const VERBS_FROM = 4;

/**
 * Words that are not "lesson vocabulary" but must never be flagged: greetings and set expressions, and "and". Deliberately NOT
 * grammar words: هذا, أين, هو, في, ما… are taught lesson by lesson (see the tables above), so the buddy can't use them early.
 */
export const alwaysAllowed = new Set([
  "و",
  "السلام", "عليكم", "وعليكم", "ورحمة", "رحمة", "وبركاته", "الله", "بسم", "الرحمن", "الرحيم", "الحمد", "رب", "العالمين",
  "صباح", "الخير", "مساء", "شكرا", "عفوا", "فضلك",
  // Praise (below): taught as whole expressions from lesson 1.
  "حسنا",
]);

/**
 * Set praise expressions available from lesson 1. Praise is the one thing a buddy always wants to say, and without a list
 * it reaches for words the learner hasn't studied (ممتاز, مبروك, ما شاء الله...). No verbs (so no أحسنت): those stay
 * banned. Adjectives agree with what they describe like any other. "شاء" is allowed only as part of ما شاء الله.
 */
export const praisePhrases = ["مُمْتَازٌ", "جَيِّدٌ", "رَائِعٌ", "صَحِيحٌ", "حَسَنٌ", "مَبْرُوكٌ", "مَا شَاءَ اللَّهُ"];
for (const phrase of praisePhrases) {
  const words = phrase.split(" ");
  for (const word of words) alwaysAllowed.add(normalizeArabic(word));
  if (words.length === 1) alwaysAllowed.add(normalizeArabic(phrase) + "ه"); // feminine form of an adjective: جيدة
}

/** Regular feminine of a masculine adjective: add ة (written ه once normalized). */
const feminine = (adjective: string) => normalizeArabic(adjective) + "ه";

/**
 * Markers live in the same set as words; they contain "@" so they can never collide with an Arabic token.
 * "@p:ل" / "@s:ي" switch a prefix / suffix on. "@v:ذهب" is a verb form: it matches that exact spelling only (checkVocab never
 * strips affixes from it), so أَذْهَبُ "I go" or اذْهَبْ "go!" can't sneak in as أ + ذهب.
 */
export const prefixMarker = (p: string) => `@p:${p}`;
export const suffixMarker = (s: string) => `@s:${s}`;
export const verbMarker = (v: string) => `@v:${normalizeArabic(v)}`;

/** Cumulative allowed vocab for lessons 1..N (inclusive), normalized, plus affix markers (see `checkVocab`). */
export function cumulativeVocab(uptoLesson: number): Set<string> {
  const set = new Set<string>();
  for (const lesson of lessons) {
    if (lesson.lessonNo > uptoLesson) continue;
    for (const w of lesson.newVocab) set.add(normalizeArabic(w));
    for (const w of lesson.newVerbs ?? []) set.add(verbMarker(w));
    for (const w of lesson.newAdjectives ?? []) {
      set.add(normalizeArabic(w));
      if (uptoLesson >= FEMININE_FROM) set.add(feminine(w));
    }
    for (const p of lesson.newAffixes?.prefixes ?? []) set.add(prefixMarker(p));
    for (const s of lesson.newAffixes?.suffixes ?? []) set.add(suffixMarker(s));
  }
  for (const w of alwaysAllowed) set.add(normalizeArabic(w));
  return set;
}

/** The exact verb forms allowed through lesson N, as written in the tables (diacritized). */
export function cumulativeVerbs(uptoLesson: number): string[] {
  return lessons.filter((l) => l.lessonNo <= uptoLesson).flatMap((l) => l.newVerbs ?? []);
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
    .replace(/[ً-ٰٟۖ-ۭ]/g, "") // tashkeel + small marks
    .replace(/ـ/g, "") // tatweel
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}
