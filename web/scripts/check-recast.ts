// Unit checks for the recast validator (no network). Run: npm run check:recast
import { isSafeRecast } from "@/lib/recast";

const cases: [string, string, number, boolean, string][] = [
  ["هذه كتاب", "هَذَا كِتَابٌ", 1, true, "demonstrative swap"],
  ["هذا بنت", "هَذِهِ بِنْتٌ", 1, true, "demonstrative swap (fem noun)"],
  ["هذه كتاب", "هَذِهِ كِتَابَةٌ", 1, false, "noun changed to another word (the observed model failure)"],
  ["هذه كتاب", "هَذِهِ كِتَابٌ", 1, false, "diacritics only — not a correction"],
  ["هذه سيارة جديد", "هَذِهِ السَّيَّارَةُ جَدِيدَةٌ", 2, true, "adjective gets feminine ة (ال added is ignored)"],
  ["هذا بيت جديدة", "هَذَا بَيْتٌ جَدِيدٌ", 2, true, "adjective loses feminine ة"],
  ["هذا قلم", "هَذَا مِفْتَاحٌ", 1, false, "different noun entirely"],
  ["هذا بيت", "هَذَا بَيْتٌ كَبِيرٌ", 2, false, "new content word added"],
];

let failed = 0;
for (const [orig, corr, lesson, expected, why] of cases) {
  const got = isSafeRecast(orig, corr, lesson);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${why}: "${orig}" -> "${corr}" => ${got}`);
}
if (failed) {
  console.error(`\n${failed} case(s) failed.`);
  process.exit(1);
}
console.log("\nAll recast validator cases pass.");
