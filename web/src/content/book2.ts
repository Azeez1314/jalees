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

/** jaa'a (came): irregular spelling around the hamza, so every taught slot is written out. */
const JAA: VerbEntry = {
  root: "جيء", lemma: "جَاءَ", gloss: "come", cls: "hollow", weak: "ي",
  overrides: {
    "past:3ms": ["جاء"], "past:3fs": ["جاءت"], "past:3mp": ["جاءوا", "جاؤوا"], "past:3fp": ["جئن"],
    "past:2ms": ["جئت"], "past:2fs": ["جئت"], "past:2mp": ["جئتم"], "past:2fp": ["جئتن"], "past:1s": ["جئت"], "past:1p": ["جئنا"],
    "pres:3ms": ["يجيء"], "pres:3fs": ["تجيء"], "pres:2ms": ["تجيء"], "pres:1s": ["أجيء"], "pres:1p": ["نجيء"],
  },
};

/** ra'aa (saw): the past is regular for a verb ending in ى, the present drops the hamza (يرى). */
const RAA: VerbEntry = {
  root: "رأي", lemma: "رَأَى", gloss: "see", cls: "defective", weak: "ي",
  overrides: {
    "pres:3ms": ["يرى"], "pres:3fs": ["ترى"], "pres:2ms": ["ترى"], "pres:1s": ["أرى"], "pres:1p": ["نرى"],
    "pres:3mp": ["يرون"], "pres:2mp": ["ترون"], "pres:2fs": ["ترين"], "pres:3fp": ["يرين"], "pres:2fp": ["ترين"],
    "past:3mp": ["رأوا"],
  },
};

const sound = (root: string, lemma: string, gloss: string, extra: Partial<VerbEntry> = {}): VerbEntry => ({ root, lemma, gloss, cls: "sound", ...extra });

/** قرأ: the hamza is written on a waw in the plural (قَرَؤُوا), which the generator can't know. */
const QARA: VerbEntry = sound("قرأ", "قَرَأَ", "read", { overrides: { "past:3mp": ["قرؤوا", "قرأوا"] } });
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
      "مَسَافَةٌ", "كِيلُومِتْرٌ", "سَنْتِيمِتْرٌ", "مِتْرٌ", "أَمْتَارٌ", "عَمَلٌ", "مُهَنْدِسَانِ", "ثَلَاثُونَ", "اِثْنَانِ",
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
];
