import type { Lesson, VerbEntry } from "./types";

/**
 * Madinah Book 2 ("Lessons in Arabic Language", Dr V. Abdur-Raheem), 31 lessons — authored in batches, so this array grows
 * (lessons 1-10 so far). Same rules as Book 1: word lists and short grammar notes in our own words, never the book's sentences
 * or exercises; words the book only shows in drills count as not taught yet.
 *
 * Verbs are stored as root + class (`verbs`) and conjugation slots are unlocked per lesson (`verbSlots`); lib/verbs.ts generates
 * the forms. Forms the generator can't derive (jaa'a, ra'aa, the imperatives of akala/akhadha, hamza spellings) are `overrides`.
 *
 * Deliberately left out: the Qur'an, surah names and verses that the book quotes in lessons 5, 6 and 9 (product rule: the buddy
 * never refers to scripture) — the surrounding everyday vocabulary is kept.
 */

const slots = (...s: string[]) => s;
const PAST_SOME = slots("past:3ms", "past:3fs", "past:3mp", "past:3fp", "past:1s", "past:2ms");

/**
 * jaa'a (came): the hamza moves between seats (جاء، جاؤوا، يجيئون، جئتُ), so every slot is written out. The checker compares
 * normalized forms (ئ→ي, ؤ→و), so each spelling a learner might type is listed.
 */
const JAA: VerbEntry = {
  root: "جيء", lemma: "جَاءَ", gloss: "come", cls: "hollow", weak: "ي",
  overrides: {
    "past:3ms": ["جاء"], "past:3fs": ["جاءت"], "past:3md": ["جاءا"], "past:3fd": ["جاءتا"], "past:3mp": ["جاءوا", "جاؤوا"], "past:3fp": ["جئن"],
    "past:2ms": ["جئت"], "past:2fs": ["جئت"], "past:2d": ["جئتما"], "past:2mp": ["جئتم"], "past:2fp": ["جئتن"], "past:1s": ["جئت"], "past:1p": ["جئنا"],
    "pres:3ms": ["يجيء", "يجئ"], "pres:3fs": ["تجيء"], "pres:3md": ["يجيئان"], "pres:3fd": ["تجيئان"], "pres:3mp": ["يجيئون", "يجيؤون"], "pres:3fp": ["يجئن"],
    "pres:2ms": ["تجيء"], "pres:2fs": ["تجيئين"], "pres:2d": ["تجيئان"], "pres:2mp": ["تجيئون"], "pres:2fp": ["تجئن"], "pres:1s": ["أجيء"], "pres:1p": ["نجيء"],
    "subj:3ms": ["يجيء"], "subj:3fs": ["تجيء"], "subj:3md": ["يجيئا"], "subj:3fd": ["تجيئا"], "subj:3mp": ["يجيئوا"], "subj:3fp": ["يجئن"],
    "subj:2ms": ["تجيء"], "subj:2fs": ["تجيئي"], "subj:2d": ["تجيئا"], "subj:2mp": ["تجيئوا"], "subj:2fp": ["تجئن"], "subj:1s": ["أجيء"], "subj:1p": ["نجيء"],
    "juss:3ms": ["يجئ"], "juss:3fs": ["تجئ"], "juss:3md": ["يجيئا"], "juss:3fd": ["تجيئا"], "juss:3mp": ["يجيئوا"], "juss:3fp": ["يجئن"],
    "juss:2ms": ["تجئ"], "juss:2fs": ["تجيئي"], "juss:2d": ["تجيئا"], "juss:2mp": ["تجيئوا"], "juss:2fp": ["تجئن"], "juss:1s": ["أجئ"], "juss:1p": ["نجئ"],
    "imp:2ms": ["جئ"], "imp:2fs": ["جيئي"], "imp:2d": ["جيئا"], "imp:2mp": ["جيئوا"], "imp:2fp": ["جئن"],
  },
};

/** ra'aa (saw): the past is regular, the present drops the hamza (يرى), and before a pronoun ending the stem is ر. */
const RAA: VerbEntry = {
  root: "رأي", lemma: "رَأَى", gloss: "see", cls: "defective", weak: "ي",
  overrides: {
    "pres:3ms": ["يرى"], "pres:3fs": ["ترى"], "pres:3md": ["يريان"], "pres:3fd": ["تريان"], "pres:3mp": ["يرون"], "pres:3fp": ["يرين"],
    "pres:2ms": ["ترى"], "pres:2fs": ["ترين"], "pres:2d": ["تريان"], "pres:2mp": ["ترون"], "pres:2fp": ["ترين"], "pres:1s": ["أرى"], "pres:1p": ["نرى"],
    "subj:3ms": ["يرى"], "subj:3fs": ["ترى"], "subj:3md": ["يريا"], "subj:3fd": ["تريا"], "subj:3mp": ["يروا"], "subj:3fp": ["يرين"],
    "subj:2ms": ["ترى"], "subj:2fs": ["تري"], "subj:2d": ["تريا"], "subj:2mp": ["تروا"], "subj:2fp": ["ترين"], "subj:1s": ["أرى"], "subj:1p": ["نرى"],
    "juss:3ms": ["ير"], "juss:3fs": ["تر"], "juss:3md": ["يريا"], "juss:3fd": ["تريا"], "juss:3mp": ["يروا"], "juss:3fp": ["يرين"],
    "juss:2ms": ["تر"], "juss:2fs": ["تري"], "juss:2d": ["تريا"], "juss:2mp": ["تروا"], "juss:2fp": ["ترين"], "juss:1s": ["أر"], "juss:1p": ["نر"],
    "imp:2ms": ["ر"], "imp:2fs": ["ري"], "imp:2d": ["ريا"], "imp:2mp": ["روا"], "imp:2fp": ["رين"],
    "past:3mp": ["رأوا"],
  },
};

/**
 * Forms of a verb whose last radical is a hamza (قرأ، بدأ) that the generator would spell wrongly: the hamza sits on a waw before
 * ـون / ـوا (يقرؤون), on a yaa' before ـين / ـي (تقرئين), and on an alef before the dual ـان (يقرآن). `r` = the first two radicals.
 */
function HAMZA_FINAL(r: string): NonNullable<VerbEntry["overrides"]> {
  return {
    "pres:3mp": [`ي${r}ؤون`, `ي${r}أون`], "pres:2mp": [`ت${r}ؤون`, `ت${r}أون`], "pres:2fs": [`ت${r}ئين`],
    "subj:3mp": [`ي${r}ؤوا`, `ي${r}أوا`], "subj:2mp": [`ت${r}ؤوا`, `ت${r}أوا`], "subj:2fs": [`ت${r}ئي`],
    "juss:3mp": [`ي${r}ؤوا`, `ي${r}أوا`], "juss:2mp": [`ت${r}ؤوا`, `ت${r}أوا`], "juss:2fs": [`ت${r}ئي`],
    "imp:2fs": [`ا${r}ئي`], "imp:2mp": [`ا${r}ؤوا`, `ا${r}أوا`], "imp:2d": [`ا${r}آ`],
    "past:3mp": [`${r}ؤوا`, `${r}أوا`],
    "pres:3md": [`ي${r}آن`], "pres:3fd": [`ت${r}آن`], "pres:2d": [`ت${r}آن`],
    "subj:3md": [`ي${r}آ`], "subj:3fd": [`ت${r}آ`], "subj:2d": [`ت${r}آ`],
    "juss:3md": [`ي${r}آ`], "juss:3fd": [`ت${r}آ`], "juss:2d": [`ت${r}آ`],
  };
}

const sound = (root: string, lemma: string, gloss: string, extra: Partial<VerbEntry> = {}): VerbEntry => ({ root, lemma, gloss, cls: "sound", ...extra });

/** قرأ: the hamza is written on a waw in the plural (قَرَؤُوا), which the generator can't know. */
const QARA: VerbEntry = sound("قرأ", "قَرَأَ", "read", { overrides: HAMZA_FINAL("قر") });
const AKHADHA: VerbEntry = sound("أخذ", "أَخَذَ", "take", { overrides: { "imp:2ms": ["خذ"], "imp:2fs": ["خذي"], "imp:2d": ["خذا"], "imp:2mp": ["خذوا"], "imp:2fp": ["خذن"] } });
const AKALA: VerbEntry = sound("أكل", "أَكَلَ", "eat", { overrides: { "imp:2ms": ["كل"], "imp:2fs": ["كلي"], "imp:2d": ["كلا"], "imp:2mp": ["كلوا"], "imp:2fp": ["كلن"] } });

export const book2Lessons: Lesson[] = [
  {
    book: 2,
    lessonNo: 1,
    title: "Indeed…, possessors, and hundreds and thousands",
    newVocab: [
      "إِنَّ", "إِنَّنِي", "لَعَلَّ", "ذُو", "ذَوُو", "ذَاتُ", "ذَوَاتُ", "أَمْ", "مِائَةٌ", "أَلْفٌ", "كُمٌّ", "أَكْمَامٌ", "غَالِيَةٌ",
      "غَبِيٌّ", "أَغْبِيَاءُ", "أَذْكِيَاءُ", "خُلُقٌ", "أَخْلَاقٌ", "رُوبِيَّةٌ", "عَزَبٌ", "أَعْزَابٌ", "يَهُودِيٌّ", "يَهُودٌ", "مُعْجَمٌ", "مَعَاجِمُ",
      "دُولَارٌ", "صَفْحَةٌ", "نَاجِحُونَ", "هَاشِمٌ", "بَاكِسْتَانُ", "إِيرَانُ",
    ],
    newAdjectives: ["ذَكِيٌّ", "مُتَزَوِّجٌ", "نَاجِحٌ"],
    newAffixes: { prefixes: ["ب"] },
    newGrammar: [
      "إنّ (indeed) joined to a pronoun suffix to state something firmly: إنه تاجر، إنها جميلة، إنهم طلاب، إنك ذكي، إنني من الهند",
      "لعلّ (perhaps, I hope): لعلك بخير",
      "ذو / ذات (possessor of) + a noun: ذو خلق، ذات خلق؛ plural ذوو / ذوات",
      "A choice between two with أ … أم …: أمن الهند أنت أم من باكستان؟",
      "مائة and ألف followed by a singular noun: مائة رجل، ألف ريال; asking a price with بكم: بكم هي؟ هي بمائة روبية",
    ],
  },
  {
    book: 2,
    lessonNo: 2,
    title: "Not: ليس",
    newVocab: [
      "لَيْسَ", "لَسْتُ", "لَسْتَ", "لَسْتِ", "لَيْسَتْ", "لَسْتُمْ", "لَسْتُنَّ", "لَيْسُوا", "لَسْنَ", "لَسْنَا",
      "لِقَاءٌ", "بَرْقِيَّةٌ", "مَصْرِفٌ", "بَرِيدٌ", "الْوِلَايَاتُ", "الْمُتَّحِدَةُ", "وَاشِنْطُنُ", "نِيُويُورْكُ", "هِشَامٌ",
    ],
    newAdjectives: ["مَسْرُورٌ", "جَيِّدٌ", "نَائِمٌ"],
    newGrammar: [
      "ليس negates a noun sentence and agrees with its subject: لستُ (I am not), لستَ / لستِ (you are not), ليس / ليست (he / she is not), لستم، لستنّ، ليسوا، لسن، لسنا",
      "The predicate of ليس usually takes the prefix بـ: ليس بطالب، ليست بمسلمة، لسنا بطلاب",
      "Answering a أ-question negatively with ليس: أمسلم أبوك؟ لا، ليس بمسلم",
      "The place and the meeting: أنا مسرور بلقائك; I am from the United States / New York",
    ],
  },
  {
    book: 2,
    lessonNo: 3,
    title: "More than…: comparing, numbers 11-20, and ordinals",
    newVocab: [
      "أَكْثَرُ", "أَطْوَلُ", "أَكْبَرُ", "أَصْغَرُ", "أَجْمَلُ", "أَحْسَنُ", "أَسْهَلُ", "أَنْظَفُ", "أَرْخَصُ", "أَبْعَدُ", "أَوْسَعُ",
      "كَأَنَّ", "كَذَلِكَ", "بَلَى", "أَيُّهُمَا", "كَوْكَبٌ", "مَهْجَعٌ", "فَرِيقٌ", "شَقِيقٌ", "لَاعِبٌ", "الْأَزْهَرُ", "الْمَنَامُ", "خَطٌّ",
      "فَرَنْسِيَّةٌ", "اِثْنَا", "عَشَرَ", "عِشْرُونَ",
      "الْأَوَّلُ", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ", "الْخَامِسُ", "السَّادِسُ", "السَّابِعُ", "الثَّامِنُ", "التَّاسِعُ", "الْعَاشِرُ", "الْأُولَى",
    ],
    newAdjectives: ["وَاسِعٌ"],
    newVerbs: ["جَاءَ"],
    newGrammar: [
      "The comparative/superlative pattern أفعل: أطول (taller / tallest), أكبر، أصغر، أجمل، أحسن، أسهل، أنظف، أرخص، أبعد، أوسع، أكثر — followed by من (than): حامد أطول منه",
      "Superlative with a singular indefinite noun: أطول طالب في فصلنا (the tallest student in our class)",
      "كأنّ (as if) with a pronoun suffix: كأنه أخوك. لكنّ (but) with a noun: لكنّ حامدا أطول منه",
      "Numbers 11-19 with a singular counted noun: أحد عشر طالبا، اثنا عشر، ثلاثة عشر … تسعة عشر؛ twenty: عشرون",
      "Ordinals: الأول، الثاني … العاشر (feminine الأولى): الدرس الأول",
      "أليس كذلك؟ (isn't that so?) — answered with بلى; أيّهما (which of the two?)",
      "جاء (he came), as a whole word: الطالب الذي جاء أمس",
    ],
  },
  {
    book: 2,
    lessonNo: 4,
    title: "The past tense: he, she, they, I, you",
    newVocab: ["أَمَا", "بَأْسٌ", "حِصَّةٌ", "لِمَاذَا"],
    verbs: [
      sound("ذهب", "ذَهَبَ", "go"),
      sound("رجع", "رَجَعَ", "return"),
      sound("خرج", "خَرَجَ", "go out"),
      sound("جلس", "جَلَسَ", "sit"),
      { root: "قول", lemma: "قَالَ", gloss: "say", cls: "hollow", weak: "و" },
      JAA,
    ],
    verbSlots: PAST_SOME,
    newGrammar: [
      "The past tense, in the forms he / she / they (m.) / they (f.) / I / you (m.): ذهب، ذهبت، ذهبوا، ذهبن، ذهبتُ، ذهبتَ — for ذهب، رجع، خرج، جلس، قال، جاء",
      "A yes/no question about the past with أ, and the negative question with أما: أذهبتَ؟ أما ذهبتَ؟ — answer نعم to the first and بلى to the second when the answer is yes",
      "لأنّ + a pronoun suffix means 'because': رجعتُ لأنني مريض، رجع لأنه مريض",
      "Negating the past with ما: ما ذهبتُ، ما رجع",
    ],
  },
  {
    book: 2,
    lessonNo: 5,
    title: "Who did what: doer and the thing done to",
    newVocab: [
      "الْعِنَبُ", "الْمَوْزُ", "التِّينُ", "جَوَابٌ", "أَجْوِبَةٌ", "الْبَقَّالُ", "الْعَصَا", "حَيَّةٌ", "نَوَافِذُ", "خُبْزٌ",
    ],
    verbs: [
      sound("فتح", "فَتَحَ", "open"),
      sound("كسر", "كَسَرَ", "break"),
      sound("فهم", "فَهِمَ", "understand"),
      sound("كتب", "كَتَبَ", "write"),
      QARA,
      sound("غسل", "غَسَلَ", "wash"),
      AKALA,
      sound("شرب", "شَرِبَ", "drink"),
      sound("حفظ", "حَفِظَ", "memorise"),
      sound("ضرب", "ضَرَبَ", "hit"),
      sound("قتل", "قَتَلَ", "kill"),
      sound("دخل", "دَخَلَ", "enter"),
      sound("سمع", "سَمِعَ", "hear"),
    ],
    newAffixes: { objects: ["ه", "ها"] },
    newGrammar: [
      "The doer (فاعل) and the thing done to (مفعول به): فتح حامدٌ البابَ — verb, then the doer, then what it was done to",
      "The verb comes first and stays singular even when the doer is plural or feminine-plural: ذهب الطلاب، كتبت الطالبات",
      "The thing done to can be a pronoun suffix on the verb: فتحتُه (I opened it), فتحتُها، كتبتُها، فهمتُه",
      "Negation and questions with the past: ما كسرتُه، أفهمتَ الدرس؟، لماذا؟ — لأنني ما فهمتُ",
    ],
  },
  {
    book: 2,
    lessonNo: 6,
    title: "You (feminine), seeing, and numbers 11-20 with feminine nouns",
    newVocab: [
      "شُقَّةٌ", "عِمَارَةٌ", "عَمَائِرُ", "سِنٌّ", "أَسْنَانٌ", "خَادِمَةٌ", "قِطْعَةٌ", "ظُهْرٌ", "فِقْهٌ",
      "جَوْعَى", "جِيَاعٌ", "كَسْلَى", "كُسَالَى", "عَطْشَى", "إِحْدَى", "اِثْنَتَا", "لِمَ", "لِمَهْ",
    ],
    verbs: [
      RAA,
      { root: "كوي", lemma: "كَوَى", gloss: "iron", cls: "defective", weak: "ي" },
      AKHADHA,
      sound("فرح", "فَرِحَ", "be glad"),
      { ...JAA },
    ],
    verbSlots: slots("past:2fs"),
    newVerbs: ["خُذْ", "هَاتِي", "هَاتُوا", "هَاتِينَ", "أَظُنُّ", "أَدْرِي"],
    newAffixes: { objects: ["هم", "هن"] },
    newGrammar: [
      "The past with 'you (f.)': ذهبتِ، رجعتِ، خرجتِ — the same letters as 'you (m.)', so the ending is only written with its vowel",
      "رأى (he saw): رأيتُه، رأيتُها، رأيتُهم، رأيتُهنّ — an object pronoun for him, her, them (m.), them (f.)",
      "أظنّ أنّ… (I think that…) with أنّ + a pronoun: أظنّ أنها ذهبت، أظنّ أنهم رجعوا؛ لا أدري (I don't know)",
      "Numbers 11-19 with a FEMININE counted noun: إحدى عشرة طالبة، اثنتا عشرة، ثلاث عشرة … تسع عشرة; the counted noun is singular",
      "Feminine and plural of hungry, thirsty and lazy: جوعان / جوعى / جياع، عطشان / عطشى، كسلان / كسلى / كسالى",
      "لِمَ = لماذا (why?); commands: خذ (take!), هات / هاتي / هاتوا / هاتين (give me!)",
    ],
  },
  {
    book: 2,
    lessonNo: 7,
    title: "You (plural) and we in the past, and كان",
    newVocab: [
      "كُرَةٌ", "قَدَمٌ", "سَلَّةٌ", "صَحِيفَةٌ", "صُحُفٌ", "أَخْبَارٌ", "إِذَاعَةٌ", "آمِينَ", "غِلَافٌ", "مَكْنَسَةٌ", "مَكَانِسُ", "سُلَّمٌ",
      "سَلَالِمُ", "مَنَارَةٌ", "مَنَائِرُ", "نَظَّارَةٌ", "نَظَّارَاتٌ", "عَجَلٌ", "لِحْيَةٌ", "صُورَةٌ", "صُوَرٌ", "مُلَوَّنٌ", "صَابُونٌ",
      "الْبَارِحَةَ", "بُرْتُقَالٌ", "عَصِيرٌ", "ثُلُثٌ", "رُبْعٌ", "خُمْسٌ", "سُدْسٌ", "سُبْعٌ", "ثُمْنٌ", "تُسْعٌ", "عُشْرٌ", "بَيْنَ", "عِطَاشٌ",
      "الْمَاضِي", "الْعَصْرُ", "مَرْوَانُ",
    ],
    newAdjectives: ["عَالٍ"],
    verbs: [
      sound("لعب", "لَعِبَ", "play"),
      sound("وجد", "وَجَدَ", "find", { cls: "assimilated" }),
      sound("وضع", "وَضَعَ", "put", { cls: "assimilated" }),
      sound("بحث", "بَحَثَ", "search"),
      { root: "مشي", lemma: "مَشَى", gloss: "walk", cls: "defective", weak: "ي" },
      { root: "كون", lemma: "كَانَ", gloss: "be", cls: "hollow", weak: "و" },
    ],
    verbSlots: slots("past:2mp", "past:2fp", "past:1p"),
    newVerbs: ["أَبْشِرْ", "يَرِنُّ", "يَقُومُ", "يَفْتَحُ", "تَدْخُلُ"],
    newGrammar: [
      "The past with 'you (m. pl.)', 'you (f. pl.)' and 'we': ذهبتم، ذهبتنّ، ذهبنا — أين ذهبتم؟ ذهبنا إلى الملعب",
      "An object pronoun after ـتم: رأيتموه، فهمتموه، أسمعتموها؟ (the و is added before the pronoun)",
      "كان (he was) with a place as its predicate: كان المدرس في الفصل قبل خمس دقائق، كانت أمي في المطبخ",
      "ذو + a definite noun: الكتاب ذو الغلاف الأحمر (the book with the red cover)",
      "Fractions: نصف، ثلث، ربع، خمس، سدس، سبع، ثمن، تسع، عشر",
      "Sports and news: كرة القدم، كرة السلة، الصحف، الإذاعة، الأخبار",
    ],
  },
  {
    book: 2,
    lessonNo: 8,
    title: "The past tense with every pronoun (review)",
    newVocab: [],
    newGrammar: [
      "The full table of the past tense (no dual yet): he ذهب، she ذهبت، they (m.) ذهبوا، they (f.) ذهبن، you (m.) ذهبتَ، you (f.) ذهبتِ، you (m. pl.) ذهبتم، you (f. pl.) ذهبتنّ، I ذهبتُ، we ذهبنا",
      "The doer is either a visible pronoun in the verb (the ت، و، ن، نا endings) or a hidden pronoun (he / she, which have no ending of their own)",
      "Putting it together with any taught verb: خرجتْ آمنةُ، خرجوا، خرجنَ، خرجتُ",
    ],
  },
  {
    book: 2,
    lessonNo: 9,
    title: "More past verbs with object pronouns, 'how …!', and who / which",
    newVocab: [
      "قَائِمَةٌ", "قَوَائِمُ", "عَلَاقَةٌ", "عَلَاقَاتٌ", "لَحْظَةٌ", "جَرَسٌ", "أَجْرَاسٌ", "عِدَّةٌ", "طِينٌ", "مَعْنًى", "نَارٌ", "جَدٌّ",
      "إِنْسَانٌ", "أَرْضٌ", "سَمَوَاتٌ", "الْخُرْطُومُ", "السُّودَانُ", "الْيَمَنُ", "مِصْرُ", "دِمَشْقُ", "شَيْءٌ", "فَقَطْ", "ثُمَّ", "هَكَذَا",
      "مِمَّ", "بِمَ", "عَمَّ", "الَّذِينَ", "اللَّاتِي",
    ],
    verbs: [
      sound("خلق", "خَلَقَ", "create"),
      sound("رفع", "رَفَعَ", "raise"),
      { root: "رنن", lemma: "رَنَّ", gloss: "ring", cls: "doubled" },
      sound("حضر", "حَضَرَ", "attend"),
      sound("سأل", "سَأَلَ", "ask"),
      { root: "قوم", lemma: "قَامَ", gloss: "stand up", cls: "hollow", weak: "و" },
      { root: "عود", lemma: "عَادَ", gloss: "come back", cls: "hollow", weak: "و" },
      sound("حسن", "أَحْسَنَ", "do well", { form: 4 }),
    ],
    newAffixes: { objects: ["ني", "نا", "ك", "كم"] },
    newGrammar: [
      "Object pronouns on the past, all persons: خلقني، خلقنا، خلقك، خلقكم، خلقه، خلقها؛ قرأناه، كتبناه، فهمناه، أفهمتموه؟",
      "Wonder with ما أفعله!: ما أطول هذا الرجل! ما أجمل هذه السيارة! ما أسهل هذا الدرس!",
      "Calling someone with يا + a possessive noun: يا أخت حامد، يا عبد الله، يا أبا بكر",
      "The question أ before ال: آلبحار جمع البحر؟ — and ما + a preposition: مِمَّ؟ بِمَ؟ لِمَ؟ عَمَّ؟",
      "Who / which: الذي (m.), الذين (m. pl.), التي (f.), اللاتي (f. pl.): الفتيات اللاتي دخلن الفصل",
      "Past verbs for everyday action: حضر، سأل، قام، عاد، رفع، رنّ الجرس، أحسنتَ (well done)",
    ],
  },
  {
    book: 2,
    lessonNo: 10,
    title: "The present tense (he, she, you, I), and numbers 21-30",
    newVocab: [
      "دَائِمًا", "أَحْيَانًا", "مَرَّةً", "أُخْرَى", "عَامِلٌ", "عُمَّالٌ", "مَصْنَعٌ", "مُبَكِّرًا", "مُتَأَخِّرًا", "إِلَّا", "طُولٌ", "عَرْضٌ",
      "مَسَافَةٌ", "كِيلُومِتْرٌ", "سَنْتِيمِتْرٌ", "مِتْرٌ", "أَمْتَارٌ", "عَمَلٌ", "مُهَنْدِسَانِ", "ثَلَاثُونَ", "اِثْنَانِ", "غَدًا", "أَمْسِ", "عَنْ",
    ],
    verbs: [
      sound("عمل", "عَمِلَ", "work"),
      sound("فعل", "فَعَلَ", "do"),
      sound("ركب", "رَكِبَ", "ride"),
      sound("ركع", "رَكَعَ", "bow in prayer"),
      sound("سجد", "سَجَدَ", "prostrate"),
      sound("نزل", "نَزَلَ", "get down"),
    ],
    verbSlots: slots("pres:3ms", "pres:3fs", "pres:2ms", "pres:1s"),
    newGrammar: [
      "The present tense: he يذهب، she تذهب، you (m.) تذهب، I أذهب — the prefix tells who: ي (he), ت (she / you), أ (I)",
      "Four vowel patterns of three-letter verbs are met in the present: يكتب، يجلس، يذهب، يسمع — the vowel is learnt with the verb",
      "Negation: ما + past (ما كتب) and لا + present (لا يكتب)",
      "Habit and time: دائما، أحيانا، مرة أخرى؛ the hour with ربع and نصف: الساعة التاسعة إلا ربعا، والنصف",
      "Numbers 21-30 with a masculine counted noun: واحد وعشرون طالبا … ثلاثون طالبا",
      "Condition with the accusative: مبكّرا (early) and متأخّرا (late): يرجع متأخرا",
      "Measurement: طول، عرض، مسافة، متر، كيلومتر، سنتيمتر",
    ],
  },
  {
    book: 2,
    lessonNo: 11,
    title: "The present tense for they and you (plural); the future; at university",
    newVocab: [
      "قَرِيبٌ", "أَقْرِبَاءُ", "عُنْوَانٌ", "عَنَاوِينُ", "بِطَاقَةٌ", "بِطَاقَاتٌ", "رِسَالَةٌ", "رَسَائِلُ", "ثَوْبٌ", "ثِيَابٌ", "مَحَطَّةٌ", "مَحَطَّاتٌ",
      "حَلَّاقٌ", "حَلَّاقُونَ", "صَيْدَلِيَّةٌ", "أَرُزٌّ", "خَيْلٌ", "خُيُولٌ", "مَهَاجِعُ", "الْآدَابُ", "الْعُلُومُ", "طَبْعًا", "سَائِقٌ",
      "سَوْفَ", "أَمَّا", "أَمَانٌ", "دُخُولٌ", "خُرُوجٌ", "نُزُولٌ", "جُلُوسٌ", "صُعُودٌ", "رُكُوبٌ", "رُجُوعٌ", "ذَهَابٌ",
    ],
    newAdjectives: ["قَادِمٌ"],
    verbs: [
      sound("درس", "دَرَسَ", "study"),
      sound("سكن", "سَكَنَ", "live"),
      sound("صعد", "صَعِدَ", "go up"),
      sound("عرف", "عَرَفَ", "know"),
      { root: "موت", lemma: "مَاتَ", gloss: "die", cls: "hollow", weak: "و" },
      sound("شكر", "شَكَرَ", "thank"),
      { root: "نسي", lemma: "نَسِيَ", gloss: "forget", cls: "defective", weak: "ي", kasraPast: true },
    ],
    verbSlots: slots("pres:3mp", "pres:3fp", "pres:2mp"),
    newAffixes: { prefixes: ["س", "ف"] },
    newGrammar: [
      "The present tense for they and you (plural): يدرسون (they, m.)، يدرسن (they, f.)، تدرسون (you, m. pl.): أين تسكنون؟ إخوتي يسكنون في مهاجع الجامعة",
      "Which college and which year: في أيّ كلية تدرس؟ في أيّ سنة؟ — كلية الهندسة، الآداب، العلوم، الطب، التجارة؛ السنة الأولى، الثانية",
      "The future with سـ or سوف in front of the present: سأذهب، سيرجع، سوف أكتب",
      "The verbal noun (مصدر): دخول، خروج، جلوس، نزول، صعود، ركوب، رجوع، ذهاب — used after a preposition: خرجتُ للذهاب إلى المدير",
      "أمّا … فـ … (as for …): أمّا أنا فأسكن مع قريب لي",
      "أحد + a plural: 'one of …' — أخ لي = أحد إخواني",
    ],
  },
  {
    book: 2,
    lessonNo: 12,
    title: "The present tense for you (f.), you (f. pl.) and we; days of the week",
    newVocab: [
      "دَوَاءٌ", "أَدْوِيَةٌ", "وَاجِبٌ", "وَاجِبَاتٌ", "تِلْمِيذٌ", "تَلَامِيذُ", "تِلْمِيذَةٌ", "تِلْمِيذَاتٌ", "رَقْمٌ", "أَرْقَامٌ", "هَاتِفٌ", "هَوَاتِفُ", "وَقْتٌ", "أَوْقَاتٌ",
      "أَعْمَالٌ", "جَارٌ", "جِيرَانٌ", "جَارَةٌ", "خَارِجِيَّةٌ", "السَّبْتُ", "الْأَحَدُ", "الِاثْنَيْنِ", "الثُّلَاثَاءُ", "الْأَرْبِعَاءُ", "الْخَمِيسُ", "الْجُمُعَةُ",
    ],
    verbs: [sound("ضحك", "ضَحِكَ", "laugh")],
    verbSlots: slots("pres:2fs", "pres:2fp", "pres:1p"),
    newGrammar: [
      "The rest of the present: you (f.) تذهبين، تفعلين؛ you (f. pl.) تذهبن، تلعبن؛ we نلعب، نفهم، نكتب",
      "إنّ after قال and at the start of a sentence; أنّ after other verbs: قال إنه طبيب، أظنّ أنه طبيب، سمعت أنها مريضة",
      "The days of the week: السبت، الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، الجمعة — with يوم: يوم الأحد",
      "Everyday talk: ماذا تفعلين؟ أبحث عن الدواء؛ متى تذهبين؟ سأذهب بعد ساعة إن شاء الله",
    ],
  },
  {
    book: 2,
    lessonNo: 13,
    title: "The present tense with every pronoun (review)",
    newVocab: ["صَفٌّ", "صُفُوفٌ", "أَخِيرٌ", "أُجْرَةٌ"],
    newGrammar: [
      "The full table of the present (no dual yet): هو يذهب، هي تذهب، أنتَ تذهب، أنتِ تذهبين، أنا أذهب، هم يذهبون، هنّ يذهبن، أنتم تذهبون، أنتنّ تذهبن، نحن نذهب",
      "The present verb always starts with a letter that shows who: ي (he / they), ت (she / you), أ (I), ن (we); the ending shows number and gender",
      "سيارة الأجرة (a taxi), الصفّ الأخير (the last row)",
    ],
  },
  {
    book: 2,
    lessonNo: 14,
    title: "Commands",
    newVocab: [
      "عَقْرَبٌ", "عَقَارِبُ", "حِذَاءٌ", "أَحْذِيَةٌ", "أَكْوَابٌ", "صَوْتٌ", "أَصْوَاتٌ", "أَيْدٍ", "غَرِيبٌ", "غُرَبَاءُ", "مِذْيَاعٌ", "جَوٌّ", "وَرَقَةٌ",
      "مُظْلِمٌ", "نَعْسَانُ", "نَعْسَى", "تَعَالَ", "تَعَالَيْ", "تَعَالَوْا", "تَعَالَيْنَ",
    ],
    verbs: [
      sound("كنس", "كَنَسَ", "sweep"),
      sound("سكت", "سَكَتَ", "be quiet"),
      sound("نظر", "نَظَرَ", "look"),
      sound("جمع", "جَمَعَ", "gather"),
      sound("قطع", "قَطَعَ", "cut"),
      sound("طبخ", "طَبَخَ", "cook"),
      sound("حلق", "حَلَقَ", "shave"),
      sound("علم", "عَلِمَ", "know"),
      sound("منع", "مَنَعَ", "forbid"),
    ],
    verbSlots: slots("imp:2ms", "imp:2fs", "imp:2mp", "imp:2fp"),
    newGrammar: [
      "The command (أمر) is the present without its prefix: تكتب → اكتب، تجلس → اجلس، تذهب → اذهب، تقرأ → اقرأ — with an alef in front when the first letter has no vowel",
      "To a woman add ـي: اكتبي، اذهبي؛ to several men ـوا: اكتبوا، اذهبوا؛ to several women ـنَ: اكتبن، اذهبن",
      "Irregular: خذ (take), كل (eat), تعال (come)؛ and مُر",
      "Everyday commands: اجلس هنا، انظر إلى السبورة، اغسل وجهك، افتح النافذة، اذهب إلى الحمام، لا — see the next lesson for 'don't'",
    ],
  },
  {
    book: 2,
    lessonNo: 15,
    title: "Don't!: the negative command, and 'almost'",
    newVocab: ["مَقْعَدٌ", "مَقَاعِدُ", "أَبَتِ", "أَثْنَاءٌ", "غَائِبٌ", "إِنَّمَا"],
    newVerbs: ["اِنْقَلَبَ", "اِنْقَلَبَتْ"],
    verbs: [
      sound("كذب", "كَذَبَ", "lie"),
      { root: "بكي", lemma: "بَكَى", gloss: "cry", cls: "defective", weak: "ي" },
      { root: "كود", lemma: "كَادَ", gloss: "almost", cls: "hollow", weak: "ا" },
    ],
    verbSlots: slots("juss:2ms", "juss:2fs", "juss:2mp", "juss:2fp"),
    newGrammar: [
      "A negative command is لا + the present: لا تذهب، لا تأكلها، لا تكتب بالقلم الأحمر، لا تقرأ هنا — to a woman لا تذهبي، to several men لا تذهبوا، to several women لا تذهبن",
      "Two uses of لا: the command لا تفعلْ ('don't') and the plain denial لا يفعلُ ('he doesn't'). ما negates what is happening now: ما أشرب القهوة الآن",
      "كاد (almost): كاد يخرج، يكاد الجرس يرنّ — كاد + the present",
      "ألا + the present for a gentle question: ألا تذهب إلى الملعب؟",
    ],
  },
  {
    book: 2,
    lessonNo: 16,
    title: "Wanting, colours (feminine), another, and 'what' that joins",
    newVocab: [
      "أَشْيَاءُ", "قُمَاشٌ", "أَقْمِشَةٌ", "نَمُوذَجٌ", "نَمَاذِجُ", "حَلْوَى", "حَلَاوَى", "مُسَطَّرٌ", "غَيْرُ", "آخَرُ", "ضَيِّقٌ", "مِلَفٌّ", "زَهْرَةٌ",
      "شَعْرٌ", "عُمَرُ", "عَمْرٌو", "حَفْصَةُ", "حُسَيْنٌ", "ذَا",
      "حَمْرَاءُ", "سَوْدَاءُ", "بَيْضَاءُ", "خَضْرَاءُ", "زَرْقَاءُ", "صَفْرَاءُ", "سَمْرَاءُ",
    ],
    newAdjectives: ["أَسْمَرُ"],
    verbs: [
      { root: "رود", lemma: "أَرَادَ", gloss: "want", cls: "hollow", form: 4 },
      { root: "غيب", lemma: "غَابَ", gloss: "be absent", cls: "hollow", weak: "ي" },
      { root: "شري", lemma: "اِشْتَرَى", gloss: "buy", cls: "defective", weak: "ي", form: 8 },
    ],
    newGrammar: [
      "أريد + a noun: أريد قلماً، أريد دفتراً — and with every person: تريد، يريد، تريدين، يريدون، يردن، نريد",
      "Colours have a feminine form in أ…اء → …اء: أحمر ↔ حمراء، أسود ↔ سوداء، أبيض ↔ بيضاء، أخضر ↔ خضراء، أزرق ↔ زرقاء، أصفر ↔ صفراء، أسمر ↔ سمراء — قلم أحمر، حقيبة حمراء",
      "ما (what / that which) joins a statement: آكل ما تأكل، سأشتري ما تريد، افهم ما تقول",
      "آخر (m.) / أخرى (f.) = another: حقيبة أخرى، طالب آخر",
      "غير + a noun = not …: ورق غير مسطّر (unlined paper); ذو / ذا + a description: دفتر ذو ورق مسطّر",
      "عمر and عمرو are two different names, written differently",
    ],
  },
  {
    book: 2,
    lessonNo: 17,
    title: "'To …' and 'in order to': the subjunctive, and the seasons",
    newVocab: [
      "عُطْلَةٌ", "الْعَامُ", "الذُّبَابُ", "هُدُوءٌ", "إِعْلَانٌ", "أَهْلٌ", "ظَرْفٌ", "ظُرُوفٌ", "ضَوْضَاءُ", "عَشَاءٌ", "عِلَاجٌ",
      "الشِّتَاءُ", "الرَّبِيعُ", "الصَّيْفُ", "الْخَرِيفُ", "مُنْذُ",
    ],
    newAdjectives: ["مُقْبِلٌ"],
    verbs: [
      { root: "زور", lemma: "زَارَ", gloss: "visit", cls: "hollow", weak: "و" },
      sound("بدأ", "بَدَأَ", "begin", { overrides: HAMZA_FINAL("بد") }),
      sound("سمح", "سَمَحَ", "allow"),
      sound("مكن", "أَمْكَنَ", "be possible", { form: 4 }),
      { root: "بقي", lemma: "بَقِيَ", gloss: "remain", cls: "defective", weak: "ي", kasraPast: true },
      sound("بصق", "بَصَقَ", "spit"),
      { root: "رجو", lemma: "رَجَا", gloss: "hope", cls: "defective", weak: "و" },
    ],
    verbSlots: slots("subj:3ms", "subj:3fs", "subj:2ms", "subj:1s", "subj:1p"),
    newGrammar: [
      "After أنْ the present drops its final ـُ and ends in ـَ: أريد أن أذهبَ، يمكنك أن تجلسَ، أرجو أن تسمحَ لي",
      "The subjunctive follows: أراد، يريد، أرجو، يمكن، نسي، بدأ — and the 'in order to' ـلـ: خرجتُ لأشربَ الماء، ذهبتُ لأزورَ أخي",
      "منذ (since / for) with a time: غائب منذ أسبوع، أعرفه منذ سنتين",
      "The seasons: الشتاء، الربيع، الصيف، الخريف؛ العام المقبل (next year); عطلة الصيف",
      "يرى / ترى / أرى / نرى (see): أرى قلماً وكتاباً",
      "أرجو أن تسمح لي بـ… (may I…?): أرجو أن تسمح لي بالخروج",
    ],
  },
  {
    book: 2,
    lessonNo: 18,
    title: "The subjunctive with every pronoun; 'like'",
    newVocab: [
      "مُتْحَفٌ", "مَتَاحِفُ", "عَادَةٌ", "عَادَاتٌ", "عُلْبَةٌ", "عُلَبٌ", "مَلَابِسُ", "حَيَوَانٌ", "حَيَوَانَاتٌ", "عِيَادَةٌ", "هَيَّا", "الْمَغْرِبُ",
    ],
    verbs: [{ root: "حبب", lemma: "أَحَبَّ", gloss: "love", cls: "doubled", form: 4 }],
    verbSlots: slots("subj:3mp", "subj:2mp", "subj:2fs", "subj:3fp", "subj:2fp"),
    newAffixes: { prefixes: ["ك"] },
    newGrammar: [
      "After أن the five verbs lose their final ن: تريدون أن تذهبوا؛ تريدين أن تذهبي؛ يريدون أن يشتروا — the feminine plural keeps its ن: يردن أن يذهبن",
      "أرجو ألّا تأخذن (ألّا = أن + لا): I hope you won't take",
      "The letter كـ means 'like': هذه المدرسة كالمسجد، هذه القهوة كالماء، ساعتي كساعتك",
      "Going with others: هيا بنا (let's go)",
    ],
  },
  {
    book: 2,
    lessonNo: 19,
    title: "Will not: لن, and how to deny the past, present and future",
    newVocab: [
      "لَنْ", "آسِفٌ", "سَفَارَةٌ", "أَعْوَامٌ", "هِنْدِيٌّ", "هُنُودٌ", "حَرِيرٌ", "الدُّنْيَا", "مُسْتَقْبَلٌ", "بَدْءٌ", "أَبَدًا", "عِنْدَمَا", "مَصَارِفُ",
      "أَيُّوبُ", "جَعْفَرٌ",
    ],
    newAdjectives: ["مَوْجُودٌ", "مُتْعَبٌ"],
    verbs: [sound("لبس", "لَبِسَ", "wear"), sound("ترك", "تَرَكَ", "leave"), sound("صبر", "صَبَرَ", "be patient")],
    newGrammar: [
      "لن + the subjunctive denies the future: لن أذهب إلى الهند، لن يرجع خالد، لن أترك الصلاة أبداً",
      "Three ways to say 'not': the past with ما (ما ذهبتُ أمس)، the present with لا (لا أذهب كل يوم)، the future with لن (لن أذهب غداً)",
      "Polite regret: أنا آسف يا أستاذ — إنّي آسف",
      "أبدًا (never, future) and عندما (when)",
    ],
  },
  {
    book: 2,
    lessonNo: 20,
    title: "Two of something in every case; 'one of the two'",
    newVocab: [
      "مُشْطٌ", "أَمْشَاطٌ", "مِخَدَّةٌ", "مَخَادُّ", "زِرٌّ", "أَزْرَارٌ", "مِرْآةٌ", "مَرَايَا", "لِصٌّ", "لُصُوصٌ", "جُنَيْهٌ", "جُنَيْهَاتٌ",
      "أَحَدُهُمَا", "الْآخَرُ", "إِحْدَاهُمَا", "الْأُخْرَى", "رِيَالَيْنِ",
    ],
    newAdjectives: ["مُفِيدٌ"],
    verbs: [
      sound("ذبح", "ذَبَحَ", "slaughter"),
      sound("شرح", "شَرَحَ", "explain"),
      { root: "كفي", lemma: "كَفَى", gloss: "be enough", cls: "defective", weak: "ي" },
    ],
    newAffixes: { suffixes: ["ين", "تين", "كما", "هما"] },
    newGrammar: [
      "The dual in the object and after a preposition ends in ـيْن / ـتَيْن: رأيتُ المدرسَيْن، ذهبتُ إلى المدرسَيْن، اشتريتُ قلمَيْن — in the subject it is ـان / ـتان: جاء المدرسان",
      "After كم you may answer with the dual: كم أخاً لك؟ — أخوان",
      "أحدهما … والآخر … (one of the two … and the other …) for a masculine pair; إحداهما … والأخرى … for a feminine pair",
      "ذو + a dual: قلم ذو اللونين (a two-colour pen), قميص ذو الجيبين",
      "Buying things: بكم اشتريتَه؟ — بريالين (for two riyals)",
    ],
  },
  {
    book: 2,
    lessonNo: 21,
    title: "Not yet: لم and لمّا; noun sentence and verb sentence",
    newVocab: [
      "اِسْتِقْبَالٌ", "فَرْقٌ", "فُرُوقٌ", "رَئِيسٌ", "رُؤَسَاءُ", "مِثَالٌ", "أَمْثِلَةٌ", "مَهْلًا", "قِسْمٌ", "أَقْسَامٌ", "الْجُمْلَةُ", "الْفِعْلُ",
      "الْفَاعِلُ", "الْمُبْتَدَأُ", "الْخَبَرُ", "الِاسْمُ", "هَارُونُ", "اللَّائِي", "لَمْ", "لَمَّا", "جُمْلَةٌ", "اِسْمِيَّةٌ", "فِعْلِيَّةٌ",
    ],
    newVerbs: ["اِسْتَرِيحُوا"],
    verbs: [sound("حضر", "حَضَرَ", "attend"), { root: "أتي", lemma: "أَتَى", gloss: "come", cls: "defective", weak: "ي", overrides: { "imp:2ms": ["ائت"], "imp:2fs": ["ائتي"], "imp:2mp": ["ائتوا"], "imp:2fp": ["ائتين"] } }],
    verbSlots: slots("juss:3ms", "juss:3fs", "juss:3mp", "juss:3fp", "juss:1s", "juss:1p"),
    newGrammar: [
      "لم + the present (it ends in a sukun) denies the past: لم يذهبْ = ما ذهب، لم أكتبْ، لم تفهمْ — the five verbs lose their ن: لم يذهبوا، لم تذهبي",
      "لمّا + the present = 'not yet': لمّا يحضرْ (he has not come yet); لمّا alone as an answer: أحضر المدير؟ — لمّا",
      "A noun sentence begins with a noun (the مبتدأ and its خبر): السيارة جميلة. A verb sentence begins with a verb (الفعل then الفاعل): خرج المدرس",
      "The three kinds of word: اسم، فعل، حرف",
      "اللائي (= اللاتي) for 'who' of several women",
    ],
  },
  {
    book: 2,
    lessonNo: 22,
    title: "The three states of the present (review)",
    newVocab: [],
    newGrammar: [
      "One verb in its three states: the plain present (يذهبُ), after لن (لن يذهبَ) and after لم (لم يذهبْ) — with the same person endings",
      "The five verbs (يفعلان، يفعلون، تفعلين …) keep ن in the plain present and lose it after لن and لم",
    ],
  },
  {
    book: 2,
    lessonNo: 23,
    title: "Several men in every case; the tens; 'neither … nor'",
    newVocab: [
      "اِجْتِمَاعٌ", "قِصَّةٌ", "قِصَصٌ", "أَنْبِيَاءُ", "ثَانِيَةٌ", "ثَوَانٍ", "أُسْرَةٌ", "أُسَرٌ", "جَائِزَةٌ", "جَوَائِزُ", "قَاعَةٌ", "قَاعَاتٌ",
      "أَرْبَعُونَ", "خَمْسُونَ", "سِتُّونَ", "سَبْعُونَ", "ثَمَانُونَ", "تِسْعُونَ",
    ],
    verbs: [sound("نجح", "نَجَحَ", "succeed"), sound("رسب", "رَسَبَ", "fail")],
    newGrammar: [
      "The masculine sound plural ends in ـون as a subject and ـين otherwise: جاء المدرسون / رأيتُ المدرسين / ذهبتُ إلى المدرسين; before a second noun it loses its ن: أبناء المدرسين",
      "The tens: عشرون، ثلاثون، أربعون … تسعون — they end in ـين in the object or after a preposition: رأيتُ ثلاثين طالباً",
      "Numbers 21-99: واحد وعشرون، اثنان وثلاثون … — the counted noun is a singular accusative: خمسة وعشرون طالباً",
      "لا + the past, repeated, means 'neither … nor': لا أكلتُ ولا شربتُ",
    ],
  },
  {
    book: 2,
    lessonNo: 24,
    title: "Numbers: hundreds and thousands",
    newVocab: [
      "مِائَتَانِ", "مِائَتَا", "ثَلَاثُمِائَةٍ", "أَرْبَعُمِائَةٍ", "خَمْسُمِائَةٍ", "سِتُّمِائَةٍ", "سَبْعُمِائَةٍ", "ثَمَانِمِائَةٍ", "تِسْعُمِائَةٍ",
      "أَلْفَانِ", "آلَافٌ",
    ],
    newGrammar: [
      "The rules for the counted noun: 1-2 agree with it (طالب واحد، طالبتان)؛ 3-10 take the opposite gender and a plural noun in the genitive (ثلاثة طلاب، ثلاث طالبات)؛ 11-12 agree in both parts; 13-19 first part opposite and second part agrees (ثلاثة عشر طالباً، ثلاث عشرة طالبة)؛ 11-99 take a singular accusative noun; 100 and 1000 take a singular genitive noun (مائة طالب، ألف طالب)",
      "Hundreds: مائة، مائتان، ثلاثمائة، أربعمائة … تسعمائة؛ thousands: ألف، ألفان، ثلاثة آلاف … عشرة آلاف، مائة ألف",
      "Putting it together: ثلاثة وأربعون وخمسمائة وستة آلاف ريال",
    ],
  },
  {
    book: 2,
    lessonNo: 25,
    title: "Was and still is: كان and زال, and 'father' / 'brother' in every case",
    newVocab: [
      "سَفِيرٌ", "سُفَرَاءُ", "شُرْطِيٌّ", "شُرْطَةٌ", "عَمِيدٌ", "عُمَدَاءُ", "مَرْضَى", "أَنْحَاءٌ", "جَمِيعٌ", "أَبَا", "أَخَا", "أَنْوَرُ", "أَخْتَرُ",
    ],
    newAdjectives: ["مُتَقَاعِدٌ"],
    verbs: [{ root: "زول", lemma: "زَالَ", gloss: "cease", cls: "hollow", weak: "ا" }],
    newGrammar: [
      "كان (was) takes a subject in the nominative and a predicate in the accusative: كان حامدٌ مريضاً، كانت زينبُ طالبةً — in the present: يكون",
      "ما زال / لا يزال (still): لا يزال إبراهيم نائماً، لا تزال آمنة مريضة",
      "The five nouns: أبو / أخو change with the case — جاء أبوك، رأيتُ أباك، قلتُ لأبيك؛ أخوه، أخاه، لأخيه",
      "Jobs: سفير، شرطي، عميد، موجّه، وزير — كان مدرساً من قبل وهو الآن موجّه",
    ],
  },
  {
    book: 2,
    lessonNo: 26,
    title: "Verbs that start with و, small things, and 'here he is'",
    newVocab: [
      "وُلَيْدٌ", "جُبَيْلٌ", "نُهَيْرٌ", "كُلَيْبٌ", "رُجَيْلٌ", "طُفَيْلٌ", "نُجَيْمٌ", "أَقَلُّ", "أَشَدُّ", "أَلَذُّ", "أَحَبُّ", "هَا", "ذِي", "أَجْنَبِيٌّ", "مَحْفَظَةٌ",
      "نَقْدٌ", "نُقُودٌ", "خَطَأٌ", "أَخْطَاءُ", "إِيَابٌ", "تَذْكِرَةٌ", "تَذَاكِرُ", "قُرْصٌ", "أَقْرَاصٌ", "كِيلُوغْرَامٌ", "أُنْثَى", "إِنَاثٌ", "ذَكَرٌ",
      "ذُكُورٌ", "انْتِظَامٌ", "بِسُرْعَةٍ",
    ],
    newVerbs: ["يَنْبَغِي"],
    verbs: [
      sound("وصل", "وَصَلَ", "arrive", { cls: "assimilated" }),
      sound("وزن", "وَزَنَ", "weigh", { cls: "assimilated" }),
      sound("وعد", "وَعَدَ", "promise", { cls: "assimilated" }),
      sound("وهب", "وَهَبَ", "give", { cls: "assimilated" }),
      sound("وجب", "وَجَبَ", "be necessary", { cls: "assimilated" }),
      sound("وقف", "وَقَفَ", "stop", { cls: "assimilated" }),
      sound("عرج", "عَرِجَ", "limp"),
      sound("بلع", "بَلَعَ", "swallow"),
    ],
    newGrammar: [
      "Verbs whose first letter is و lose it in the present and in the command: وصل → يصل، صِلْ؛ وجد → يجد؛ وضع → يضع، ضَعْ؛ وقف → يقف، قِفْ؛ وجب → يجب",
      "يجب على + a pronoun + أن: يجب عليك أن تذهب، يجب علينا أن نكتب (must)",
      "The small form (تصغير): وليد، جبيل، نهير، كليب — 'a little boy, a little mountain, a little river, a little dog'",
      "'More than' for a doubled adjective: أقلّ، أشدّ، ألذّ، أحبّ — أبي حبيب إليّ وأمي أحبّ إليّ منه",
      "هذا هو ذا / ها هو ذا (here he is), ها هي ذي (here she is), ها أنا ذا (here I am)",
      "Money and things: نقود، محفظة، تذكرة، قرص، كيلوغرام، ذكر / أنثى، ذهاب وإياب (round trip)",
    ],
  },
  {
    book: 2,
    lessonNo: 27,
    title: "Verbs with a long vowel in the middle (hollow verbs)",
    newVocab: [
      "كَامِلٌ", "صُدَاعٌ", "مَشْغُولٌ", "الْمِلْحُ", "الزَّيْتُ", "الْجُبْنُ", "الدَّقِيقُ", "الْعَدَسُ", "بَيْضٌ", "الْغَابَةُ", "الْقِطَارُ", "الْبُخَارُ",
      "الْفَاكِهَانِيُّ", "الْغَدَاءُ", "مُنْتَصَفُ", "لَيْلٌ", "حَيْثُ", "الْأَسَدُ",
    ],
    verbs: [
      { root: "ذوق", lemma: "ذَاقَ", gloss: "taste", cls: "hollow", weak: "و" },
      { root: "صوم", lemma: "صَامَ", gloss: "fast", cls: "hollow", weak: "و" },
      { root: "دور", lemma: "دَارَ", gloss: "turn", cls: "hollow", weak: "و" },
      { root: "توب", lemma: "تَابَ", gloss: "repent", cls: "hollow", weak: "و" },
      { root: "بيع", lemma: "بَاعَ", gloss: "sell", cls: "hollow", weak: "ي" },
      { root: "سير", lemma: "سَارَ", gloss: "walk", cls: "hollow", weak: "ي" },
      { root: "عيش", lemma: "عَاشَ", gloss: "live", cls: "hollow", weak: "ي" },
      { root: "كيل", lemma: "كَالَ", gloss: "measure", cls: "hollow", weak: "ي" },
      { root: "نوم", lemma: "نَامَ", gloss: "sleep", cls: "hollow", weak: "ا" },
      { root: "خوف", lemma: "خَافَ", gloss: "fear", cls: "hollow", weak: "ا" },
      sound("غلب", "غَلَبَ", "overcome"),
    ],
    newVerbs: ["يَنْبَغِي"],
    newGrammar: [
      "A verb with a long vowel in the middle (قال، باع، نام، زار، كان) shortens it before a subject that begins with a consonant: قلتُ، بعتُ، نمتُ، زرتُ، كنتُ — and before نَ and نا: قلنَ، قلنا",
      "The same verbs lose the long vowel in the jussive and the command: لم يقل، قُل؛ لم يبع، بِع؛ لم ينم، نَم؛ لم يزر، زُر؛ لم يكن، كن",
      "Fear and sleep: خفتُ، أخاف، لا تخف؛ نمتُ، أنام، لا تنم",
      "حيث (where) and ينبغي (it is fitting): لا ينبغي لطالب أن يغيب كثيراً",
    ],
  },
  {
    book: 2,
    lessonNo: 28,
    title: "Verbs that end in a weak letter (defective verbs)",
    newVocab: [
      "الْيَمِينُ", "الْيَسَارُ", "تَنَاوُلٌ", "التَّحْقِيقُ", "قَوْمٌ", "اللَّيْلُ", "النَّهَارُ", "تُرَابٌ", "صَاحِبٌ", "أَصْحَابٌ", "هَدِيَّةٌ", "مُمَزَّقٌ",
    ],
    verbs: [
      { root: "جري", lemma: "جَرَى", gloss: "run", cls: "defective", weak: "ي" },
      { root: "رمي", lemma: "رَمَى", gloss: "throw", cls: "defective", weak: "ي" },
      { root: "بني", lemma: "بَنَى", gloss: "build", cls: "defective", weak: "ي" },
      { root: "سقي", lemma: "سَقَى", gloss: "give to drink", cls: "defective", weak: "ي" },
      { root: "دعو", lemma: "دَعَا", gloss: "call", cls: "defective", weak: "و" },
      { root: "شكو", lemma: "شَكَا", gloss: "complain", cls: "defective", weak: "و" },
      { root: "محو", lemma: "مَحَا", gloss: "erase", cls: "defective", weak: "و" },
      { root: "عفو", lemma: "عَفَا", gloss: "pardon", cls: "defective", weak: "و" },
      { root: "خشي", lemma: "خَشِيَ", gloss: "fear", cls: "defective", weak: "ي", kasraPast: true },
      { root: "طوي", lemma: "طَوَى", gloss: "fold", cls: "defective", weak: "ي" },
      sound("تبع", "تَبِعَ", "follow"),
      sound("وقع", "وَقَعَ", "fall", { cls: "assimilated" }),
    ],
    newGrammar: [
      "A verb that ends in و or ي: دعا → يدعو، رمى → يرمي، مشى → يمشي، بكى → يبكي، نسي → ينسى، بقي → يبقى",
      "In the past the weak letter shows before a subject ending: دعوتُ، رميتُ، مشيتُ، بكيتُ، نسيتُ، خشيتُ؛ دَعَوا، مَشَوا، بَكَوا؛ دَعَتْ، مَشَتْ",
      "In the jussive and the command the weak ending drops: لم يدعُ، لم يرمِ، لم يمشِ، لم يبكِ؛ ادعُ، ارمِ، امشِ، ابكِ — and with لا: لا ترمِ",
      "Showing someone something: أرني (show me), ما هذا بيمينك؟ — خذ هذا بيمينك",
      "Everyday: أكوي الثياب، تجري في الشارع، يبني بيتاً، أدعوهم لتناول العشاء، أشكو إلى المدير",
    ],
  },
  {
    book: 2,
    lessonNo: 29,
    title: "Verbs with a doubled letter (doubled verbs)",
    newVocab: [
      "نُسْخَةٌ", "نُسَخٌ", "مَرَّاتٌ", "كَفٌّ", "أَكُفٌّ", "رَائِحَةٌ", "هُنَيْهَةٌ", "مَزِيدٌ", "بَالُوعَةٌ", "قَطُّ", "أَلْيَنُ", "أَطْيَبُ",
    ],
    newAdjectives: ["كَرِيهٌ", "غَافِلٌ", "لَيِّنٌ", "طَيِّبٌ"],
    verbs: [
      { root: "ظنن", lemma: "ظَنَّ", gloss: "think", cls: "doubled" },
      { root: "جرر", lemma: "جَرَّ", gloss: "pull", cls: "doubled" },
      { root: "مرر", lemma: "مَرَّ", gloss: "pass", cls: "doubled" },
      { root: "عدد", lemma: "عَدَّ", gloss: "count", cls: "doubled" },
      { root: "سبب", lemma: "سَبَّ", gloss: "insult", cls: "doubled" },
      { root: "ردد", lemma: "رَدَّ", gloss: "return", cls: "doubled" },
      { root: "صبب", lemma: "صَبَّ", gloss: "pour", cls: "doubled" },
      { root: "شمم", lemma: "شَمَّ", gloss: "smell", cls: "doubled" },
      { root: "مسس", lemma: "مَسَّ", gloss: "touch", cls: "doubled" },
      sound("دفع", "دَفَعَ", "push"),
      sound("مرض", "مَرِضَ", "be ill"),
      sound("حزن", "حَزِنَ", "be sad"),
    ],
    newGrammar: [
      "A doubled verb (ظنّ، مرّ، عدّ، ردّ) joins its two identical letters before a vowel: ظنَّ، يظنُّ، ظنّوا — and separates them before a consonant ending: ظننتُ، ظننّا، ظننّ، يظننّ",
      "In the jussive both forms are possible: لم يعُدّ / لم يعدُدْ; the command: عُدَّ / اعْدُدْ؛ رُدَّ، شُمَّ، جُرَّ",
      "قطّ (never, about the past) and أبداً (never, about the future): ما فعلتُ هذا قطّ، لن أفعله أبداً",
      "More than: أطيب (from طيّب)، ألين (from ليّن)",
    ],
  },
  {
    book: 2,
    lessonNo: 30,
    title: "Two people and two things with verbs: you two, they two",
    newVocab: [
      "أَنْتُمَا", "مَعْهَدٌ", "خُطُوطٌ", "جَوِّيَّةٌ", "الْمُرَاقِبُ", "اِنْتِهَاءٌ", "شَبَهٌ", "فَتَيَانِ", "تَوْأَمَانِ", "الْمُقَرَّرَةُ",
    ],
    verbSlots: slots(
      "past:3md", "past:3fd", "past:2d", "pres:3md", "pres:3fd", "pres:2d", "subj:3md", "subj:3fd", "subj:2d", "juss:3md", "juss:3fd", "juss:2d", "imp:2d"
    ),
    newAffixes: { objects: ["كما", "هما"] },
    newGrammar: [
      "The dual in the past: they two (m.) ذهبا، they two (f.) ذهبتا، you two ذهبتما — الطالبان ذهبا، الطالبتان ذهبتا",
      "The dual in the present: يذهبان، تذهبان (they two f. / you two)؛ after لن / لم / أن the ن is lost: لن يذهبا، لم يذهبا، أريد أن تذهبا",
      "The command to two: اذهبا، اكتبا، اجلسا",
      "The dual pronouns: أنتما (you two), هما (they two); possessives ـكما، ـهما: أسماؤكما، بينكما؛ object ـكما ـهما: رأيتُهما",
    ],
  },
  {
    book: 2,
    lessonNo: 31,
    title: "The describing word follows its noun in four ways",
    newVocab: [
      "الْمُعْجَمُ", "الْوَسِيطُ", "الْجُزْءُ", "أَجْزَاءُ", "الْمُقَرَّرَةُ", "يَابَانِيٌّ", "بَاكِسْتَانِيٌّ", "أَخِيرَتَيْنِ",
    ],
    verbs: [{ root: "دلل", lemma: "دَلَّ", gloss: "guide", cls: "doubled" }],
    newGrammar: [
      "A describing word (نعت) follows its noun and matches it in four things: its ending (هذا كتابٌ جديدٌ، قرأتُ كتاباً جديداً)، masculine or feminine (ابن كبير، بنت صغيرة)، one / two / many (مدرسان جيدان، زملاء مجتهدون)، definite or not (السيارة الجديدة غالية)",
      "A nisba adjective: اليابانيّ، الباكستانيّ، المصريّ — محمد اليابانيّ",
      "Asking for guidance: أريد أن تدلّني على معجم جيد (I want you to point me to a good dictionary)",
    ],
  },
];
