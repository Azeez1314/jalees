// Unit checks for praise rate-limiting (no network). Run: npm run check:praise
import { containsPraise, limitPraise, stripPraise } from "@/lib/praise";

let failed = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
};
const eq = (got: string, want: string, label: string) => check(got === want, label, `got "${got}" want "${want}"`);

eq(stripPraise("مُمْتَازٌ! هَذَا مِفْتَاحٌ. وَمَا هَذَا؟"), "هَذَا مِفْتَاحٌ. وَمَا هَذَا؟", "an all-praise opening sentence is dropped");
eq(stripPraise("صَحِيحٌ، هَذَا بَابٌ. وَمَا هَذَا؟"), "هَذَا بَابٌ. وَمَا هَذَا؟", "praise + comma then content in the same sentence");
eq(stripPraise("نَعَمْ، مُمْتَازٌ. هَذَا كِتَابٌ."), "هَذَا كِتَابٌ.", "'نعم، praise.' is dropped");
eq(stripPraise("مَا شَاءَ اللَّهُ! هَذَا بَيْتٌ."), "هَذَا بَيْتٌ.", "ما شاء الله is dropped as a unit");
eq(stripPraise("مَبْرُوكٌ! هَلْ أَنْتَ طَالِبٌ؟"), "هَلْ أَنْتَ طَالِبٌ؟", "مبروك is dropped");
eq(stripPraise("جَيِّدَةٌ! هَذِهِ سَيَّارَةٌ."), "هَذِهِ سَيَّارَةٌ.", "a feminine praise adjective is dropped");
eq(stripPraise("هَلْ هَذَا صَحِيحٌ؟"), "هَلْ هَذَا صَحِيحٌ؟", "'correct' inside a question is NOT praise and is kept");
eq(stripPraise("هَذَا بَابٌ جَيِّدٌ."), "هَذَا بَابٌ جَيِّدٌ.", "an adjective describing a noun is kept");
eq(stripPraise("مُمْتَازٌ!"), "مُمْتَازٌ!", "if nothing else would be left, the original is kept");
eq(stripPraise("هَذَا بَابٌ. وَمَا هَذَا؟"), "هَذَا بَابٌ. وَمَا هَذَا؟", "text without praise is untouched");

check(containsPraise("مُمْتَازٌ! هَذَا بَابٌ."), "containsPraise: detects an opener");
check(!containsPraise("هَلْ هَذَا صَحِيحٌ؟"), "containsPraise: ignores non-opener use");

const praised = "مُمْتَازٌ! هَذَا بَابٌ.";
const plain = "هَذَا بَابٌ. وَمَا هَذَا؟";
eq(limitPraise(praised, [], false), praised, "allowed when there is no history");
eq(limitPraise(praised, [plain, plain, plain], false), praised, "allowed after three praise-free replies");
eq(limitPraise(praised, [plain, "صَحِيحٌ! هَذَا قَلَمٌ.", plain], false), "هَذَا بَابٌ.", "blocked when one of the last three replies praised");
eq(limitPraise(praised, [praised, plain, plain, plain], false), praised, "an old praise (4 replies back) no longer blocks");
eq(limitPraise(praised, [plain, plain, plain], true), "هَذَا بَابٌ.", "never alongside a correction");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll praise checks pass.");
