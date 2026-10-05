import OpenAI, { toFile } from "openai";

/** Swap vendors here only (docs/architecture.md: every external AI service sits behind a thin interface). */
const STT_MODEL = "gpt-4o-mini-transcribe";

/** The API infers the audio format from the file name, so map the recorder's MIME type to an extension. */
const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "mp4",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
};

export function extensionFor(contentType: string): string | null {
  return EXTENSIONS[contentType.split(";")[0].trim().toLowerCase()] ?? null;
}

let client: OpenAI | null = null;
const openai = () => (client ??= new OpenAI());

/**
 * Speech to text for Fus'ha. `language: "ar"` only — deliberately NO vocabulary `prompt`: biasing the recogniser toward
 * the lesson's words would make it "fix" learner mistakes, which is exactly the error-normalization risk the confirm
 * step exists to expose.
 */
export async function transcribe(audio: { bytes: Uint8Array; contentType: string }): Promise<{ text: string }> {
  const ext = extensionFor(audio.contentType);
  if (!ext) throw new Error(`Unsupported audio type: ${audio.contentType}`);
  const file = await toFile(audio.bytes, `recording.${ext}`, { type: audio.contentType });
  const res = await openai().audio.transcriptions.create({ file, model: STT_MODEL, language: "ar" });
  return { text: res.text.trim() };
}
