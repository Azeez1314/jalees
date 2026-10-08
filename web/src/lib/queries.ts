import { sql } from "@/lib/db";
import type { Recap } from "@/lib/recap";
import { isBankable, mistakeKey } from "@/lib/review";
import type { Recast } from "@/lib/turn";

export type TashkeelPref = "full" | "none";

export interface Profile {
  userId: string;
  displayName: string | null;
  levelBook: number;
  levelLesson: number;
  tashkeelPref: TashkeelPref;
  /** End of the free trial (null only for rows that somehow predate billing; treated as no trial). */
  trialEndsAt: Date | null;
  /** When the learner finished the placement test (null = not yet). */
  placedAt: Date | null;
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
  trial_ends_at: string | Date | null;
  placed_at: string | Date | null;
}

function toProfile(r: ProfileRow): Profile {
  return {
    userId: r.user_id,
    displayName: r.display_name,
    levelBook: r.level_book,
    levelLesson: r.level_lesson,
    tashkeelPref: r.tashkeel_pref,
    trialEndsAt: r.trial_ends_at ? new Date(r.trial_ends_at) : null,
    placedAt: r.placed_at ? new Date(r.placed_at) : null,
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
    // Only real, checkable errors enter the review bank (not "other", not deletions). Repeating a mistake bumps times_seen
    // and restarts its ladder instead of creating a duplicate.
    ...(buddy.recast && isBankable(buddy.recast)
      ? [
          tx`INSERT INTO mistakes (user_id, session_id, error_type, original, corrected, key)
             VALUES (${userId}, ${sessionId}, ${buddy.recast.errorType}, ${buddy.recast.original}, ${buddy.recast.corrected},
                     ${mistakeKey(buddy.recast.corrected)})
             ON CONFLICT (user_id, key) WHERE key IS NOT NULL DO UPDATE SET
               times_seen = mistakes.times_seen + 1, last_seen_at = now(), session_id = EXCLUDED.session_id,
               original = EXCLUDED.original, review_count = 0, review_due_at = now() + interval '1 day'`,
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

export async function listRecentSessions(userId: string, limit = 5) {
  const rows = await sql()`
    SELECT s.id, s.scenario_id, s.started_at,
           (SELECT count(*) FROM turns t WHERE t.session_id = s.id AND t.role = 'learner')::int AS learner_turns,
           (s.recap IS NOT NULL) AS has_recap
    FROM sessions s WHERE s.user_id = ${userId} ORDER BY s.started_at DESC LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id as string,
    scenarioId: r.scenario_id as string,
    startedAt: r.started_at as string,
    learnerTurns: r.learner_turns as number,
    hasRecap: r.has_recap as boolean,
  }));
}

/** Distinct UTC days (YYYY-MM-DD, newest first) on which this learner sent at least one message. Feeds computeStreak. */
export async function getPracticeDays(userId: string): Promise<string[]> {
  const rows = await sql()`
    SELECT DISTINCT ((t.created_at AT TIME ZONE 'utc')::date)::text AS day
    FROM turns t JOIN sessions s ON s.id = t.session_id
    WHERE s.user_id = ${userId} AND t.role = 'learner'
    ORDER BY day DESC LIMIT 400`;
  return rows.map((r) => r.day as string);
}

/** The saved recap for one of this user's sessions, or null if it hasn't been generated yet. */
export async function getRecap(userId: string, sessionId: string): Promise<Recap | null> {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const rows = await sql()`SELECT recap FROM sessions WHERE id = ${sessionId} AND user_id = ${userId}`;
  return rows.length ? ((rows[0].recap as Recap | null) ?? null) : null;
}

/**
 * Saves the recap and marks the session ended — but only if none is saved yet. Returns false if another request got there
 * first (callers then return the saved one), which keeps recap generation idempotent under double-clicks.
 */
export async function saveRecap(userId: string, sessionId: string, recap: Recap): Promise<boolean> {
  const rows = await sql()`
    UPDATE sessions SET recap = ${JSON.stringify(recap)}::jsonb, ended_at = COALESCE(ended_at, now())
    WHERE id = ${sessionId} AND user_id = ${userId} AND recap IS NULL RETURNING id`;
  return rows.length > 0;
}

export async function countVoiceTurns(sessionId: string): Promise<number> {
  const rows = await sql()`
    SELECT count(*)::int AS n FROM turns WHERE session_id = ${sessionId} AND role = 'learner' AND input_mode = 'voice'`;
  return rows[0].n as number;
}

/** The most recent recap's "next step" (shown as a one-line welcome-back on /learn). */
export async function getLatestNextStep(userId: string): Promise<string | null> {
  const rows = await sql()`
    SELECT recap->>'nextStep' AS next FROM sessions
    WHERE user_id = ${userId} AND recap IS NOT NULL ORDER BY started_at DESC LIMIT 1`;
  return rows.length ? ((rows[0].next as string | null) ?? null) : null;
}
