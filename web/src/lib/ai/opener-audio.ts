import { createHash } from "node:crypto";
import { TTS_FINGERPRINT } from "@/lib/ai/tts";

/** Where pre-rendered scenario-opener audio lives (served statically; free to play and not charged to the voice cap). */
export const OPENER_AUDIO_DIR = "public/audio/openers";

/** Changes whenever the opener text or the voice configuration changes — see scripts/generate-opener-audio.ts. */
export function openerAudioHash(openingLine: string): string {
  return createHash("sha256").update(`${openingLine}\n${TTS_FINGERPRINT}`).digest("hex").slice(0, 16);
}
