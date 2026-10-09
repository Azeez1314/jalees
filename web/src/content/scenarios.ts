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
 * Book 1 situational dialogues, two or three per lesson. Hand-authored: each opener is
 * validated against the lesson's whitelist so the first thing a learner hears
 * can never be above their level.
 */
export const scenarios: Scenario[] = [
  // Lesson 1 — هذا, ما هذا؟, من هذا؟, أ-questions
  {
    id: "b1l1-what-is-this",
    lessonNo: 1,
    title: "What is this?",
    goal: "The learner names everyday objects (house, door, key, pen, book, chair, bed, desk, shirt) using هذا and answers ما هذا؟",
    openingLine: "السَّلَامُ عَلَيْكُمْ. هَذَا بَابٌ. وَمَا هَذَا؟",
    targetStructures: ["هذا + noun", "ما هذا؟"],
  },
  {
    id: "b1l1-people-and-animals",
    lessonNo: 1,
    title: "People and animals",
    goal: "The learner identifies people (man, boy, doctor, student, teacher, merchant) and animals (dog, cat, donkey, horse, camel) and answers yes/no questions with نعم / لا.",
    openingLine: "السَّلَامُ عَلَيْكُمْ. هَذَا حِصَانٌ. أَهَذَا حِمَارٌ؟",
    targetStructures: ["من هذا؟", "أ + هذا + noun؟", "نعم / لا"],
  },
  // Lesson 2 — ذلك
  {
    id: "b1l2-near-and-far",
    lessonNo: 2,
    title: "Near and far",
    goal: "The learner contrasts something near (هذا) with something far (ذلك) while naming objects and animals.",
    openingLine: "هَذَا قَلَمٌ. وَمَا ذَلِكَ؟",
    targetStructures: ["هذا vs ذلك", "ما ذلك؟"],
  },
  {
    id: "b1l2-sugar-and-milk",
    lessonNo: 2,
    title: "Sugar, milk, stone",
    goal: "The learner names things like sugar, milk, a stone and an imam using ذلك, and answers yes/no questions about what is far away.",
    openingLine: "هَذَا سُكَّرٌ وَذَلِكَ لَبَنٌ. أَذَلِكَ حَجَرٌ؟",
    targetStructures: ["ذلك + noun", "أذلك ...؟"],
  },
  // Lesson 3 — ال + adjective predicates
  {
    id: "b1l3-describe-things",
    lessonNo: 3,
    title: "Describing things",
    goal: "The learner describes objects with adjectives (new, old, big, small, clean, dirty, broken, open, heavy, light) using the definite article.",
    openingLine: "الْكِتَابُ جَدِيدٌ. وَالْقَلَمُ؟",
    targetStructures: ["definite noun + adjective", "الـ"],
  },
  {
    id: "b1l3-hot-and-cold",
    lessonNo: 3,
    title: "Hot or cold?",
    goal: "The learner describes food and drink (water, milk, sugar, apple) as hot, cold, sweet or delicious.",
    openingLine: "الْمَاءُ بَارِدٌ. وَاللَّبَنُ؟",
    targetStructures: ["definite noun + adjective", "adjectives of taste and temperature"],
  },
  // Lesson 4 — prepositions, أين, هو/هي, names, countries, ذهب/خرج
  {
    id: "b1l4-where-is-it",
    lessonNo: 4,
    title: "Where is it?",
    goal: "The learner says where things and people are (in the room, on the desk, in the school, in the market) using في / على and answers أين questions.",
    openingLine: "السَّلَامُ عَلَيْكُمْ. أَيْنَ الْكِتَابُ؟ أَهُوَ عَلَى الْمَكْتَبِ؟",
    targetStructures: ["أين", "في / على + noun", "هو / هي"],
  },
  {
    id: "b1l4-where-are-you-from",
    lessonNo: 4,
    title: "Where are you from?",
    goal: "The learner says which country they are from (Japan, China, India, the Philippines, Iraq) with من and asks the buddy the same.",
    openingLine: "السَّلَامُ عَلَيْكُمْ. مِنْ أَيْنَ أَنْتَ؟ أَمِنَ الْهِنْدِ؟",
    targetStructures: ["من أين أنت؟", "أنا من + country"],
  },
  {
    id: "b1l4-who-went-where",
    lessonNo: 4,
    title: "Who went where?",
    goal: "The learner says where a person (Muhammad, Khalid, Fatimah, the director) went or left from, using ذهب / خرج with إلى / من.",
    openingLine: "ذَهَبَ خَالِدٌ إِلَى الْمَدْرَسَةِ. وَأَيْنَ عَلِيٌّ؟",
    targetStructures: ["ذهب / خرج", "إلى / من + place"],
  },
  // Lesson 5 — idafa, يا
  {
    id: "b1l5-whose-is-it",
    lessonNo: 5,
    title: "Whose is it?",
    goal: "The learner says whose things are whose with the possessive construct (محمد's book, the director's key, the teacher's pen).",
    openingLine: "هَذَا كِتَابُ مُحَمَّدٍ. وَكِتَابُ مَنْ هَذَا؟",
    targetStructures: ["idafa", "كتاب من هذا؟"],
  },
  {
    id: "b1l5-names-and-titles",
    lessonNo: 5,
    title: "Names and titles",
    goal: "The learner calls people with يا (يا محمد، يا أستاذ) and asks and answers names of streets, cities and people with اسم.",
    openingLine: "يَا مُحَمَّدُ، مَا اسْمُ هَذَا الشَّارِعِ؟",
    targetStructures: ["يا + name", "ما اسم ...؟", "idafa"],
  },
  // Lesson 6 — هذه, feminine, ل
  {
    id: "b1l6-this-is-feminine",
    lessonNo: 6,
    title: "This (feminine)",
    goal: "The learner names feminine things (car, bicycle, spoon, pot, window, fridge, cow, chicken) with هذه and describes them with feminine adjectives.",
    openingLine: "هَذِهِ سَيَّارَةٌ جَدِيدَةٌ. وَمَا هَذِهِ؟",
    targetStructures: ["هذه + feminine noun", "feminine adjective agreement"],
  },
  {
    id: "b1l6-whose-is-this",
    lessonNo: 6,
    title: "Whose is this?",
    goal: "The learner says who things belong to using ل (لمن هذه؟ هذه لخالد) and body-part words (hand, ear, eye, nose, mouth).",
    openingLine: "لِمَنْ هَذِهِ الدَّرَّاجَةُ؟ أَهِيَ لِخَالِدٍ؟",
    targetStructures: ["لمن هذه؟", "ل + name"],
  },
  // Lesson 7 — تلك
  {
    id: "b1l7-that-feminine",
    lessonNo: 7,
    title: "That one (feminine)",
    goal: "The learner contrasts a near and a far feminine thing (هذه / تلك): pot and spoon, car and bicycle, window and door.",
    openingLine: "هَذِهِ قِدْرٌ وَتِلْكَ مِلْعَقَةٌ. وَمَا تِلْكَ؟",
    targetStructures: ["هذه vs تلك", "ما تلك؟"],
  },
  {
    id: "b1l7-the-garden",
    lessonNo: 7,
    title: "In the garden",
    goal: "The learner names and describes what is in a garden and a farm: garden, cow, duck, egg, camel, chicken, using هذه / تلك and adjectives.",
    openingLine: "تِلْكَ حَدِيقَةٌ جَمِيلَةٌ. وَمَا هَذِهِ؟",
    targetStructures: ["تلك + noun", "feminine adjective agreement"],
  },
  // Lesson 8 — أمام, خلف, countries, جلس
  {
    id: "b1l8-in-front-and-behind",
    lessonNo: 8,
    title: "In front and behind",
    goal: "The learner says where things are relative to each other (in front of / behind the house, the school, the mosque).",
    openingLine: "السَّيَّارَةُ أَمَامَ الْبَيْتِ. وَأَيْنَ الدَّرَّاجَةُ؟",
    targetStructures: ["أمام / خلف + noun", "أين"],
  },
  {
    id: "b1l8-who-sat-where",
    lessonNo: 8,
    title: "Who sat where?",
    goal: "The learner says where people sat, using جلس with أمام / خلف / في (the student, the teacher, the boy, the imam).",
    openingLine: "جَلَسَ الطَّالِبُ أَمَامَ الْمُدَرِّسِ. وَأَيْنَ جَلَسَ الْوَلَدُ؟",
    targetStructures: ["جلس", "أمام / خلف"],
  },
  {
    id: "b1l8-made-in",
    lessonNo: 8,
    title: "Where is it from?",
    goal: "The learner says which country things come from (a car from Japan, a book from Germany, a shirt from India) with من and countries.",
    openingLine: "هَذِهِ السَّيَّارَةُ مِنَ الْيَابَانِ. وَتِلْكَ مِنْ أَيْنَ؟",
    targetStructures: ["من + country", "هذه / تلك"],
  },
  // Lesson 9 — adjective after noun, أنا/أنت, الذي, عند
  {
    id: "b1l9-describe-people",
    lessonNo: 9,
    title: "Describing people",
    goal: "The learner describes people with noun + adjective (the tall man, the new student, a rich merchant, a hard-working student).",
    openingLine: "الرَّجُلُ الطَّوِيلُ تَاجِرٌ. وَمَنْ ذَلِكَ الطَّالِبُ الْجَدِيدُ؟",
    targetStructures: ["noun + adjective", "الذي"],
  },
  {
    id: "b1l9-hungry-or-thirsty",
    lessonNo: 9,
    title: "Hungry or thirsty?",
    goal: "The learner says how they and others are (hungry, thirsty, angry, lazy, ill) with أنا / أنت / هو / هي and says who is at whose place with عند.",
    openingLine: "أَنَا عَطْشَانُ. وَأَنْتَ؟",
    targetStructures: ["أنا / أنت + adjective", "عند"],
  },
  // Lesson 10 — possessive suffixes, عند/ل/مع + pronoun
  {
    id: "b1l10-getting-to-know-you",
    lessonNo: 10,
    title: "Getting to know you",
    goal: "The learner introduces themselves: their name (اسمي), where they are from, their language (لغتي), and asks the buddy the same.",
    openingLine: "السَّلَامُ عَلَيْكُمْ. مَا اسْمُكَ؟ وَمِنْ أَيْنَ أَنْتَ؟",
    targetStructures: ["ما اسمك؟", "من أين أنت؟", "attached pronouns"],
  },
  {
    id: "b1l10-my-family",
    lessonNo: 10,
    title: "My family",
    goal: "The learner talks about family and belongings: لي أخ، عندي كتاب، ما عندي سيارة, with father, mother, brother, sister, friend, colleague.",
    openingLine: "لِي أَخٌ وَاحِدٌ. أَلَكَ أَخٌ؟",
    targetStructures: ["لي / لك + family", "عندي / عندك + thing", "ما عندي"],
  },
];
