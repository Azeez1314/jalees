// Fails if any scenario opener uses vocab above its lesson. Run: npm run check:content
import { cumulativeVocab, lessons } from "@/content/lessons";
import { scenarios } from "@/content/scenarios";
import { checkVocab } from "@/lib/vocab";

let failures = 0;

for (const s of scenarios) {
  if (!lessons.some((l) => l.lessonNo === s.lessonNo)) {
    console.error(`✗ ${s.id}: no lesson ${s.lessonNo}`);
    failures++;
    continue;
  }
  const violations = checkVocab(s.openingLine, cumulativeVocab(s.lessonNo));
  if (violations.length) {
    console.error(`✗ ${s.id} (lesson ${s.lessonNo}): ${violations.map((v) => v.token).join(", ")}`);
    failures++;
  } else {
    console.log(`✓ ${s.id}`);
  }
}

if (failures) {
  console.error(`\n${failures} scenario(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${scenarios.length} scenario openers are within their lesson's vocab.`);
