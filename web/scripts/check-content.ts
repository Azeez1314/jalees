// Fails if any scenario opener uses vocab above its lesson. Run: npm run check:content
import { cumulativeVocab, lessons } from "@/content/lessons";
import { scenarios } from "@/content/scenarios";
import { OPENER_AUDIO_DIR, openerAudioHash } from "@/lib/ai/opener-audio";
import { checkVocab } from "@/lib/vocab";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let failures = 0;

const audioDir = join(process.cwd(), OPENER_AUDIO_DIR);
const manifestPath = join(audioDir, "manifest.json");
const audioManifest: Record<string, string> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};

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
    continue;
  }
  // Pre-rendered opener audio must exist and match the current opener text + voice (npm run audio:openers).
  if (!existsSync(join(audioDir, `${s.id}.mp3`)) || audioManifest[s.id] !== openerAudioHash(s.openingLine)) {
    console.error(`✗ ${s.id}: opener audio is missing or stale — run npm run audio:openers`);
    failures++;
  } else {
    console.log(`✓ ${s.id}`);
  }
}

if (failures) {
  console.error(`\n${failures} scenario(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${scenarios.length} scenario openers are within their lesson's vocab and have up-to-date audio.`);
