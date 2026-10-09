// Offline checks on the lesson tables themselves: gating of verbs / affixes / feminine forms, and the gender tables.
// Run: npm run check:lessons
import { FAR_FEMININE_FROM, FEMININE_FROM, cumulativeVerbs, cumulativeVocab, lessons, normalizeArabic } from "@/content/lessons";
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
check(lessons.every((l, i) => l.lessonNo === i + 1), "lessons are numbered 1..N with no gaps");
check(lessons.every((l) => l.book === 1), "all lessons are Book 1");
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
check(cumulativeVerbs(11).includes("أُحِبُّ") && cumulativeVerbs(23).length === lessons.flatMap((l) => l.newVerbs ?? []).length, "cumulativeVerbs follows the later lessons too");
check(buildBuddySystemPrompt(14, "g").includes("so no ") && !/so no [^)]*ذَهَبْنَا/.test(buildBuddySystemPrompt(14, "g")), "the prompt's 'do not change the form' examples exclude forms that ARE allowed");
check(buildBuddySystemPrompt(16, "g").includes("هَذِهِ كُتُبٌ جَدِيدَةٌ") && buildBuddySystemPrompt(18, "g").includes("هَذَانِ"), "later lessons add plural and dual agreement rules to the prompt");

// ---- gender tables ---------------------------------------------------------------------------------------------
const key = (w: string) => normalizeArabic(w).replace(/^ال(?=.)/, "");
for (const upto of [1, 5, 10, 16, 23]) {
  const g = cumulativeGenders(upto);
  const m = new Set(g.masculine.map(key));
  const f = g.feminine.map(key);
  check(f.every((w) => !m.has(w)), `L${upto}: no noun is listed as both masculine and feminine`, f.filter((w) => m.has(w)).join(", "));
}
const vocabByLesson = new Map<number, Set<string>>();
for (const l of lessons) vocabByLesson.set(l.lessonNo, cumulativeVocab(l.lessonNo));
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
check(p4.includes("ONLY these exact verb forms: ذَهَبَ، خَرَجَ") && !p4.includes("COMPLETELY FORBIDDEN"), "lesson 4 prompt lists exactly the allowed verbs");
check(p3.includes("NOT taught yet") && !p6.includes("NOT taught yet"), "feminine هذه/تلك is withheld until lesson 6");
check(![p3, p4, p6].some((p) => p.includes("@")), "no affix markers leak into the prompt");
check(p4.includes("Never use هَلْ"), "the prompt tells the model to use أَ, not هَلْ");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll lesson checks pass.");
