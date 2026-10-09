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
  // Lesson 11 — في + pronoun, ماذا, أحب
  {
    id: "b1l11-my-room",
    lessonNo: 11,
    title: "My room",
    goal: "The learner describes their room or house and says what is in it (bed, desk, window, chair, bag) using فيه / فيها and the possessive suffixes.",
    openingLine: "هَذِهِ غُرْفَتِي. فِيهَا سَرِيرٌ وَمَكْتَبٌ. وَمَاذَا فِي غُرْفَتِكَ؟",
    targetStructures: ["في + pronoun", "ماذا في ...؟", "possessive suffixes"],
  },
  {
    id: "b1l11-who-do-you-love",
    lessonNo: 11,
    title: "Who do you love?",
    goal: "The learner says who is in their house and who they love (father, mother, brother, sister, teacher, friend, the Arabic language) with أحب.",
    openingLine: "أَنَا أُحِبُّ أَبِي وَأُمِّي. وَمَنْ فِي بَيْتِكَ؟",
    targetStructures: ["أحب + object", "من في ...؟"],
  },
  // Lesson 12 — greetings, التي, she-verbs
  {
    id: "b1l12-greetings",
    lessonNo: 12,
    title: "Greetings",
    goal: "The learner greets the buddy with the full salaam, asks and answers كيف حالك؟, and says where they are from and the names of their parents.",
    openingLine: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ. كَيْفَ حَالُكَ؟",
    targetStructures: ["كيف حالك؟", "أنا بخير والحمد لله", "يا + possessive"],
  },
  {
    id: "b1l12-where-did-she-go",
    lessonNo: 12,
    title: "Where did she go?",
    goal: "The learner says where women and girls went or left from, using ذهبت / خرجت / جلست, and asks about family (aunt, uncle, mother).",
    openingLine: "ذَهَبَتْ فَاطِمَةُ إِلَى الْمُسْتَشْفَى. وَأَيْنَ ذَهَبَتْ أُمُّكَ؟",
    targetStructures: ["ذهبت / خرجت / جلست", "verb agreement with a feminine subject"],
  },
  // Lesson 13 — plurals, هؤلاء, هم/هن
  {
    id: "b1l13-these-people",
    lessonNo: 13,
    title: "Who are these?",
    goal: "The learner asks and says who groups of people are (new students, teachers, merchants, guests, doctors) with هؤلاء, هم / هن and plural nouns and adjectives.",
    openingLine: "مَنْ هَؤُلَاءِ؟ أَهُمْ طُلَّابٌ جُدُدٌ؟",
    targetStructures: ["هؤلاء", "هم / هن", "plural nouns and adjectives"],
  },
  {
    id: "b1l13-where-did-they-go",
    lessonNo: 13,
    title: "Where did they go?",
    goal: "The learner says where groups went, using ذهبوا / خرجوا for men and ذهبن / خرجن for women.",
    openingLine: "الطُّلَّابُ ذَهَبُوا إِلَى الْمَطْعَمِ. وَأَيْنَ النِّسَاءُ؟",
    targetStructures: ["ذهبوا / ذهبن", "plural subjects"],
  },
  // Lesson 14 — نحن / أنتم, ـنا / ـكم
  {
    id: "b1l14-we-are",
    lessonNo: 14,
    title: "Who are we?",
    goal: "The learner talks about 'we' and 'you (plural)': where they and their friends are from and what they study, with نحن and أنتم.",
    openingLine: "نَحْنُ مِنَ الْيَابَانِ. وَمِنْ أَيْنَ أَنْتُمْ؟",
    targetStructures: ["نحن / أنتم", "من أين أنتم؟"],
  },
  {
    id: "b1l14-your-house",
    lessonNo: 14,
    title: "Our house, your house",
    goal: "The learner talks about 'our' and 'your' (plural) house, school, language and city using ـنا and ـكم, and in which college or school they are.",
    openingLine: "أَيْنَ بَيْتُكُمْ؟ بَيْتُنَا قَرِيبٌ مِنَ الْجَامِعَةِ.",
    targetStructures: ["ـنا / ـكم", "أيّ + noun"],
  },
  // Lesson 15 — أنتنّ, متى, قبل / بعد
  {
    id: "b1l15-when-did-you-go",
    lessonNo: 15,
    title: "When did you go?",
    goal: "The learner says when they went somewhere (before / after the prayer, a week ago, after the lesson) and asks متى questions.",
    openingLine: "مَتَى ذَهَبْتَ إِلَى الْمَسْجِدِ؟ أَذَهَبْتَ قَبْلَ الصَّلَاةِ؟",
    targetStructures: ["متى", "قبل / بعد", "ذهبت"],
  },
  {
    id: "b1l15-we-came-back",
    lessonNo: 15,
    title: "We went and came back",
    goal: "The learner reports a trip with ذهبنا / ذهبتم / رجعنا and says when it was (a week ago, a month ago).",
    openingLine: "ذَهَبْنَا إِلَى الْقَاهِرَةِ قَبْلَ أُسْبُوعٍ. وَمَتَى ذَهَبْتُمْ؟",
    targetStructures: ["ذهبنا / رجعنا", "متى"],
  },
  // Lesson 16 — plural things
  {
    id: "b1l16-many-things",
    lessonNo: 16,
    title: "Many things",
    goal: "The learner names and describes plural things (books, doors, cars, pens, houses, mountains) with هذه / تلك and feminine singular adjectives.",
    openingLine: "هَذِهِ كُتُبٌ جَدِيدَةٌ. وَمَا تِلْكَ؟",
    targetStructures: ["هذه + plural of things", "feminine adjective for plurals"],
  },
  {
    id: "b1l16-whose-things",
    lessonNo: 16,
    title: "Whose are these?",
    goal: "The learner says whose plural things are (pens, books, notebooks, offices) using لمن هذه ...؟ and هي لـ…",
    openingLine: "لِمَنْ هَذِهِ الْأَقْلَامُ؟ أَهِيَ لَكَ؟",
    targetStructures: ["لمن هذه + plural", "هي لـ"],
  },
  // Lesson 17 — describing plural things, idafa with plurals
  {
    id: "b1l17-the-street",
    lessonNo: 17,
    title: "In this street",
    goal: "The learner describes what is in a street or town (hotels, shops, mosques, houses) and what they are like, with plural nouns and feminine singular adjectives.",
    openingLine: "فِي هَذَا الشَّارِعِ فَنَادِقُ كَبِيرَةٌ. وَأَيْنَ الْمَسْجِدُ؟",
    targetStructures: ["plural of things + adjective", "في + noun"],
  },
  {
    id: "b1l17-the-company",
    lessonNo: 17,
    title: "The company",
    goal: "The learner says what belongs to the company manager or the students (cars, offices, shirts, houses) using idafa with plurals, and says if things are cheap or expensive.",
    openingLine: "السَّيَّارَةُ لِمُدِيرِ الشَّرِكَةِ. وَالْبُيُوتُ الْجَدِيدَةُ لِمَنْ؟",
    targetStructures: ["idafa with plurals", "لمن"],
  },
  // Lesson 18 — كم, dual
  {
    id: "b1l18-how-many",
    lessonNo: 18,
    title: "How many brothers and sisters?",
    goal: "The learner says how many brothers and sisters they have (one, two) using كم and the dual (أخوان، أختان).",
    openingLine: "كَمْ أَخًا لَكَ؟ وَكَمْ أُخْتًا لَكَ؟",
    targetStructures: ["كم + singular noun", "dual"],
  },
  {
    id: "b1l18-two-of-everything",
    lessonNo: 18,
    title: "Two of everything",
    goal: "The learner counts pairs and twos in a house or body (two doors, two windows, two eyes, two ears, two hands) with the dual and asks كم ...؟",
    openingLine: "فِي الْبَيْتِ بَابَانِ وَنَافِذَتَانِ. كَمْ نَافِذَةً فِي غُرْفَتِكَ؟",
    targetStructures: ["dual -ان / -تان", "كم"],
  },
  // Lesson 19 — numbers 3-10 and prices
  {
    id: "b1l19-counting",
    lessonNo: 19,
    title: "Counting things",
    goal: "The learner counts what they have (books, pens, brothers, days) with the numbers three to ten and answers كم ... عندك؟",
    openingLine: "عِنْدِي خَمْسَةُ كُتُبٍ وَثَلَاثَةُ أَقْلَامٍ. كَمْ كِتَابًا عِنْدَكَ؟",
    targetStructures: ["numbers 3-10 + plural", "عندي"],
  },
  {
    id: "b1l19-prices",
    lessonNo: 19,
    title: "How much is it?",
    goal: "The learner asks and answers prices of books, shirts and cups in riyals, with كم ثمن ...؟ and the numbers three to ten.",
    openingLine: "كَمْ ثَمَنُ هَذَا الْكِتَابِ؟ ثَمَنُهُ سَبْعَةُ رِيَالَاتٍ.",
    targetStructures: ["كم ثمن", "numbers + ريالات"],
  },
  // Lesson 20 — numbers 3-10 with feminine nouns
  {
    id: "b1l20-brothers-and-sisters",
    lessonNo: 20,
    title: "Brothers and sisters",
    goal: "The learner says how many sisters and brothers they have and how many students are in the class, using the right number form for masculine and feminine nouns.",
    openingLine: "لِي ثَلَاثُ أَخَوَاتٍ وَخَمْسَةُ إِخْوَةٍ. وَلَكَ؟",
    targetStructures: ["numbers with feminine nouns", "numbers with masculine nouns"],
  },
  {
    id: "b1l20-at-school",
    lessonNo: 20,
    title: "At school",
    goal: "The learner counts things at school (teachers, classrooms, buses, lessons, words, letters) with the numbers three to ten.",
    openingLine: "فِي هَذِهِ الْمَدْرَسَةِ ثَمَانِي مُدَرِّسَاتٍ. كَمْ مُدَرِّسَةً فِي مَدْرَسَتِكَ؟",
    targetStructures: ["numbers + feminine plural", "كم"],
  },
  // Lesson 21 — school reading, ولكن, أم
  {
    id: "b1l21-my-school",
    lessonNo: 21,
    title: "My school",
    goal: "The learner describes their school and class (how big, how many windows and doors, who is in it, which countries they are from) and contrasts with ولكن.",
    openingLine: "هَذِهِ مَدْرَسَتِي. هِيَ كَبِيرَةٌ وَلَكِنَّ فَصْلِي صَغِيرٌ.",
    targetStructures: ["ولكن", "describing a school"],
  },
  {
    id: "b1l21-open-or-closed",
    lessonNo: 21,
    title: "Open or closed?",
    goal: "The learner chooses between two options with أ ... أم ... (open or closed, big or small, near or far) and says how many doors and chairs there are.",
    openingLine: "أَمُغْلَقَةٌ أَبْوَابُهَا الْآنَ أَمْ مَفْتُوحَةٌ؟",
    targetStructures: ["أ ... أم ...؟", "plural + feminine adjective"],
  },
  // Lesson 22 — colours, قال
  {
    id: "b1l22-colours",
    lessonNo: 22,
    title: "Colours",
    goal: "The learner names colours of things (red, blue, green, black, yellow, white) and asks ما لون ...؟",
    openingLine: "هَذَا قَلَمٌ أَحْمَرُ وَذَلِكَ قَلَمٌ أَزْرَقُ. وَمَا لَوْنُ هَذَا؟",
    targetStructures: ["colours", "ما لون ...؟"],
  },
  {
    id: "b1l22-he-said",
    lessonNo: 22,
    title: "He said, she said",
    goal: "The learner reports what a friend said using قال / قالت and what the friend has (pens, handkerchiefs, keys) with a colour.",
    openingLine: "قَالَ يُوسُفُ: عِنْدِي خَمْسَةُ أَقْلَامٍ. كَمْ قَلَمًا عِنْدَكَ؟",
    targetStructures: ["قال / قالت", "numbers and colours"],
  },
  // Lesson 23 — names, places, ل
  {
    id: "b1l23-who-went-where",
    lessonNo: 23,
    title: "Who went where?",
    goal: "The learner says where people went (Makkah, Jeddah, Riyadh, Baghdad, London, the director) using ذهب / خرج and city names.",
    openingLine: "ذَهَبَ أَحْمَدُ إِلَى مَكَّةَ وَذَهَبَ عُثْمَانُ إِلَى جُدَّةَ. وَأَيْنَ ذَهَبَ يَعْقُوبُ؟",
    targetStructures: ["ذهب إلى + city", "names"],
  },
  {
    id: "b1l23-whose-things",
    lessonNo: 23,
    title: "Whose book is whose?",
    goal: "The learner says whose things belong to whom with ل and names (حمزة، عثمان، خديجة), combining numbers and colours.",
    openingLine: "هَذَا الْكِتَابُ لِحَمْزَةَ وَذَلِكَ الْقَلَمُ لِعُثْمَانَ. وَلِمَنْ هَذَا الدَّفْتَرُ؟",
    targetStructures: ["ل + name", "هذا / ذلك"],
  },
];
