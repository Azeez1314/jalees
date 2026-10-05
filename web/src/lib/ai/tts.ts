import OpenAI from "openai";
import { stripTashkeel } from "@/lib/arabic";

/** Swap vendors here only (docs/architecture.md: every external AI service sits behind a thin interface). */
// The undated alias isn't in this key's model list, so fall back to the dated id; remember whichever works.
const TTS_MODELS = ["gpt-4o-mini-tts", "gpt-4o-mini-tts-2025-12-15"];
const VOICE = "marin";

const INSTRUCTIONS =
  "Speak Modern Standard Arabic (Fus'ha), slowly and clearly, like a patient teacher talking to a beginner. " +
  "Pronounce every short vowel and the case ending (i'rab) at the end of each word exactly as written. " +
  "Pause briefly between sentences. Do not use any dialect.";

/** Identifies the voice configuration; pre-rendered audio is stale when this (or the text) changes. */
export const TTS_FINGERPRINT = `${VOICE}|${INSTRUCTIONS}`;

/** Measured in the Step 0 spike: 82 s of audio over 375 Arabic letters ≈ 0.22 s/letter. Used to charge the daily cap. */
const SECONDS_PER_LETTER = 0.22;
const MAX_CHARS = 600;

export function estimateSeconds(text: string): number {
  const letters = stripTashkeel(text).match(/[ء-ي]/g)?.length ?? 0;
  return Math.max(1, letters * SECONDS_PER_LETTER);
}

let client: OpenAI | null = null;
const openai = () => (client ??= new OpenAI());
let preferred = 0;

/** Text to speech. Always feed the fully diacritized text (spec: diacritized text goes to TTS). */
export async function synthesize(text: string): Promise<{ bytes: Buffer; contentType: string; estSeconds: number }> {
  if (!text.trim() || text.length > MAX_CHARS) throw new Error("Text to speak must be 1-600 characters");

  let lastError: unknown;
  for (let i = preferred; i < TTS_MODELS.length; i++) {
    try {
      const res = await openai().audio.speech.create({
        model: TTS_MODELS[i],
        voice: VOICE,
        input: text,
        instructions: INSTRUCTIONS,
        response_format: "mp3",
      });
      preferred = i;
      return { bytes: Buffer.from(await res.arrayBuffer()), contentType: "audio/mpeg", estSeconds: estimateSeconds(text) };
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number }).status;
      if (status !== 403 && status !== 404) throw err; // only "no access to this model id" falls through to the next id
    }
  }
  throw lastError;
}
