// Renders each scenario's opening line once to public/audio/openers/<scenarioId>.mp3 (committed; served statically).
// Idempotent: skips scenarios whose text + voice config hash is unchanged, so re-running costs nothing.
// Run: npm run audio:openers   (add -- --force to re-render everything, e.g. after changing the voice)
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scenarios } from "@/content/scenarios";
import { OPENER_AUDIO_DIR, openerAudioHash } from "@/lib/ai/opener-audio";
import { synthesize } from "@/lib/ai/tts";

config({ path: ".env.local" });

async function main() {
  const force = process.argv.includes("--force");
  const dir = join(process.cwd(), OPENER_AUDIO_DIR);
  const manifestPath = join(dir, "manifest.json");
  mkdirSync(dir, { recursive: true });
  const manifest: Record<string, string> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};

  let rendered = 0;
  for (const s of scenarios) {
    const hash = openerAudioHash(s.openingLine);
    const file = join(dir, `${s.id}.mp3`);
    if (!force && manifest[s.id] === hash && existsSync(file)) {
      console.log(`= ${s.id} (unchanged)`);
      continue;
    }
    const { bytes } = await synthesize(s.openingLine);
    writeFileSync(file, bytes);
    manifest[s.id] = hash;
    rendered++;
    console.log(`+ ${s.id} (${(bytes.length / 1024).toFixed(0)} KB)`);
  }

  // Drop manifest entries for scenarios that no longer exist.
  for (const id of Object.keys(manifest)) if (!scenarios.some((s) => s.id === id)) delete manifest[id];
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nRendered ${rendered}, kept ${scenarios.length - rendered}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
