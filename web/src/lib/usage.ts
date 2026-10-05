import { sql } from "@/lib/db";

/** Voice minutes a learner gets per UTC day (spec: 10-minute daily session cap; controls STT/TTS spend). */
export const DAILY_CAP_SECONDS = 600;

export interface Usage {
  sttSeconds: number;
  ttsSeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
}

/** Pure so it can be checked offline. */
export function summarizeUsage(sttSeconds: number, ttsSeconds: number): Usage {
  const usedSeconds = sttSeconds + ttsSeconds;
  return { sttSeconds, ttsSeconds, usedSeconds, remainingSeconds: Math.max(0, DAILY_CAP_SECONDS - usedSeconds) };
}

// float8 casts: the Neon driver returns numeric columns as strings.
const TODAY = "(now() AT TIME ZONE 'utc')::date";

export async function getUsage(userId: string): Promise<Usage> {
  const rows = await sql().query(
    `SELECT stt_seconds::float8 AS stt, tts_seconds::float8 AS tts FROM usage_daily WHERE user_id = $1 AND day = ${TODAY}`,
    [userId]
  );
  return rows.length ? summarizeUsage(rows[0].stt, rows[0].tts) : summarizeUsage(0, 0);
}

/** Atomically adds seconds to today's row (creating it if needed) and returns the new totals. */
export async function addUsage(userId: string, delta: { stt?: number; tts?: number }): Promise<Usage> {
  const stt = Math.max(0, delta.stt ?? 0);
  const tts = Math.max(0, delta.tts ?? 0);
  const rows = await sql().query(
    `INSERT INTO usage_daily (user_id, day, stt_seconds, tts_seconds) VALUES ($1, ${TODAY}, $2, $3)
     ON CONFLICT (user_id, day) DO UPDATE
       SET stt_seconds = usage_daily.stt_seconds + EXCLUDED.stt_seconds,
           tts_seconds = usage_daily.tts_seconds + EXCLUDED.tts_seconds
     RETURNING stt_seconds::float8 AS stt, tts_seconds::float8 AS tts`,
    [userId, stt, tts]
  );
  return summarizeUsage(rows[0].stt, rows[0].tts);
}
