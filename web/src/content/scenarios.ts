export interface Scenario {
  /** Stable slug — used as the primary key in the scenarios table. */
  id: string;
  lessonNo: number;
  title: string;
  /** What the learner is practising; injected into the buddy's system prompt. */
  goal: string;
  /** The buddy's first line, fully diacritized. Must stay inside the lesson's cumulative vocab (checked by `npm run check:content`). */
  openingLine: string;
  targetStructures: string[];
}

/**
 * Book 1 situational dialogues, 2 per lesson. Hand-authored: each opener is
 * validated against the lesson's whitelist so the first thing a learner hears
 * can never be above their level.
 */
export const scenarios: Scenario[] = [
  {
    id: "b1l1-around-the-house",
    lessonNo: 1,
    title: "Around the house",
    goal: "The learner names objects around the house (house, door, key, chair, bed) using هذا/هذه and answers ما هذا؟",
    openingLine: "السَّلَامُ عَلَيْكُمْ. هَذَا بَابٌ. وَمَا هَذَا؟",
    targetStructures: ["هذا/هذه + noun", "ما هذا؟"],
  },
  {
    id: "b1l1-who-is-this",
    lessonNo: 1,
    title: "Who is this?",
    goal: "The learner identifies people (boy, girl, man, woman, friend) using هذا/هذه.",
    openingLine: "السَّلَامُ عَلَيْكُمْ. هَذَا وَلَدٌ. وَمَا هَذِهِ؟",
    targetStructures: ["هذا/هذه + person noun", "gender agreement of demonstratives"],
  },
  {
    id: "b1l2-big-or-small",
    lessonNo: 2,
    title: "Big or small?",
    goal: "The learner describes houses and cars as big/small/new/old, contrasting هذا (near) with ذلك (far).",
    openingLine: "هَذَا الْبَيْتُ كَبِيرٌ. وَذَلِكَ الْبَيْتُ؟",
    targetStructures: ["definite noun + adjective", "هذا vs ذلك"],
  },
  {
    id: "b1l2-where-is-it",
    lessonNo: 2,
    title: "Where is it?",
    goal: "The learner answers أين questions using هنا / هناك.",
    openingLine: "أَيْنَ الْكِتَابُ؟",
    targetStructures: ["أين", "هنا/هناك"],
  },
  {
    id: "b1l3-who-are-you",
    lessonNo: 3,
    title: "Who are you?",
    goal: "The learner introduces themselves and asks yes/no questions about the buddy using هل and the personal pronouns.",
    openingLine: "السَّلَامُ عَلَيْكُمْ. أَنَا مُدَرِّسٌ. هَلْ أَنْتَ طَالِبٌ؟",
    targetStructures: ["أنا/أنت/هو/هي + noun", "هل questions"],
  },
  {
    id: "b1l3-whose-key",
    lessonNo: 3,
    title: "Whose key is this?",
    goal: "The learner asks and answers about objects using the idafa construct (باب البيت, مفتاح السيارة).",
    openingLine: "هَلْ هَذَا مِفْتَاحُ السَّيَّارَةِ؟",
    targetStructures: ["إضافة", "هل questions"],
  },
  {
    id: "b1l4-where-is-the-book",
    lessonNo: 4,
    title: "Where is the book?",
    goal: "The learner says where things are using في / على / تحت / فوق / أمام / خلف.",
    openingLine: "أَيْنَ الْكِتَابُ؟ هَلْ هُوَ عَلَى الطَّاوِلَةِ؟",
    targetStructures: ["أين + preposition phrase", "جار ومجرور as خبر"],
  },
  {
    id: "b1l4-at-school",
    lessonNo: 4,
    title: "At school",
    goal: "The learner says where they and others are (school, market, mosque) using في and من/إلى.",
    openingLine: "أَنَا فِي الْمَدْرَسَةِ. وَأَنْتَ؟ أَيْنَ أَنْتَ؟",
    targetStructures: ["في + place", "أين أنت؟"],
  },
  {
    id: "b1l5-my-things",
    lessonNo: 5,
    title: "My things, your things",
    goal: "The learner talks about whose belongings are whose using the attached pronouns (كتابي، قلمك، كتابه، كتابها).",
    openingLine: "هَذَا كِتَابِي. وَهَلْ هَذَا قَلَمُكَ؟",
    targetStructures: ["attached possessive pronouns", "هل questions"],
  },
  {
    id: "b1l5-counting",
    lessonNo: 5,
    title: "Counting things",
    goal: "The learner says how many things they have, using عندي / عندك and the numbers one to three.",
    openingLine: "عِنْدِي ثَلَاثَةُ أَقْلَامٍ. وَهَلْ عِنْدَكَ قَلَمٌ؟",
    targetStructures: ["عند + pronoun", "numbers 1-3"],
  },
];
