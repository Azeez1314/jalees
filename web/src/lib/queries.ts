import { sql } from "@/lib/db";
import type { PastMistake } from "@/lib/prompt";
import type { Recast } from "@/lib/turn";

export type TashkeelPref = "full" | "none";

export interface Profile {
  userId: string;
  displayName: string | null;
  levelBook: number;
  levelLesson: number;
  tashkeelPref: TashkeelPref;
}

export interface StoredTurn {
  id: string;
  role: "learner" | "buddy";
  transcriptRaw: string | null;
  textDisplay: string;
  textDiacritized: string;
  recast: Recast | null;
  promptRepeat: boolean;
}

export interface SessionRow {
  id: string;
  userId: string;
  scenarioId: string;
  startedAt: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  level_book: number;
  level_lesson: number;
  tashkeel_pref: TashkeelPref;
}

function toProfile(r: ProfileRow): Profile {
  return {
    userId: r.user_id,
    displayName: r.display_name,
    levelBook: r.level_book,
    levelLesson: r.level_lesson,
    tashkeelPref: r.tashkeel_pref,
  };
}

export async function getOrCreateProfile(userId: string, displayName: string | null): Promise<Profile> {
  const rows = await sql()`
    INSERT INTO profiles (user_id, display_name) VALUES (${userId}, ${displayName})
    ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
    RETURNING *`;
  return toProfile(rows[0] as ProfileRow);
}

export async function updateProfile(
  userId: string,
  patch: { levelLesson?: number; tashkeelPref?: TashkeelPref }
): Promise<void> {
  await sql()`
    UPDATE profiles SET
      level_lesson = COALESCE(${patch.levelLesson ?? null}, level_lesson),
      tashkeel_pref = COALESCE(${patch.tashkeelPref ?? null}, tashkeel_pref)
    WHERE user_id = ${userId}`;
}

/** Creates the session and the buddy's opening turn atomically. Returns the new session id. */
export async function createSession(
  userId: string,
  scenarioId: string,
  opening: { textDiacritized: string; textDisplay: string }
): Promise<string> {
  // One statement, so the session never exists without its opening line.
  const rows = await sql()`
    WITH s AS (
      INSERT INTO sessions (user_id, scenario_id) VALUES (${userId}, ${scenarioId}) RETURNING id
    )
    INSERT INTO turns (session_id, role, text_display, text_diacritized)
    SELECT id, 'buddy', ${opening.textDisplay}, ${opening.textDiacritized} FROM s
    RETURNING session_id`;
  return rows[0].session_id as string;
}

/** Returns the session only if it belongs to this user. */
export async function getSession(userId: string, sessionId: string): Promise<SessionRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const rows = await sql()`
    SELECT id, user_id, scenario_id, started_at FROM sessions
    WHERE id = ${sessionId} AND user_id = ${userId}`;
  if (!rows.length) return null;
  const r = rows[0];
  return { id: r.id, userId: r.user_id, scenarioId: r.scenario_id, startedAt: r.started_at };
}

export async function getTurns(sessionId: string): Promise<StoredTurn[]> {
  const rows = await sql()`
    SELECT id, role, transcript_raw, text_display, text_diacritized, recast, prompt_repeat
    FROM turns WHERE session_id = ${sessionId} ORDER BY created_at, id`;
  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    transcriptRaw: r.transcript_raw,
    textDisplay: r.text_display,
    textDiacritized: r.text_diacritized,
    recast: r.recast,
    promptRepeat: r.prompt_repeat,
  }));
}

export interface VoiceInput {
  /** What the speech-to-text heard, before the learner edited/confirmed it. */
  asrText: string;
  seconds: number;
}

/**
 * Saves the learner's message, the buddy's reply and (if recast) the mistake in one transaction.
 * Returns the buddy turn's id (the client needs it to request that turn's audio).
 */
export async function saveExchange(
  userId: string,
  sessionId: string,
  learnerText: string,
  voice: VoiceInput | null,
  buddy: {
    textDiacritized: string;
    textDisplay: string;
    recast: Recast | null;
    promptRepeat: boolean;
    vocabFlags: string[];
    retried: boolean;
    recastRejected: boolean;
  }
): Promise<string> {
  const results = await sql().transaction((tx) => [
    tx`INSERT INTO turns (session_id, role, transcript_raw, text_display, text_diacritized, input_mode, asr_text, audio_seconds)
       VALUES (${sessionId}, 'learner', ${learnerText}, ${learnerText}, ${learnerText},
               ${voice ? "voice" : "text"}, ${voice?.asrText ?? null}, ${voice?.seconds ?? null})`,
    tx`INSERT INTO turns (session_id, role, text_display, text_diacritized, recast, prompt_repeat, vocab_flags, retried, recast_rejected)
       VALUES (
         ${sessionId}, 'buddy', ${buddy.textDisplay}, ${buddy.textDiacritized},
         ${buddy.recast ? JSON.stringify(buddy.recast) : null}::jsonb,
         ${buddy.promptRepeat}, ${JSON.stringify(buddy.vocabFlags)}::jsonb, ${buddy.retried}, ${buddy.recastRejected})
       RETURNING id`,
    ...(buddy.recast
      ? [
          tx`INSERT INTO mistakes (user_id, session_id, error_type, original, corrected)
             VALUES (${userId}, ${sessionId}, ${buddy.recast.errorType}, ${buddy.recast.original}, ${buddy.recast.corrected})`,
        ]
      : []),
  ]);
  return results[1][0].id as string;
}

/** The diacritized text of a buddy turn, only if it belongs to one of this user's sessions (so /api/tts can't speak arbitrary text). */
export async function getOwnBuddyTurnText(userId: string, turnId: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(turnId)) return null;
  const rows = await sql()`
    SELECT t.text_diacritized FROM turns t JOIN sessions s ON s.id = t.session_id
    WHERE t.id = ${turnId} AND t.role = 'buddy' AND s.user_id = ${userId}`;
  return rows.length ? (rows[0].text_diacritized as string) : null;
}

export async function getRecentMistakes(userId: string, limit = 5): Promise<PastMistake[]> {
  const rows = await sql()`
    SELECT original, corrected, error_type FROM mistakes
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`;
  // Learner-authored text goes into a prompt: cap its length.
  return rows.map((r) => ({
    original: String(r.original).slice(0, 120),
    corrected: String(r.corrected).slice(0, 120),
    errorType: r.error_type,
  }));
}

export async function listRecentSessions(userId: string, limit = 5) {
  const rows = await sql()`
    SELECT s.id, s.scenario_id, s.started_at,
           (SELECT count(*) FROM turns t WHERE t.session_id = s.id AND t.role = 'learner')::int AS learner_turns
    FROM sessions s WHERE s.user_id = ${userId} ORDER BY s.started_at DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id as string,
    scenarioId: r.scenario_id as string,
    startedAt: r.started_at as string,
    learnerTurns: r.learner_turns as number,
  }));
}
