// Server-side voice checks without a human: TTS -> STT round trip through the real providers, MIME mapping, the
// seconds estimate against measured audio, and /api/tts's turn-ownership rule against the real DB (throwaway rows).
// Costs a fraction of a cent. Run: npm run check:voice
import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeArabic } from "@/content/lessons";
import { synthesize } from "@/lib/ai/tts";
import { extensionFor, transcribe } from "@/lib/ai/stt";
import { sql } from "@/lib/db";
import { getOwnBuddyTurnText } from "@/lib/queries";

config({ path: ".env.local" });

let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}
const plain = (s: string) => normalizeArabic(s).replace(/[^ء-ي ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  // MIME -> extension (what browsers' MediaRecorder actually produces)
  check(extensionFor("audio/webm;codecs=opus") === "webm", "Chrome/Firefox recording type maps to webm");
  check(extensionFor("audio/mp4") === "mp4", "Safari recording type maps to mp4");
  check(extensionFor("application/pdf") === null, "non-audio types are rejected");

  // Real provider round trip
  const sentence = "هَذَا بَابٌ. وَمَا هَذَا؟";
  const tts = await synthesize(sentence);
  check(tts.contentType === "audio/mpeg" && tts.bytes.length > 2000, "TTS returns mp3 bytes", `${tts.bytes.length} bytes`);
  const dir = mkdtempSync(join(tmpdir(), "jalees-voice-"));
  try {
    const file = join(dir, "t.mp3");
    writeFileSync(file, tts.bytes);
    const measured = Number(execFileSync("afinfo", [file], { encoding: "utf8" }).match(/estimated duration:\s*([\d.]+)/)?.[1]);
    const ratio = tts.estSeconds / measured;
    check(ratio > 0.6 && ratio < 1.6, "seconds estimate is within the right ballpark of real audio", `est ${tts.estSeconds.toFixed(1)}s vs measured ${measured.toFixed(1)}s`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const heard = await transcribe({ bytes: tts.bytes, contentType: tts.contentType });
  check(plain(heard.text) === plain(sentence), "STT hears back what TTS said", `heard "${heard.text}"`);

  // /api/tts ownership rule
  const owner = `test-voice-${Math.random().toString(36).slice(2)}`;
  const stranger = `test-voice-${Math.random().toString(36).slice(2)}`;
  const db = sql();
  const [s] = await db`INSERT INTO sessions (user_id, scenario_id) VALUES (${owner}, 'b1l1-what-is-this') RETURNING id`;
  try {
    const [buddy] = await db`INSERT INTO turns (session_id, role, text_display, text_diacritized) VALUES (${s.id}, 'buddy', 'هذا باب', 'هَذَا بَابٌ') RETURNING id`;
    const [learner] = await db`INSERT INTO turns (session_id, role, text_display, text_diacritized) VALUES (${s.id}, 'learner', 'نعم', 'نعم') RETURNING id`;
    check((await getOwnBuddyTurnText(owner, buddy.id)) === "هَذَا بَابٌ", "owner can fetch their buddy turn's text");
    check((await getOwnBuddyTurnText(stranger, buddy.id)) === null, "another user cannot");
    check((await getOwnBuddyTurnText(owner, learner.id)) === null, "learner turns are not speakable");
    check((await getOwnBuddyTurnText(owner, "not-a-uuid")) === null, "malformed ids are rejected");
    check((await getOwnBuddyTurnText(owner, "00000000-0000-0000-0000-000000000000")) === null, "unknown ids return null");
  } finally {
    await db`DELETE FROM sessions WHERE id = ${s.id}`; // cascades to its turns
  }
}

main()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll voice checks pass.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
