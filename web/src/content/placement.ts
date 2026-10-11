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
  // Lesson 11 — أحب, في + pronoun
  { id: "p11a", lessonNo: 11, prompt: "I love my father and my mother.", slots: [["أحب"], ["أبي"], ["أمي"]], example: "أُحِبُّ أَبِي وَأُمِّي", wrong: ["أحب أبي", "أبي وأمي", "أحب أمي"] },
  // Lesson 12 — she-verbs
  { id: "p12a", lessonNo: 12, prompt: "Khadijah went to the hospital.", slots: [["ذهبت"], ["خديجة"], ["إلى"], ["مستشفى"]], example: "ذَهَبَتْ خَدِيجَةُ إِلَى الْمُسْتَشْفَى", wrong: ["ذهب خديجة إلى المستشفى", "ذهبت خديجة", "خديجة في المستشفى"] },
  // Lesson 13 — plurals, هؤلاء
  { id: "p13a", lessonNo: 13, prompt: "These students are new.", slots: [["هؤلاء"], ["طلاب"], ["جدد"]], example: "هَؤُلَاءِ طُلَّابٌ جُدُدٌ", wrong: ["هذا طلاب جدد", "هؤلاء طلاب", "هؤلاء طالب جديد"] },
  // Lesson 14 — نحن
  { id: "p14a", lessonNo: 14, prompt: "We are from Japan.", slots: [["نحن"], ["من"], ["يابان"]], example: "نَحْنُ مِنَ الْيَابَانِ", wrong: ["أنا من اليابان", "نحن في اليابان", "نحن"] },
  // Lesson 15 — متى, past verbs
  { id: "p15a", lessonNo: 15, prompt: "When did you (to one man) go?", slots: [["متى"], ["ذهبت"]], example: "مَتَى ذَهَبْتَ؟", wrong: ["متى", "ذهبت", "أين ذهبت"] },
  // Lesson 16 — plural things
  { id: "p16a", lessonNo: 16, prompt: "These books are new.", slots: [["هذه"], ["كتب"], ["جديدة"]], example: "هَذِهِ كُتُبٌ جَدِيدَةٌ", wrong: ["هذا كتب جديدة", "هذه كتب جديد", "هذه كتب"] },
  // Lesson 17 — plurals with idafa
  { id: "p17a", lessonNo: 17, prompt: "The doors of the mosque are open.", slots: [["أبواب"], ["مسجد"], ["مفتوحة"]], example: "أَبْوَابُ الْمَسْجِدِ مَفْتُوحَةٌ", wrong: ["أبواب المسجد مفتوح", "أبواب مفتوحة", "الباب المسجد مفتوحة"] },
  // Lesson 18 — dual
  { id: "p18a", lessonNo: 18, prompt: "I have two sisters.", slots: [["لي", "عندي"], ["أختان"]], example: "لِي أُخْتَانِ", wrong: ["لي أخت", "لي أخوات", "أختان"] },
  // Lesson 19 — numbers 3-10
  { id: "p19a", lessonNo: 19, prompt: "I have five books.", slots: [["عندي", "لي"], ["خمسة"], ["كتب"]], example: "عِنْدِي خَمْسَةُ كُتُبٍ", wrong: ["عندي كتب", "عندي خمس كتب", "خمسة كتب"] },
  // Lesson 20 — numbers with feminine nouns
  { id: "p20a", lessonNo: 20, prompt: "I have three sisters.", slots: [["لي", "عندي"], ["ثلاث"], ["أخوات"]], example: "لِي ثَلَاثُ أَخَوَاتٍ", wrong: ["لي ثلاثة أخوات", "لي أخوات", "ثلاث أخوات"] },
  // Lesson 21 — ولكن
  { id: "p21a", lessonNo: 21, prompt: "The school is big, but the classroom is small.", slots: [["مدرسة"], ["كبيرة"], ["لكن"], ["فصل"], ["صغير"]], example: "الْمَدْرَسَةُ كَبِيرَةٌ وَلَكِنَّ الْفَصْلَ صَغِيرٌ", wrong: ["المدرسة كبيرة والفصل صغير", "المدرسة كبير ولكن الفصل صغير", "ولكن الفصل صغير"] },
  // Lesson 22 — colours
  { id: "p22a", lessonNo: 22, prompt: "I have a red pen.", slots: [["عندي", "لي"], ["قلم"], ["أحمر"]], example: "عِنْدِي قَلَمٌ أَحْمَرُ", wrong: ["عندي قلم أزرق", "عندي أحمر", "قلم أحمر"] },
  // Lesson 23 — names, places
  { id: "p23a", lessonNo: 23, prompt: "Ahmad went to Makkah.", slots: [["ذهب"], ["أحمد"], ["إلى"], ["مكة"]], example: "ذَهَبَ أَحْمَدُ إِلَى مَكَّةَ", wrong: ["أحمد في مكة", "ذهب أحمد", "ذهب إلى مكة"] },
  // ---- Book 2 (lessonNo here is the global POSITION: Book 2 lesson n = 23 + n) -------------------------------------------------
  { id: "p24a", lessonNo: 24, prompt: "Indeed, he is a merchant.", slots: [["إنه"], ["تاجر"]], example: "إِنَّهُ تَاجِرٌ", wrong: ["هو تاجر", "إنه", "تاجر"] },
  { id: "p25a", lessonNo: 25, prompt: "I am not a teacher.", slots: [["لست"], ["مدرس", "مدرسا", "بمدرس"]], example: "لَسْتُ بِمُدَرِّسٍ", wrong: ["أنا مدرس", "ليس بمدرس", "لست"] },
  { id: "p26a", lessonNo: 26, prompt: "He is taller than me.", slots: [["أطول"], ["مني"]], example: "هُوَ أَطْوَلُ مِنِّي", wrong: ["هو طويل مني", "هو أطول", "هو أطول منك"] },
  { id: "p27a", lessonNo: 27, prompt: "I went to the market.", slots: [["ذهبت"], ["إلى"], ["سوق"]], example: "ذَهَبْتُ إِلَى السُّوقِ", wrong: ["ذهب إلى السوق", "أنا في السوق", "ذهبت"] },
  { id: "p28a", lessonNo: 28, prompt: "Hamid opened the door.", slots: [["فتح"], ["حامد"], ["باب"]], example: "فَتَحَ حَامِدٌ الْبَابَ", wrong: ["حامد الباب", "فتح الباب", "حامد فتح"] },
  { id: "p29a", lessonNo: 29, prompt: "I saw her.", slots: [["رأيتها"]], example: "رَأَيْتُهَا", wrong: ["رأيته", "رأيتك", "رأيت"] },
  { id: "p30a", lessonNo: 30, prompt: "We played football.", slots: [["لعبنا"], ["كرة"], ["قدم"]], example: "لَعِبْنَا كُرَةَ الْقَدَمِ", wrong: ["لعبت كرة القدم", "كرة القدم", "لعبنا"] },
  { id: "p31a", lessonNo: 31, prompt: "The girls went to the library.", slots: [["ذهبن"], ["طالبات", "بنات"], ["مكتبة"]], example: "الْبَنَاتُ ذَهَبْنَ إِلَى الْمَكْتَبَةِ", wrong: ["البنات ذهبوا إلى المكتبة", "البنات ذهبت إلى المكتبة", "ذهبن إلى المكتبة"] },
  { id: "p32a", lessonNo: 32, prompt: "How beautiful this car is!", slots: [["ما"], ["أجمل"], ["سيارة"]], example: "مَا أَجْمَلَ هَذِهِ السَّيَّارَةَ", wrong: ["ما جميلة هذه السيارة", "هذه السيارة جميلة", "ما أجمل"] },
  { id: "p33a", lessonNo: 33, prompt: "My father goes to the market every day.", slots: [["يذهب"], ["أبي"], ["سوق"], ["كل"], ["يوم"]], example: "يَذْهَبُ أَبِي إِلَى السُّوقِ كُلَّ يَوْمٍ", wrong: ["ذهب أبي إلى السوق كل يوم", "يذهب أبي إلى السوق", "أبي في السوق كل يوم"] },
  { id: "p34a", lessonNo: 34, prompt: "They live in the university halls.", slots: [["يسكنون"], ["مهاجع"]], example: "يَسْكُنُونَ فِي مَهَاجِعِ الْجَامِعَةِ", wrong: ["يسكن في مهاجع الجامعة", "سكنوا في المهاجع", "يسكنون"] },
  { id: "p35a", lessonNo: 35, prompt: "What are you (to a woman) doing?", slots: [["ماذا"], ["تفعلين"]], example: "مَاذَا تَفْعَلِينَ؟", wrong: ["ماذا تفعل", "تفعلين", "ماذا تفعلون"] },
  { id: "p36a", lessonNo: 36, prompt: "They (women) go and we go.", slots: [["يذهبن"], ["نذهب"]], example: "هُنَّ يَذْهَبْنَ وَنَحْنُ نَذْهَبُ", wrong: ["هن يذهبون ونحن نذهب", "هن يذهبن", "نحن نذهب"] },
  { id: "p37a", lessonNo: 37, prompt: "Open the window! (to a man)", slots: [["افتح"], ["نافذة"]], example: "اِفْتَحِ النَّافِذَةَ", wrong: ["افتحي النافذة", "تفتح النافذة", "النافذة"] },
  { id: "p38a", lessonNo: 38, prompt: "Don't sit here! (to a man)", slots: [["لا"], ["تجلس"], ["هنا"]], example: "لَا تَجْلِسْ هُنَا", wrong: ["اجلس هنا", "لا تجلسي هنا", "لا تجلس"] },
  { id: "p39a", lessonNo: 39, prompt: "I want another bag.", slots: [["أريد"], ["حقيبة"], ["أخرى"]], example: "أُرِيدُ حَقِيبَةً أُخْرَى", wrong: ["أريد حقيبة آخر", "حقيبة أخرى", "أريد حقيبة"] },
  { id: "p40a", lessonNo: 40, prompt: "I want to go to Makkah.", slots: [["أريد"], ["أذهب"], ["مكة"]], example: "أُرِيدُ أَنْ أَذْهَبَ إِلَى مَكَّةَ", wrong: ["أريد أذهب", "أذهب إلى مكة", "أريد أن أذهب"] },
  { id: "p41a", lessonNo: 41, prompt: "You (all) want to go.", slots: [["تريدون"], ["تذهبوا"]], example: "تُرِيدُونَ أَنْ تَذْهَبُوا", wrong: ["تريدون أن تذهبون", "تريدين أن تذهبي", "تريدون"] },
  { id: "p42a", lessonNo: 42, prompt: "I will not go.", slots: [["لن"], ["أذهب"]], example: "لَنْ أَذْهَبَ", wrong: ["لا أذهب", "لن", "سأذهب"] },
  { id: "p43a", lessonNo: 43, prompt: "I have two pens.", slots: [["عندي", "لي"], ["قلمان", "قلمين"]], example: "عِنْدِي قَلَمَانِ", wrong: ["عندي قلم", "عندي أقلام", "قلمان"] },
  { id: "p44a", lessonNo: 44, prompt: "I did not write the lesson.", slots: [["لم"], ["أكتب"], ["درس"]], example: "لَمْ أَكْتُبِ الدَّرْسَ", wrong: ["ما كتب الدرس", "لن أكتب الدرس", "لم أكتب"] },
  { id: "p45a", lessonNo: 45, prompt: "I went yesterday and I will go tomorrow.", slots: [["ذهبت"], ["أمس"], ["سأذهب", "سوف أذهب"], ["غدا"]], example: "ذَهَبْتُ أَمْسِ وَسَأَذْهَبُ غَدًا", wrong: ["ذهبت أمس", "سأذهب غدا", "أذهب أمس وأذهب غدا"] },
  { id: "p46a", lessonNo: 46, prompt: "There are thirty students.", slots: [["ثلاثون", "ثلاثين"], ["طالبا", "طالب"]], example: "ثَلَاثُونَ طَالِبًا", wrong: ["ثلاثة طلاب", "ثلاثون طلاب", "طالبا"] },
  { id: "p47a", lessonNo: 47, prompt: "I bought it for five hundred riyals.", slots: [["اشتريته", "اشتريتها"], ["خمسمائة", "بخمسمائة"], ["ريال"]], example: "اِشْتَرَيْتُهُ بِخَمْسِمِائَةِ رِيَالٍ", wrong: ["اشتريته بمائة ريال", "اشتريته", "خمسمائة ريال"] },
  { id: "p48a", lessonNo: 48, prompt: "He is still ill.", slots: [["لا", "ما"], ["يزال", "زال"], ["مريضا", "مريض"]], example: "لَا يَزَالُ مَرِيضًا", wrong: ["هو مريض", "لا يزال", "ما زال"] },
  { id: "p49a", lessonNo: 49, prompt: "You must go.", slots: [["يجب"], ["عليك"], ["تذهب"]], example: "يَجِبُ عَلَيْكَ أَنْ تَذْهَبَ", wrong: ["أريد أن تذهب", "يجب عليك", "عليك أن تذهب"] },
  { id: "p50a", lessonNo: 50, prompt: "I slept yesterday.", slots: [["نمت"], ["أمس"]], example: "نِمْتُ أَمْسِ", wrong: ["نام أمس", "أنام أمس", "نمت"] },
  { id: "p51a", lessonNo: 51, prompt: "I called my friend.", slots: [["دعوت"], ["صديقي", "زميلي"]], example: "دَعَوْتُ صَدِيقِي", wrong: ["دعا صديقي", "دعوت", "أدعو صديقي"] },
  { id: "p52a", lessonNo: 52, prompt: "Count these copies! (to a man)", slots: [["عد", "اعدد"], ["هذه"], ["النسخ", "نسخ"]], example: "عُدَّ هَذِهِ النُّسَخَ", wrong: ["عددت هذه النسخ", "هذه النسخ", "عد"] },
  { id: "p53a", lessonNo: 53, prompt: "The two students went.", slots: [["الطالبان", "طالبان"], ["ذهبا"]], example: "الطَّالِبَانِ ذَهَبَا", wrong: ["الطالبان ذهبوا", "الطالبان ذهب", "ذهبا"] },
  { id: "p54a", lessonNo: 54, prompt: "I read a new book.", slots: [["قرأت"], ["كتابا"], ["جديدا"]], example: "قَرَأْتُ كِتَابًا جَدِيدًا", wrong: ["قرأت كتابا", "قرأت كتاب جديد", "كتابا جديدا"] },
];
