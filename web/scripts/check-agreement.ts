// Unit checks for the demonstrative–noun agreement detector (no network). Run: npm run check:agreement
import {
  changesDemonstrative,
  detectAgreementError,
  hasJudgeablePair,
  removeAgreementErrors,
  replyModelsFix,
  sameWords,
} from "@/lib/agreement";

let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}

/** Expect an error whose corrected sentence normalizes to `expected` (diacritics ignored). */
function expectFix(label: string, text: string, lesson: number, expected: string) {
  const got = detectAgreementError(text, lesson);
  check(got !== null && sameWords(got.corrected, expected), label, `got ${JSON.stringify(got)}`);
}
function expectNone(label: string, text: string, lesson: number) {
  const got = detectAgreementError(text, lesson);
  check(got === null, label, `got ${JSON.stringify(got)}`);
}

// --- errors that must be caught ---
expectFix("fem demonstrative + masc noun", "هذه كتاب", 1, "هذا كتاب");
expectFix("masc demonstrative + fem noun", "هذا بنت", 6, "هذه بنت");
expectFix("noun with ال", "هذه الكتاب", 1, "هذا الكتاب");
expectFix("far demonstrative, fem noun", "ذلك سيارة", 7, "تلك سيارة");
expectFix("far demonstrative, masc noun", "تلك بيت", 2, "ذلك بيت");
expectFix("ذاك is masculine", "ذاك سيارة", 7, "تلك سيارة");
expectFix("learner wrote ه for ة", "هذا مدرسه", 6, "هذه مدرسه");
expectFix("hamza spelling variants (أخت typed with a bare alef)", "هذا اخت", 6, "هذه اخت");
expectFix("learner typed tashkeel", "هَذِهِ كِتَابٌ", 1, "هذا كتاب");
expectFix("possessive suffix (lesson 10)", "هذه قلمك", 10, "هذا قلمك");
expectFix("fem noun + possessive (lesson 10)", "هذا سيارتي", 10, "هذه سيارتي");
expectFix("error in a later sentence", "هذا بيت. هذه قلم", 1, "هذا قلم");

// --- the correction keeps the rest of the learner's sentence and quotes only the faulty sentence ---
const two = detectAgreementError("هذا بيت. هذه قلم جميل", 3);
check(two?.original === "هذه قلم جميل", "quotes only the sentence with the error", JSON.stringify(two));
check(Boolean(two?.corrected.startsWith("هَذَا") && two.corrected.endsWith("قلم جميل")), "swaps only the demonstrative", JSON.stringify(two));

// --- must NOT fire ---
expectNone("never corrects into a feminine demonstrative before it is taught (lesson 5)", "هذا بنت", 5);
expectNone("never corrects into تلك before lesson 7", "ذلك سيارة", 6);
expectNone("never corrects into ذلك before lesson 2", "تلك بيت", 1);
expectNone("agreeing masculine", "هذا كتاب", 1);
expectNone("agreeing feminine", "هذه بنت", 6);
expectNone("agreeing far demonstrative", "تلك سيارة", 7);
expectNone("كتابة (writing) is not كتاب + suffix", "هذه كتابة", 10);
expectNone("possessive not judged before lesson 10", "هذه قلمك", 9);
expectNone("unknown noun", "هذه حقيبة", 1);
expectNone("noun not yet taught (مدرسة at lesson 1)", "هذا مدرسة", 1);
expectNone("ambiguous-gender noun (سوق) never judged", "هذه سوق", 4);
expectNone("adjective after demonstrative is not a noun", "هذا جميل", 3);
expectNone("no demonstrative", "الكتاب جميل", 3);
expectNone("Latin transliteration", "hadha kitab", 1);
expectNone("empty", "", 1);
expectNone("punctuation between demonstrative and noun", "هذا، كتاب", 1);

// --- helpers used by the pipeline ---
check(hasJudgeablePair("هذا كتاب", 1), "hasJudgeablePair: agreeing known pair");
check(!hasJudgeablePair("هذا حقيبة", 1), "hasJudgeablePair: unknown noun");
check(changesDemonstrative("هذه كتاب", "هذا كتاب"), "changesDemonstrative: swap detected");
check(!changesDemonstrative("هذا كتاب", "هذا كتاب جميل"), "changesDemonstrative: unchanged");

const err = detectAgreementError("هذه كتاب", 1)!;
check(replyModelsFix("هَذَا كِتَابٌ. وَمَا هَذِهِ؟", err), "replyModelsFix: reply restates the fix");
check(replyModelsFix("هَذَا الْكِتَابُ.", err), "replyModelsFix: tolerates ال");
check(!replyModelsFix("هَذِهِ كِتَابَةٌ.", err), "replyModelsFix: rejects the observed model failure");
check(!replyModelsFix("نَعَمْ، هَذَا بَابٌ.", err), "replyModelsFix: rejects an unrelated reply");

// --- several mismatches in one sentence are all fixed ---
const multi = detectAgreementError("هذه كتاب وهذا بنت", 6);
check(multi !== null && sameWords(multi.corrected, "هذا كتاب وهذه بنت"), "fixes every mismatch in the sentence", JSON.stringify(multi));

// --- fused و / ف prefix ("and this") ---
expectFix("fused و on the demonstrative", "وهذا بنت", 6, "وهذه بنت");
expectFix("fused و with tashkeel kept", "وَهَذَا بِنْتٌ", 6, "وهذه بنت");
expectFix("fused ف on a far demonstrative", "فذلك سيارة", 7, "فتلك سيارة");
expectNone("fused و, agreeing", "وهذه بنت", 6);
const fused = detectAgreementError("وهذا بنت", 6);
check(fused?.corrected.startsWith("وَهِذِهِ".slice(0, 1)) === true && fused.corrected.includes("هَذِهِ"), "prefix و is preserved in the correction", JSON.stringify(fused));
check(replyModelsFix("وَهَذِهِ بِنْتٌ.", detectAgreementError("هذا بنت", 6)!), "replyModelsFix: reply with fused وَ counts");

// --- sanitizing the buddy's own replies ---
check(removeAgreementErrors("هَذِهِ كِتَابٌ. وَمَا هَذَا؟", 1) === "وَمَا هَذَا؟", "drops only the mismatching sentence");
check(removeAgreementErrors("هَذَا كِتَابٌ. وَمَا هَذِهِ؟", 1) === "هَذَا كِتَابٌ. وَمَا هَذِهِ؟", "leaves a correct reply untouched");
check(removeAgreementErrors("هَذِهِ كِتَابٌ.", 1) === "", "returns empty when nothing is salvageable");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll agreement checks pass.");
