import type { Lesson } from "./types.js";

/**
 * Madinah Book 1 ("Lessons in Arabic Language", Dr V. Abdur-Raheem), all 23 lessons, aligned to the book's own numbering.
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
 * A limitation worth knowing: verb forms are matched after dropping tashkeel, so ذَهَبَتْ (she went, lesson 12) also lets through
 * ذَهَبْتُ / ذَهَبْتَ (I / you went, lessons 14-15) from lesson 12 on. The prompt names the exact forms, but the checker can't tell them apart.
 *
 * Likewise the yes/no أَ is stripped from any word, so a word that happens to be أ + an allowed word (أَحْمَرُ "red" = أ + حُمُر
 * "donkeys", from lesson 16 on) passes before its own lesson. These are heuristic limits, listed so they aren't mistaken for guarantees.
 *
 * Adding a lesson here (plus scenarios, genders and a placement item) extends the app.
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
      "مُهَنْدِسٌ", "تَحْتَ", "هُنَاكَ", "أُسْتَاذٌ", "شَيْخٌ", "دُكْتُورٌ", "وَزِيرٌ", "مَدِينَةٌ", "مُنَوَّرَةٌ",
    ],
    newAdjectives: ["مُغْلَقٌ"],
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
  {
    book: 1,
    lessonNo: 11,
    title: "My house: in it, anyone, and loving",
    newVocab: ["مَاذَا", "أَحَدٌ", "نَبِيٌّ"],
    newVerbs: ["أُحِبُّ"],
    newGrammar: [
      "في + a pronoun suffix: فيه (in it, masculine) and فيها (in it, feminine), to say what or who is in a house, room or bag: فيها نافذة كبيرة، ما فيه أحد",
      "ماذا (what?) with في: ماذا في الحقيبة؟ (what is in the bag?)",
      "Describing your own things with the possessive suffixes: بيتي، غرفتي، سريري، ساعتي، حقيبتي",
      "One new verb, exactly as written: أحب (I love) + an object: أحب أبي وأمي، أحب اللغة العربية. Only the I-form; no other form of this verb",
    ],
  },
  {
    book: 1,
    lessonNo: 12,
    title: "Greetings, family, and she-verbs",
    newVocab: [
      "كَيْفَ", "حَالٌ", "بِخَيْرٍ", "هُنَا", "الَّتِي",
      "فَتَاةٌ", "عَمَّةٌ", "خَالَةٌ", "زَمِيلَةٌ", "مُوَجِّهٌ", "دَرْسٌ", "شَجَرَةٌ", "وِلَادَةٌ", "مَالِيزِيَا",
      "سُعَادُ", "سَعْدٌ", "لَيْلَى",
    ],
    newAdjectives: ["مُتَوَسِّطٌ"],
    newVerbs: ["ذَهَبَتْ", "خَرَجَتْ", "جَلَسَتْ"],
    newGrammar: [
      "Greeting and answering: السلام عليكم ورحمة الله وبركاته / وعليكم السلام…؛ كيف حالك؟ (how are you?); أنا بخير والحمد لله",
      "Calling a person with يا + a possessive: يا أبي، يا أمي، يا أخي، يا أختي",
      "ما + لي / عندي makes a negative: ما لي أخت، ما عندي قلم. Questions: ألك أخ؟ أعندك كتاب؟",
      "التي (who / which) for a feminine noun, like الذي for a masculine one: الفتاة التي معك",
      "A verb agrees with who does it: add ـت for she — ذهبت (she went), خرجت (she left), جلست (she sat): ذهبت أمي إلى المستشفى. Allowed verbs are exactly those listed, nothing else",
      "Family on both sides: العم والعمة (father's brother and sister), الخال والخالة (mother's brother and sister)",
    ],
  },
  {
    book: 1,
    lessonNo: 13,
    title: "Many people: plurals, they, and these",
    newVocab: [
      "هَؤُلَاءِ", "أُولَئِكَ", "هُمْ", "هُنَّ", "بَعْضٌ",
      "صَدِيقٌ", "حَاجٌّ", "ضَيْفٌ", "حَقْلٌ", "عَالِمٌ", "مَطْعَمٌ", "مَلْعَبٌ", "النَّاسُ", "قَرْيَةٌ", "امْرَأَةٌ", "مَرْأَةٌ", "مَمْلَكَةٌ",
      "سُعُودِيَّةٌ", "اِبْتِدَائِيَّةٌ", "تُرْكِيَا", "زَكَرِيَّا",
      "طُلَّابٌ", "تُجَّارٌ", "حُجَّاجٌ", "رِجَالٌ", "كِبَارٌ", "صِغَارٌ", "قِصَارٌ", "طِوَالٌ", "أَوْلَادٌ", "أَبْنَاءٌ", "أَعْمَامٌ",
      "شُيُوخٌ", "ضُيُوفٌ", "زُمَلَاءُ", "فُقَرَاءُ", "أَغْنِيَاءُ", "أَصْدِقَاءُ", "أَطِبَّاءُ", "فِتْيَةٌ", "إِخْوَةٌ", "جُدُدٌ",
      "أَسْمَاءُ", "حُقُولٌ", "نِسَاءٌ", "أُمَّهَاتٌ", "آبَاءٌ", "أَقْوِيَاءُ", "عُلَمَاءُ", "وُزَرَاءُ", "ضِعَافٌ", "أَزْوَاجٌ", "بَنَاتٌ",
      "أَخَوَاتٌ", "فَتَيَاتٌ", "زَوْجَاتٌ",
    ],
    newAdjectives: ["قَوِيٌّ", "ضَعِيفٌ"],
    newVerbs: ["ذَهَبُوا", "خَرَجُوا", "ذَهَبْنَ", "خَرَجْنَ"],
    newAffixes: { suffixes: ["هم", "هن", "ون", "ات"] },
    newGrammar: [
      "هؤلاء (these, for plural people) and أولئك (those): هؤلاء طلاب، أولئك الرجال تجار; هم (they, masculine) and هنّ (they, feminine)",
      "Plurals of people: regular masculine plural adds ـون (مدرسون، مسلمون، مهندسون، فلاحون), regular feminine plural adds ـات (طالبات، طبيبات، مسلمات); many plurals are irregular and are learnt as words (رجال، أولاد، أصدقاء)",
      "The verb after a plural subject: ذهبوا / خرجوا (they, masculine) and ذهبن / خرجن (they, feminine): الطلاب ذهبوا إلى المطعم، الطالبات ذهبن إلى المكتبة",
      "Possessive suffixes ـهم (their, masculine) and ـهنّ (their, feminine): أبناؤهم، بيتهنّ؛ بعض + pronoun: بعضهم في الفصل",
      "A plural of people takes a plural adjective, matching in definiteness: الطلاب الجدد، هؤلاء الرجال الطوال",
    ],
  },
  {
    book: 1,
    lessonNo: 14,
    title: "We and you (plural)",
    newVocab: [
      "نَحْنُ", "أَنْتُمْ", "أَيٌّ", "أَهْلًا", "سَهْلًا", "مَرْحَبًا",
      "حَفِيدٌ", "كُلِّيَّةٌ", "طِبٌّ", "شَرِيعَةٌ", "تِجَارَةٌ", "هَنْدَسَةٌ", "مَحْكَمَةٌ", "إِخْوَانٌ", "الْيُونَانُ",
      "نَصْرَانِيٌّ", "نَصَارَى", "بَلَدٌ", "بِلَادٌ", "حَفَدَةٌ", "دِينٌ", "الْإِسْلَامُ", "مَطَارٌ", "زِيَارَةٌ",
      "يَوْمٌ", "السَّبْتُ", "رَجَبٌ", "إِبْرَاهِيمُ", "يُوسُفُ",
    ],
    newVerbs: [
      "ذَهَبْتَ", "ذَهَبْتِ", "ذَهَبْتُمْ", "ذَهَبْنَا",
      "خَرَجْتَ", "خَرَجْتِ", "خَرَجْتُمْ", "خَرَجْنَا",
      "جَلَسْتَ", "جَلَسْتِ", "جَلَسْتُمْ", "جَلَسْنَا",
    ],
    newAffixes: { suffixes: ["نا", "كم"] },
    newGrammar: [
      "نحن (we) and أنتم (you, plural): نحن مسلمون، من أنتم؟؛ yes/no with أ: أأنتم في الجامعة؟",
      "Pronoun suffixes ـنا (our) and ـكم (your, plural): بيتنا، لغتكم، أبوكم، كيف حالكم؟",
      "Past verbs for you and we, exactly as listed: ذهبتَ / ذهبتِ (you, m. / f.), ذهبتم (you, plural), ذهبنا (we); the same for خرج and جلس. Listed forms only",
      "أيّ (which?) + a noun: في أيّ مدرسة أنت؟ (which school are you in?), أيّ يوم هذا؟",
      "Greeting a group: أهلاً وسهلاً ومرحباً; كيف حالكم؟",
      "The plural of Arabic family and place words is learnt word by word: إخوة / إخوان، بلد / بلاد، كلية / كليات",
    ],
  },
  {
    book: 1,
    lessonNo: 15,
    title: "You and they (feminine plural), and when",
    newVocab: [
      "أَنْتُنَّ", "مَتَى", "قَبْلَ", "بَعْدَ",
      "أُسْبُوعٌ", "شَهْرٌ", "أَذَانٌ", "صَلَاةٌ", "اخْتِبَارٌ", "أُسْتَاذَةٌ",
    ],
    newVerbs: ["رَجَعَ", "رَجَعْنَا", "ذَهَبْتُ", "ذَهَبْتُنَّ"],
    newAffixes: { suffixes: ["كن"] },
    newGrammar: [
      "أنتنّ (you, feminine plural) and ـكنّ (your): من أنتنّ؟ أين بيتكنّ؟",
      "The full set of subject pronouns: هو، هي، أنتَ، أنتِ، أنا، هم، هنّ، أنتم، أنتنّ، نحن",
      "The 'I' and 'you (feminine plural)' forms of ذهب: ذهبتُ (I went), ذهبتنّ; and the new verb رجع (he came back), رجعنا (we came back). Allowed verbs are exactly those listed",
      "متى (when?) with a past verb: متى ذهبت؟ (when did you go?)",
      "قبل (before) and بعد (after) + a noun: قبل الصلاة، بعد أسبوع، بعد الدرس",
    ],
  },
  {
    book: 1,
    lessonNo: 16,
    title: "Plural things: books, doors, cars",
    newVocab: [
      "نَهْرٌ", "جَبَلٌ", "بَحْرٌ", "فُنْدُقٌ", "طَائِرَةٌ",
      "نُجُومٌ", "دُرُوسٌ", "أَقْلَامٌ", "أَبْوَابٌ", "أَنْهَارٌ", "جِبَالٌ", "كِلَابٌ", "بِحَارٌ", "كُتُبٌ", "حُمُرٌ", "سُرُرٌ",
      "دَفَاتِرُ", "مَكَاتِبُ", "فَنَادِقُ", "بُيُوتٌ", "بِلْجِيكَا",
    ],
    newGrammar: [
      "A plural of THINGS behaves like one feminine singular noun: هذه كتب (not هؤلاء), تلك سيارات، and its adjective is feminine singular: الكتب الجديدة، الأبواب مفتوحة",
      "Plural nouns of things are mostly irregular (كتب، أبواب، بيوت، أقلام، نجوم، دروس، أنهار، جبال، كلاب، بحار، مكاتب، فنادق) and are learnt as words; the regular feminine plural ـات is used for سيارات، ساعات، طائرات، دراجات",
      "Pronouns for plural things: هي (not هم): أين الكتب؟ هي على المكتب",
      "Summary of demonstratives: هذا / هذه / هؤلاء (near) and ذلك / تلك / أولئك (far); for plural things use هذه / تلك",
    ],
  },
  {
    book: 1,
    lessonNo: 17,
    title: "Describing many things: companies, shirts, prices",
    newVocab: [
      "شَرِكَةٌ", "قُمْصَانٌ", "حَمِيرٌ", "لُغَاتٌ",
    ],
    newAdjectives: ["رَخِيصٌ", "كَثِيرٌ"],
    newGrammar: [
      "Practice of lesson 16's rule: a plural of things takes a feminine singular predicate or adjective — الأبواب مفتوحة، النجوم جميلة، هذه الدروس سهلة، في الهند لغات كثيرة",
      "Idafa with plurals: أبواب المسجد، مكاتب الطلاب، مدير الشركة (the company's manager), كتب أختي",
      "قميص / قمصان and حمار / حمير as two more irregular plurals",
    ],
  },
  {
    book: 1,
    lessonNo: 18,
    title: "How many? and two of something (the dual)",
    newVocab: [
      "كَمْ", "هُمَا", "هَذَانِ", "هَاتَانِ",
      "عِيدٌ", "أَعْيَادٌ", "عَجَلَةٌ", "حَيٌّ", "أَحْيَاءٌ", "رِيَالٌ", "رَكْعَةٌ", "مِسْطَرَةٌ", "مَسَاطِرُ", "سَنَةٌ",
      "فِطْرٌ", "أَضْحَى", "مَتْجَرٌ", "فَجْرٌ", "أَخَوَانِ",
    ],
    newAffixes: { suffixes: ["ان", "تان", "ا"] },
    newGrammar: [
      "كم (how many?) is followed by a singular noun ending in tanween-fatha: كم أخاً لك؟ كم نافذة في غرفتك؟ كم كتاباً عندك؟",
      "The dual (exactly two): add ـان to a noun (كتابان، ابنان، يدان، عينان، أذنان، رجلان) and ـتان to a noun ending in ة (نافذتان، سيارتان). The adjective is dual too: غرفتان كبيرتان",
      "Dual demonstratives: هذان (two, masculine) and هاتان (two, feminine); the pronoun هما (they two): هذان الطالبان، هاتان المسطرتان، هما لي",
      "Counting one and two: لي أخ واحد، لي أختان. Two feast days: عيد الفطر وعيد الأضحى",
      "كم + a noun for things at home and school: كم عجلة للدراجة؟ كم ركعة في صلاة الفجر؟",
    ],
  },
  {
    book: 1,
    lessonNo: 19,
    title: "Numbers three to ten, and prices",
    newVocab: [
      "ثَلَاثَةٌ", "أَرْبَعَةٌ", "خَمْسَةٌ", "سِتَّةٌ", "سَبْعَةٌ", "ثَمَانِيَةٌ", "تِسْعَةٌ", "عَشَرَةٌ",
      "كُلٌّ", "ثَمَنٌ", "نِصْفٌ", "قِرْشٌ", "قُرُوشٌ", "حَافِلَةٌ", "رَاكِبٌ", "رُكَّابٌ", "سُؤَالٌ", "أَسْئِلَةٌ", "جَيْبٌ", "جُيُوبٌ",
      "قُدَامَى", "أَيَّامٌ", "أُورُبَّا",
    ],
    newAdjectives: ["مُخْتَلِفٌ"],
    newGrammar: [
      "The numbers three to ten (with the ـة ending) go before a PLURAL noun that follows in idafa: ثلاثة طلاب، أربعة كتب، خمسة أقلام، عشرة أيام. They take the ـة ending when the counted thing is masculine",
      "One and two are not counted this way: واحد / واحدة and the dual (كتابان، أختان) agree with the noun and follow it",
      "Prices: كم ثمن هذا الكتاب؟ (how much is this book?); ثمنه سبعة ريالات ونصف (seven and a half riyals)",
      "منهم / كلهم (some of them / all of them): كلهم من بلد واحد، منهم ثلاثة طلاب",
      "قديم / قدامى (old; the old ones) and مختلف (different): هم من بلاد مختلفة",
    ],
  },
  {
    book: 1,
    lessonNo: 20,
    title: "Numbers three to ten with feminine things",
    newVocab: [
      "ثَلَاثٌ", "أَرْبَعٌ", "خَمْسٌ", "سِتٌّ", "سَبْعٌ", "ثَمَانٍ", "ثَمَانِي", "تِسْعٌ", "عَشْرٌ",
      "مَجَلَّةٌ", "حَرْفٌ", "حُرُوفٌ", "كَلِمَةٌ", "غُرَفٌ", "عَمَّاتٌ", "إِنْدُونِيسِيَا", "سَلْمَى",
    ],
    newGrammar: [
      "A feminine counted noun takes the number WITHOUT ـة: ثلاث طالبات، أربع غرف، خمس مدرسات، عشر حافلات; a masculine counted noun takes the number WITH ـة (ثلاثة أبناء). The number and the noun are opposite in form",
      "Mixing both: لي خمسة إخوة وست أخوات (five brothers and six sisters)",
      "Counting with الحروف والكلمات: في هذه الكلمة خمسة حروف",
      "More feminine plurals: غرف، مجلات، كلمات، كليات، عمات",
    ],
  },
  {
    book: 1,
    lessonNo: 21,
    title: "My school: reading and review",
    newVocab: [
      "وَاسِعٌ", "فُصُولٌ", "كَرَاسِيُّ", "لَوْنٌ", "أَلْوَانٌ", "قِبْلَةٌ", "ذَاكَ", "لَكِنْ", "وَلَكِنْ", "أَمْ",
      "آسْيَا", "إِفْرِيقِيَا", "غَانَا", "نِيجِيرِيَا", "أَحْمَدُ", "صَالِحٌ", "بَكْرٌ", "كَثِيرًا", "وَاحِدَةٌ",
    ],
    newVerbs: ["نُحِبُّهُ"],
    newGrammar: [
      "Describing a school or classroom: how many doors and windows, what is inside, what colour the chairs are; numbers 3-10 with plural things",
      "ولكن / لكن (but): هذا المكتب كبير ولكن ذلك الكرسي صغير",
      "أم (or) in a question that offers two choices after أ: أمغلقة أبوابها أم مفتوحة؟",
      "ذاك is another way to say ذلك (that, masculine)",
      "كثيراً (a lot, very much) after a verb: نحبه كثيراً. The only new verb form is نحبه (we love him)",
      "Describing a group of people from many countries: هم من بلاد مختلفة ولغاتهم مختلفة",
    ],
  },
  {
    book: 1,
    lessonNo: 22,
    title: "Colours and 'he said'",
    newVocab: [
      "أَحْمَرُ", "أَزْرَقُ", "أَخْضَرُ", "أَسْوَدُ", "أَصْفَرُ", "أَبْيَضُ",
      "فِنْجَانٌ", "فَنَاجِينُ", "مَنَادِيلُ", "مَفَاتِيحُ", "مَسَاجِدُ", "مَدَارِسُ", "دَقِيقَةٌ", "دَقَائِقُ",
      "عُثْمَانُ", "سُفْيَانُ", "مَرْوَانُ", "نُعْمَانُ",
    ],
    newAdjectives: ["قَلِيلٌ"],
    newVerbs: ["قَالَ", "قَالَتْ"],
    newGrammar: [
      "Colours (masculine forms): أحمر، أزرق، أخضر، أسود، أصفر، أبيض — قلم أحمر، منديل أبيض. The colour follows the noun like any adjective",
      "ما لون هذا؟ (what colour is this?) — لونه أخضر، لونها أزرق",
      "Two more verbs, exactly as listed: قال (he said) and قالت (she said), used to report speech: قال يوسف: عندي خمسة أقلام",
      "More irregular plurals: مناديل، مفاتيح، مساجد، مدارس، فناجين، دقائق",
      "Names such as عثمان وسفيان and place names have no tanween (a spelling point, not a speaking one)",
    ],
  },
  {
    book: 1,
    lessonNo: 23,
    title: "Names, places and belonging: review",
    newVocab: ["مَكَّةُ", "جُدَّةُ", "بَغْدَادُ", "لَنْدَنُ", "إِصْطَنْبُولُ", "يَعْقُوبُ", "إِسْحَاقُ"],
    newVerbs: ["هَاتِ"],
    newGrammar: [
      "Review of ل with names: هذا الكتاب لحمزة، وذلك لعثمان؛ من / إلى / في / ل + a person or a city",
      "Going and leaving with places: ذهب أحمد إلى مكة، خرج يعقوب من المدرسة قبل خمس دقائق",
      "هات (give me / hand me) as a set command used with a polite يا + title: هات يا أستاذ. Only this form",
      "Review: sentences that combine a number, a colour, a place, a name and a possessive: عندي خمسة أقلام حمراء في حقيبتي",
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
