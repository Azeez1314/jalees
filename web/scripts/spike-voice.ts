// Step 0 spike: is OpenAI TTS/STT usable for Arabic? Renders lesson sentences with gpt-4o-mini-tts, round-trips the audio
// through gpt-4o-mini-transcribe, and measures durations. Costs well under 1 cent. Run: npm run spike:voice
// Output: .spike-audio/*.mp3 (listen to them!) and .spike-audio/results.md
import { config } from "dotenv";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import OpenAI, { toFile } from "openai";
import { normalizeArabic } from "@/content/lessons";
import { stripTashkeel } from "@/lib/arabic";

config({ path: ".env.local" });

const OUT = join(process.cwd(), ".spike-audio");
const TTS_MODELS = ["gpt-4o-mini-tts", "gpt-4o-mini-tts-2025-12-15"]; // the alias isn't in this key's model list; fall back to the dated id
const STT_MODEL = "gpt-4o-mini-transcribe";

const INSTRUCTIONS =
  "Speak Modern Standard Arabic (Fus'ha), slowly and clearly, like a patient teacher talking to a beginner. " +
  "Pronounce every short vowel and the case ending (i'rab) at the end of each word exactly as written. " +
  "Pause briefly between sentences. Do not use any dialect.";

const SENTENCES: { id: string; lesson: number; text: string }[] = [
  { id: "l1-greeting", lesson: 1, text: "السَّلَامُ عَلَيْكُمْ. هَذَا بَابٌ. وَمَا هَذَا؟" },
  { id: "l1-people", lesson: 1, text: "هَذِهِ بِنْتٌ وَهَذَا وَلَدٌ." },
  { id: "l2-size", lesson: 2, text: "هَذَا الْبَيْتُ كَبِيرٌ. وَذَلِكَ الْبَيْتُ صَغِيرٌ." },
  { id: "l3-key", lesson: 3, text: "هَلْ هَذَا مِفْتَاحُ السَّيَّارَةِ؟" },
  { id: "l4-where", lesson: 4, text: "أَيْنَ الْكِتَابُ؟ هَلْ هُوَ عَلَى الطَّاوِلَةِ؟" },
  { id: "l5-pens", lesson: 5, text: "عِنْدِي ثَلَاثَةُ أَقْلَامٍ. وَهَلْ عِنْدَكَ قَلَمٌ؟" },
];

const VARIANTS = [
  { id: "marin-guided", voice: "marin", instructions: INSTRUCTIONS },
  { id: "cedar-guided", voice: "cedar", instructions: INSTRUCTIONS },
  { id: "marin-plain", voice: "marin", instructions: undefined },
];

const client = new OpenAI();

async function synthesize(text: string, voice: string, instructions: string | undefined) {
  let lastError: unknown;
  for (const model of TTS_MODELS) {
    try {
      const res = await client.audio.speech.create({ model, voice, input: text, instructions, response_format: "mp3" });
      return { bytes: Buffer.from(await res.arrayBuffer()), model };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function transcribe(bytes: Buffer): Promise<string> {
  const file = await toFile(bytes, "sample.mp3", { type: "audio/mpeg" });
  const res = await client.audio.transcriptions.create({ file, model: STT_MODEL, language: "ar" });
  return res.text;
}

/** macOS only: duration in seconds via afinfo. */
function durationSeconds(path: string): number {
  const out = execFileSync("afinfo", [path], { encoding: "utf8" });
  const m = out.match(/estimated duration:\s*([\d.]+)/);
  return m ? Number(m[1]) : NaN;
}

const words = (s: string) =>
  normalizeArabic(s)
    .replace(/[^ء-ي\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Word error rate: word-level Levenshtein distance / reference length. */
function wer(reference: string, hypothesis: string): number {
  const r = words(reference);
  const h = words(hypothesis);
  const d = Array.from({ length: r.length + 1 }, (_, i) => [i, ...Array(h.length).fill(0)]);
  for (let j = 1; j <= h.length; j++) d[0][j] = j;
  for (let i = 1; i <= r.length; i++)
    for (let j = 1; j <= h.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1));
  return r.length ? d[r.length][h.length] / r.length : 0;
}

const letterCount = (s: string) => (stripTashkeel(s).match(/[ء-ي]/g) ?? []).length;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const rows: string[] = [];
  let secondsTotal = 0;
  let lettersTotal = 0;
  let werSum = 0;
  let n = 0;
  let ttsModelUsed = "";

  for (const s of SENTENCES) {
    for (const v of VARIANTS) {
      const { bytes, model } = await synthesize(s.text, v.voice, v.instructions);
      ttsModelUsed = model;
      const path = join(OUT, `${s.id}-${v.id}.mp3`);
      writeFileSync(path, bytes);
      const seconds = durationSeconds(path);
      const heard = await transcribe(bytes);
      const e = wer(s.text, heard);
      secondsTotal += seconds;
      lettersTotal += letterCount(s.text);
      werSum += e;
      n++;
      rows.push(`| ${s.id} | ${v.id} | ${seconds.toFixed(1)} | ${(e * 100).toFixed(0)}% | ${s.text} | ${heard} |`);
      console.log(`${s.id} ${v.id}: ${seconds.toFixed(1)}s, WER ${(e * 100).toFixed(0)}%  heard: ${heard}`);
    }
  }

  const perLetter = secondsTotal / lettersTotal;
  const summary = [
    `# Voice spike results`,
    ``,
    `TTS model: ${ttsModelUsed} · STT model: ${STT_MODEL} (language=ar, no prompt)`,
    `Clips: ${n} · mean WER (TTS audio → STT vs original text): ${((werSum / n) * 100).toFixed(1)}%`,
    `Measured speech rate: ${perLetter.toFixed(3)} s per Arabic letter (${secondsTotal.toFixed(0)} s over ${lettersTotal} letters)`,
    ``,
    `| sentence | variant | seconds | WER | original | STT heard |`,
    `|---|---|---|---|---|---|`,
    ...rows,
  ].join("\n");
  writeFileSync(join(OUT, "results.md"), summary);
  console.log(`\n${summary.split("\n").slice(2, 5).join("\n")}\nAudio + results.md in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
