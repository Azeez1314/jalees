// Offline checks on the lesson tables themselves: gating of verbs / affixes / feminine forms, and the gender tables.
// Run: npm run check:lessons
import { FAR_FEMININE_FROM, FEMININE_FROM, cumulativeVerbs, cumulativeVocab, describePosition, lessons, normalizeArabic, positionOf } from "@/content/lessons";
import { cumulativeGenders, nounGenders } from "@/content/genders";
import { checkVocab } from "@/lib/vocab";
import { buildBuddySystemPrompt } from "@/lib/prompt";

let failed = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
};
/** `text` is fine at lesson `n` (no flagged tokens). */
const ok = (text: string, n: number, label = text) => {
  const v = checkVocab(text, cumulativeVocab(n));
  check(v.length === 0, `L${n} allows ${label}`, v.map((x) => x.token).join(", "));
};
/** `text` is flagged at lesson `n`. */
const no = (text: string, n: number, label = text) => {
  const v = checkVocab(text, cumulativeVocab(n));
  check(v.length > 0, `L${n} rejects ${label}`);
};

// ---- structure -------------------------------------------------------------------------------------------------
const books = [...new Set(lessons.map((l) => l.book))];
for (const b of books) {
  const nos = lessons.filter((l) => l.book === b).map((l) => l.lessonNo);
  check(nos.every((n, i) => n === i + 1), `Book ${b}: lessons are numbered 1..${nos.length} with no gaps`);
}
check(lessons.every((l, i) => l.position === i + 1), "global positions run 1..N across books");
check(lessons.filter((l) => l.book === 1).every((l) => l.position === l.lessonNo), "Book 1 positions equal their lesson numbers (nothing written against Book 1 moves)");
check(lessons.every((l) => l.newGrammar.length > 0), "every lesson has grammar notes");
check(lessons.every((l) => !l.newGrammar.some((g) => /\bهل\b/.test(g) && !/NOT used/.test(g))), "no grammar note teaches هل");

// ---- the book's pacing, spot-checked ---------------------------------------------------------------------------
ok("هَذَا بَيْتٌ. وَمَا هَذَا؟ مَنْ هَذَا؟", 1);
ok("أَهَذَا قَلَمٌ؟ نَعَمْ، هَذَا قَلَمٌ.", 1, "a yes/no question with أَ");
no("هَلْ هَذَا بَيْتٌ؟", 1, "هَلْ (the book uses أَ)");
no("هَلْ هَذَا بَيْتٌ؟", 10, "هَلْ even at lesson 10");
no("ذَلِكَ كَلْبٌ", 1, "ذلك before lesson 2");
ok("ذَلِكَ كَلْبٌ", 2);
no("الْقَلَمُ مَكْسُورٌ", 2, "an adjective before lesson 3");
ok("الْقَلَمُ مَكْسُورٌ", 3);
no("الْكِتَابُ فِي الْبَيْتِ", 3, "في before lesson 4");
ok("الْكِتَابُ فِي الْبَيْتِ. أَيْنَ هُوَ؟", 4);
no("هِيَ فِي الْمَدْرَسَةِ", 3, "هي before lesson 4");
ok("هِيَ فِي الْمَدْرَسَةِ", 4);
ok("يَا مُحَمَّدُ", 5);
no("يَا مُحَمَّدُ", 4, "يا before lesson 5");

// verbs: exact forms only
no("ذَهَبَ خَالِدٌ", 3, "ذهب before lesson 4");
ok("ذَهَبَ خَالِدٌ إِلَى الْمَدْرَسَةِ. خَرَجَ مِنَ الْبَيْتِ.", 4);
no("جَلَسَ الطَّالِبُ", 7, "جلس before lesson 8");
ok("جَلَسَ الطَّالِبُ", 8);
for (const bad of ["ذَهَبْتُ", "ذَهَبَتْ", "ذَهَبُوا", "يَذْهَبُ", "اذْهَبْ", "أَذْهَبُ", "أَذَهَبَ", "أُرِيدُ", "تُرِيدُ", "كَانَ"]) no(bad, 10, `${bad} (no other verb form is taught by lesson 10)`);
check(cumulativeVerbs(3).length === 0 && cumulativeVerbs(4).join() === "ذَهَبَ,خَرَجَ" && cumulativeVerbs(8).length === 3, "cumulativeVerbs follows the lessons");

// feminine
no("هَذِهِ سَيَّارَةٌ", FEMININE_FROM - 1, "هذه before lesson 6");
ok("هَذِهِ سَيَّارَةٌ جَدِيدَةٌ", FEMININE_FROM, "هذه + a feminine adjective at lesson 6");
no("جَدِيدَةٌ", FEMININE_FROM - 1, "a feminine adjective form before lesson 6");
no("تِلْكَ حَدِيقَةٌ", FAR_FEMININE_FROM - 1, "تلك before lesson 7");
ok("تِلْكَ حَدِيقَةٌ", FAR_FEMININE_FROM);
ok("الطَّالِبَةُ الْمُجْتَهِدَةُ", 9, "a feminine adjective introduced in lesson 9");
no("غَضْبَانَةٌ", 9, "a feminine form of an adjective that has none");

// prefixes
no("لِخَالِدٍ", 5, "the ل prefix before lesson 6");
ok("لِخَالِدٍ. لِمَنْ هَذَا؟ لِلْمُدِيرِ", 6);
// suffixes
no("كِتَابِي", 9, "a possessive suffix before lesson 10");
no("اِسْمُكَ", 9, "اسمك before lesson 10");
ok("كِتَابِي. اِسْمُكَ. أَخُوهَا. عِنْدِي قَلَمٌ. مَعَهُ كِتَابٌ.", 10);
no("بَيْتُنَا", 10, "ـنا (our) is not taught by lesson 10");
no("أَبْنَاؤُهُمْ", 10, "ـهم not taught by lesson 10");
no("كِتَابَانِ", 10, "a dual noun (taught in lesson 18)");

// closed-class always-allowed set no longer lets grammar words through early
no("أَيْنَ", 3, "أين before lesson 4");
no("أَنَا طَالِبٌ", 3, "أنا before lesson 4");
ok("السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ", 1, "the greeting at lesson 1".replace("allows", ""));
ok("مُمْتَازٌ! جَيِّدَةٌ! مَا شَاءَ اللَّهُ", 1, "praise from lesson 1");


// ---- lessons 11-23 -----------------------------------------------------------------------------------------------
no("أُحِبُّ أَبِي", 10, "أحب before lesson 11");
ok("أُحِبُّ أَبِي وَأُمِّي. فِيهَا نَافِذَةٌ. مَاذَا فِيهِ؟", 11);
no("ذَهَبَتْ فَاطِمَةُ", 11, "ذهبت (she went) before lesson 12");
ok("ذَهَبَتْ فَاطِمَةُ إِلَى الْمُسْتَشْفَى. كَيْفَ حَالُكَ؟ الْفَتَاةُ الَّتِي مَعَكَ", 12);
no("ذَهَبُوا إِلَى الْمَطْعَمِ", 12, "ذهبوا before lesson 13");
ok("الطُّلَّابُ ذَهَبُوا إِلَى الْمَطْعَمِ. هَؤُلَاءِ مُدَرِّسُونَ وَمُدَرِّسَاتٌ. أَبْنَاؤُهُمْ. أَبْنَائِي", 13);
no("هَؤُلَاءِ مُدَرِّسُونَ", 12, "a regular masculine plural before lesson 13");
no("بَيْتُهُمْ", 12, "ـهم before lesson 13");
no("بَيْتُنَا", 13, "ـنا before lesson 14");
ok("بَيْتُنَا. بَيْتُكُمْ. غُرْفَتُنَا. نَحْنُ مِنَ الْيَابَانِ. أَذَهَبْتُمْ؟ ذَهَبْنَا. أَيُّ يَوْمٍ هَذَا؟", 14);
no("أَذْهَبُ", 14, "أَذْهَبُ ('I go', present) even with the أ trick");
ok("أَذَهَبْتُمْ إِلَى الْمَسْجِدِ؟", 14, "a yes/no question with أ + a listed past form");
no("بَيْتُكُنَّ", 14, "ـكنّ before lesson 15");
ok("مَتَى ذَهَبْتُ؟ رَجَعْنَا قَبْلَ أُسْبُوعٍ. أَنْتُنَّ. بَيْتُكُنَّ", 15);
no("هَذِهِ كُتُبٌ جَدِيدَةٌ", 15, "كتب before lesson 16");
ok("هَذِهِ كُتُبٌ جَدِيدَةٌ. السَّيَّارَاتُ كَبِيرَةٌ. الْأَبْوَابُ مَفْتُوحَةٌ", 16);
no("كِتَابَانِ", 17, "a dual before lesson 18");
no("كَمْ أَخًا لَكَ؟", 17, "كم before lesson 18");
ok("كَمْ أَخًا لَكَ؟ كِتَابَانِ. نَافِذَتَانِ. هَذَانِ الطَّالِبَانِ. هَاتَانِ. أُخْتَانِ. عَيْنَانِ", 18);
no("ثَلَاثَةُ كُتُبٍ", 18, "numbers 3-10 before lesson 19");
ok("ثَلَاثَةُ كُتُبٍ. خَمْسَةُ أَقْلَامٍ. كَمْ ثَمَنُ هَذَا الْكِتَابِ؟ سَبْعَةُ رِيَالَاتٍ", 19);
no("ثَلَاثُ سَيَّارَاتٍ", 19, "the feminine number forms before lesson 20");
ok("ثَلَاثُ سَيَّارَاتٍ. ثَمَانِي مُدَرِّسَاتٍ. عَشْرُ حَافِلَاتٍ", 20);
no("ذَاكَ", 20, "ذاك before lesson 21");
ok("ذَاكَ الْمَكْتَبُ كَبِيرٌ وَلَكِنَّ الْكُرْسِيَّ صَغِيرٌ. أَمُغْلَقَةٌ أَمْ مَفْتُوحَةٌ؟ نُحِبُّهُ كَثِيرًا", 21);
no("قَلَمٌ أَزْرَقُ", 21, "colours before lesson 22");
ok("قَلَمٌ أَحْمَرُ وَمِنْدِيلٌ أَبْيَضُ. قَالَ يُوسُفُ. قَالَتْ فَاطِمَةُ. مَنَادِيلُ", 22);
no("هَاتِ يَا أُسْتَاذُ", 22, "هات before lesson 23");
ok("هَاتِ يَا أُسْتَاذُ. ذَهَبَ أَحْمَدُ إِلَى مَكَّةَ", 23);
check(cumulativeVerbs(11).includes("أُحِبُّ") && cumulativeVerbs(23).length === lessons.filter((l) => l.book === 1).flatMap((l) => l.newVerbs ?? []).length, "cumulativeVerbs follows the later lessons too");
check(buildBuddySystemPrompt(14, "g").includes("so no ") && !/so no [^)]*ذَهَبْنَا/.test(buildBuddySystemPrompt(14, "g")), "the prompt's 'do not change the form' examples exclude forms that ARE allowed");
check(buildBuddySystemPrompt(16, "g").includes("هَذِهِ كُتُبٌ جَدِيدَةٌ") && buildBuddySystemPrompt(18, "g").includes("هَذَانِ"), "later lessons add plural and dual agreement rules to the prompt");


// ---- Book 2: positions, generated verbs, object pronouns, ب ---------------------------------------------------------------
const B2 = (n: number) => positionOf(2, n);
check(B2(1) === 24 && describePosition(B2(4)) === "Book 2, Lesson 4", "Book 2 positions follow Book 1 (lesson 1 = position 24)");
no("إِنَّهُ تَاجِرٌ", 23, "إنّ before Book 2");
ok("إِنَّهُ تَاجِرٌ. لَعَلَّكَ بِخَيْرٍ. إِنَّنِي مِنَ الْهِنْدِ", B2(1));
no("بِمِائَةِ رُوبِيَّةٍ", 23, "the ب prefix before Book 2");
ok("بِمِائَةِ رُوبِيَّةٍ. لَيْسَ بِطَالِبٍ", B2(2), "بـ + noun (lesson 2)");
// the past tense unlocks person by person
no("فَتَحَ حَامِدٌ الْبَابَ", B2(4), "فتح before it is taught (lesson 5)");
ok("فَتَحَ حَامِدٌ الْبَابَ. فَتَحَتْ. فَتَحُوا. فَتَحْنَ. فَتَحْتُ. فَتَحْتَ", B2(5), "all lesson-4 persons of a lesson-5 verb");
no("فَتَحْنَا", B2(6), "'we opened' before lesson 7");
ok("فَتَحْنَا. فَتَحْتُمْ. فَتَحْتُنَّ. فَتَحْتِ", B2(7));
// object pronouns unlock separately
no("فَتَحْتُهُ", B2(4), "a verb + object pronoun before lesson 5");
ok("فَتَحْتُهُ. كَتَبْتُهَا. فَهِمُوهُ", B2(5), "object ه / ها");
no("رَأَيْتُهُمْ", B2(5), "object هم before lesson 6");
ok("رَأَيْتُهُمْ. رَأَيْتُهُنَّ. رَأَيْتُهَا", B2(6));
no("خَلَقَنِي", B2(8), "object ني before lesson 9");
ok("خَلَقَنِي. خَلَقَنَا. خَلَقَكَ. خَلَقَكُمْ. أَفَهِمْتُمُوهُ؟", B2(9));
// the present tense arrives in lesson 10, person by person
no("يَذْهَبُ أَبِي", B2(9), "the present before lesson 10");
ok("يَذْهَبُ أَبِي. تَذْهَبُ أُمِّي. أَذْهَبُ. لَا يَكْتُبُ", B2(10), "present he / she / I");
no("يَذْهَبُونَ", B2(10), "'they go' (present plural) — not taught by lesson 10");
ok("أَتَذْهَبُ؟ أَيَرْجِعُ؟", B2(10), "yes/no أ before a taught present form");
no("أَذْهَبُ إِلَى السُّوقِ", B2(9), "I go (present) before lesson 10");
// irregular verbs carry their own forms
ok("جَاءَ. جَاءَتْ. جَاؤُوا. جِئْتُ", B2(7), "jaa'a: all taught persons");
ok("رَأَيْتُ. رَأَوْا", B2(6), "ra'aa past");
ok("يَرَى. أَرَى", B2(10), "ra'aa present");
ok("كَانَ الْمُدَرِّسُ فِي الْفَصْلِ. كَانَتْ. كُنَّا", B2(7), "kaana");
ok("قَالَ. قَالَتْ. قُلْتُ. قَالُوا. قُلْنَ", B2(4), "qaala: hollow-verb shortening");
check(buildBuddySystemPrompt(B2(6), "g").includes("رَأَى") && buildBuddySystemPrompt(B2(6), "g").includes("Taught conjugations"), "the prompt lists the taught verbs and conjugations");
check(!buildBuddySystemPrompt(B2(6), "g").includes("@"), "no markers leak into the Book 2 prompt");


// ---- Book 2 lessons 11-31 ----------------------------------------------------------------------------------------------------
no("يَدْرُسُونَ", B2(10), "the present for 'they' before lesson 11");
ok("يَدْرُسُونَ. تَسْكُنُونَ. يَسْكُنَّ", B2(11), "present they / you (pl.) / they (f.)");
no("سَأَذْهَبُ", B2(10), "the future سـ before lesson 11");
ok("سَأَذْهَبُ. سَيَرْجِعُ. سَوْفَ أَكْتُبُ", B2(11), "the future");
no("تَذْهَبِينَ", B2(11), "the present for 'you (f.)' before lesson 12");
ok("تَذْهَبِينَ. تَلْعَبْنَ. نَلْعَبُ", B2(12), "the rest of the present");
no("اِجْلِسِي", B2(13), "a command (to a woman) before lesson 14");
ok("اِجْلِسْ. اِجْلِسِي. اِجْلِسُوا. اِجْلِسْنَ. اِفْتَحِ النَّافِذَةَ", B2(14), "commands");
ok("اِقْرَأْ. اِقْرَئِي. اِقْرَؤُوا", B2(14), "commands of a hamza-final verb");
ok("يَقْرَؤُونَ. تَقْرَئِينَ. يَقْرَأْنَ", B2(12), "present plural / f. of قرأ (hamza on waw / yaa')");
no("لَا تَجْلِسِي", B2(14), "'don't (f.)' before lesson 15");
ok("لَا تَجْلِسِي. لَا تَجْلِسُوا. لَا تَجْلِسْنَ", B2(15), "negative commands");
no("أُرِيدُ قَلَمًا", B2(15), "أريد before lesson 16");
ok("أُرِيدُ قَلَمًا أَزْرَقَ. تُرِيدِينَ. يُرِيدُونَ", B2(16), "wanting (أراد)");
no("اِشْتَرَيْتُ", B2(15), "اشترى before lesson 16");
ok("اِشْتَرَيْتُ. يَشْتَرِي. اِشْتَرِ. حَمْرَاءُ", B2(16), "buying (Form VIII) and feminine colours");
no("يَذْهَبُوا", B2(17), "the subjunctive for 'they' before lesson 18");
ok("أَنْ يَذْهَبُوا. أَنْ تَذْهَبِي. أَنْ تَذْهَبُوا", B2(18), "the subjunctive for 'they / you'");
no("لَنْ أَذْهَبَ", B2(18), "لن before lesson 19");
ok("لَنْ أَذْهَبَ. لَنْ يَرْجِعَ", B2(19), "لن");
no("الْقَمِيصَيْنِ", B2(19), "the dual in the oblique case before lesson 20");
ok("الْقَمِيصَيْنِ. قَلَمَيْنِ. أَحَدُهُمَا. الْمُدَرِّسِينَ", B2(20), "dual and plural endings in ين");
no("لَمْ يَأْتِ", B2(20), "لم + أتى before lesson 21");
ok("لَمْ يَذْهَبْ. لَمَّا يَحْضُرْ. لَمْ يَأْتِ", B2(21), "لم and لمّا");
ok("لِأَشْرَبَ. فَسَأَذْهَبُ. لِيَذْهَبَ", B2(17), "لـ / فـ before a verb");
ok("أَتُحِبُّ؟ أَتَسْكُنُ؟ أَيَذْهَبُ؟", B2(18), "yes/no أ before a three-letter present form");
no("يَجِبُ", B2(25), "وجب before lesson 26");
ok("يَجِبُ عَلَيْكَ. قِفْ. ضَعْ. يَصِلُ. يَقِفُ", B2(26), "verbs that start with و");
no("بِعْتُ", B2(26), "hollow-verb forms before lesson 27");
ok("نِمْتُ. بِعْتُ. زُرْتُ. خِفْتُ. يَبِيعُ. لَمْ يَنَمْ. نَمْ", B2(27), "hollow verbs");
no("دَعَوْتُ", B2(27), "defective-verb forms before lesson 28");
ok("دَعَوْتُ. رَمَيْتُ. يَرْمِي. يَدْعُو. اِمْشِ. لَمْ يَرْمِ. ادْعُ", B2(28), "defective verbs");
no("شَمَمْتُ", B2(28), "doubled-verb forms before lesson 29");
ok("شَمَمْتُ. يَشُمُّ. ظَنَّ. عُدَّ. رَدَدْتُ", B2(29), "doubled verbs");
no("ذَهَبَا", B2(29), "the dual of a verb before lesson 30");
ok("ذَهَبَا. ذَهَبَتَا. ذَهَبْتُمَا. يَذْهَبَانِ. اِذْهَبَا. لَنْ يَذْهَبَا", B2(30), "dual verbs");
ok("جِئْتُمَا. يَجِيئَانِ", B2(30), "jaa'a in the dual");
no("يَجِيئُونَ", B2(10), "jaa'a (present, they) before lesson 11");
ok("يَجِيءُ. تَجِيءُ. أَجِيءُ. جِئْتُ. جَاؤُوا", B2(10), "jaa'a through lesson 10");
ok("يَرَى. تَرَى. أَرَى. رَأَى. رَأَوْا", B2(10), "ra'aa through lesson 10");
ok("لَمْ يَرَ. لَمْ تَرَيْ", B2(21), "ra'aa in the jussive");
no("غَدًا", B2(9), "غدا before lesson 10");
check(buildBuddySystemPrompt(B2(14), "g").includes("command"), "the prompt describes the commands once they are taught");
check(!buildBuddySystemPrompt(B2(30), "g").includes("@"), "no markers leak into the lesson-30 prompt");


// ---- Book 3 lessons 1-15 -----------------------------------------------------------------------------------------------------
const B3 = (n: number) => positionOf(3, n);
check(B3(1) === 55 && describePosition(B3(3)) === "Book 3, Lesson 3", "Book 3 positions follow Book 2 (lesson 1 = position 55)");
no("هَلْ مِنْ سُؤَالٍ؟", B2(31), "هل (the book teaches it in Book 3, lesson 2)");
ok("هَلْ مِنْ سُؤَالٍ؟ هَلْ هَذَا بَيْتٌ؟", B3(2), "هل and the yes/no أ both");
check(buildBuddySystemPrompt(B3(1), "g").includes("Never use هَلْ") && buildBuddySystemPrompt(B3(2), "g").includes("or هَلْ"), "the prompt forbids هل until lesson 2, then allows both");
no("يَسْتَطِيعُ", B3(2), "يستطيع before it appears (lesson 3)");
ok("يَسْتَطِيعُ. أَتَسْتَطِيعُ؟ أَسْتَطِيعُ", B3(3), "يستطيع, also after the yes/no أ");
// passive
no("قِيلَ لِي", B2(31), "the passive قيل before lesson 3 of Book 3");
ok("قِيلَ لِي. يُبَاعُ. يُدْعَى. بُنِيَ. وُلِدْتُ. سُرِقَ كِتَابِي. تُفْتَحُ الْمَكْتَبَةُ", B3(3), "passive past and present, weak verbs included");
ok("لَمْ يُفْتَحْ. لَنْ يُقَالَ", B3(3), "passive jussive and subjunctive");
// participles
no("هَلْ مِنْ رَاسِبٍ؟", B3(3), "a participle before lesson 4");
ok("هَلْ مِنْ رَاسِبٍ؟ أَنَا ذَاهِبٌ. مَكْتُوبٌ. الذَّاهِبُونَ. كَاتِبَةٌ. الْمَفْتُوحُ", B3(4), "participles: the, plural and feminine");
ok("قَائِلٌ. بَائِعٌ. زَائِرٌ. دَاعٍ. الدَّاعِي. مَقُولٌ. مَبْنِيٌّ", B3(4), "participles of weak verbs");
check(checkVocab("فَتَحْنَا", cumulativeVocab(B2(6))).length > 0, "participle nouns do not let verb forms through the possessive suffixes ('we opened' before lesson 7)");
// names, months and plural nouns
ok("فِي شَهْرِ رَجَبٍ. رَمَضَانُ. الْمُحَرَّمُ", B3(3), "the Hijri months");
no("مَوْقِفٌ", B3(5), "a place noun before lesson 6");
ok("نَلْتَقِي فِي مَوْقِفِ السَّيَّارَاتِ. أَمُسْتَعِدُّونَ؟", B3(6), "meeting at the car park");
ok("لِيَجْلِسْ كُلُّ طَالِبٍ. لِنَقْرَأِ الدَّرْسَ", B3(13), "لام الأمر (لـ + the jussive)");
no("لَوْ دَرَسْتُ لَنَجَحْتُ", B3(11), "لو before lesson 12");
ok("لَوْ دَرَسْتُ لَنَجَحْتُ. لَاسْتَقْبَلْتُكَ", B3(12), "لو, and لـ before an exact verb");
ok("إِذَا جَاءَ فَقُلْ لَهُ. إِذَا وَجَدْتَ الْمَرِيضَ نَائِمًا فَلَا تُوقِظْهُ", B3(14), "إذا and فـ before a command");
no("مَهْمَا تَقُلْ", B3(14), "مهما before lesson 15");
ok("إِنْ تَدْرُسْ تَنْجَحْ. مَهْمَا تَقُلْ نَسْمَعْ. مَنْ جَاءَ فَلَا يَدْخُلْ حَتَّى يَسْتَأْذِنَ", B3(15), "conditions with the jussive");
check(!buildBuddySystemPrompt(B3(15), "g").includes("@"), "no markers leak into the lesson-15 prompt");
check(buildBuddySystemPrompt(B3(4), "g").includes("participle") && buildBuddySystemPrompt(B3(3), "g").includes("passive past"), "the prompt describes the passive (lesson 3) and the participles (lesson 4)");

// ---- gender tables ---------------------------------------------------------------------------------------------
const key = (w: string) => normalizeArabic(w).replace(/^ال(?=.)/, "");
for (const upto of [1, 5, 10, 16, 23, 28, 33, 40, 47, 54, 60, 69]) {
  const g = cumulativeGenders(upto);
  const m = new Set(g.masculine.map(key));
  const f = g.feminine.map(key);
  check(f.every((w) => !m.has(w)), `L${upto}: no noun is listed as both masculine and feminine`, f.filter((w) => m.has(w)).join(", "));
}
const vocabByLesson = new Map<number, Set<string>>();
for (const l of lessons) vocabByLesson.set(l.position, cumulativeVocab(l.position));
for (const [no, g] of Object.entries(nounGenders)) {
  const set = vocabByLesson.get(Number(no));
  const missing = set ? [...g.masculine, ...g.feminine].filter((w) => !set.has(normalizeArabic(w))) : ["(no such lesson)"];
  check(missing.length === 0, `gender table L${no} only lists words from the lesson's vocabulary`, missing.join(", "));
}

// ---- the prompt follows the lesson -----------------------------------------------------------------------------
const p3 = buildBuddySystemPrompt(3, "goal");
const p4 = buildBuddySystemPrompt(4, "goal");
const p6 = buildBuddySystemPrompt(6, "goal");
check(p3.includes("COMPLETELY FORBIDDEN") && !p3.includes("ONLY these exact verb forms"), "lesson 3 prompt bans every verb");
check(p4.includes("ONLY the following") && p4.includes("ذَهَبَ، خَرَجَ") && !p4.includes("COMPLETELY FORBIDDEN"), "lesson 4 prompt lists exactly the allowed verbs");
check(p3.includes("NOT taught yet") && !p6.includes("NOT taught yet"), "feminine هذه/تلك is withheld until lesson 6");
check(![p3, p4, p6].some((p) => p.includes("@")), "no affix markers leak into the prompt");
check(p4.includes("Never use هَلْ"), "the prompt tells the model to use أَ, not هَلْ");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll lesson checks pass.");
