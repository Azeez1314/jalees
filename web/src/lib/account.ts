import { sql } from "@/lib/db";
import { getSubscription } from "@/lib/subscriptions";

/** Everything the app holds about one learner, as plain JSON (the "Download my data" file). Only that learner's rows. */
export async function exportUserData(userId: string, email: string | null) {
  const db = sql();
  const [profile, sessions, turns, mistakes, facts, usage, placements, subscription] = await Promise.all([
    db`SELECT display_name, level_book, level_lesson, tashkeel_pref, trial_ends_at, placed_at, created_at FROM profiles WHERE user_id = ${userId}`,
    db`SELECT id, scenario_id, started_at, ended_at, recap FROM sessions WHERE user_id = ${userId} ORDER BY started_at`,
    db`SELECT t.session_id, t.role, t.transcript_raw, t.text_display, t.text_diacritized, t.recast, t.input_mode, t.asr_text, t.audio_seconds, t.created_at
       FROM turns t JOIN sessions s ON s.id = t.session_id WHERE s.user_id = ${userId} ORDER BY t.created_at`,
    db`SELECT error_type, original, corrected, times_seen, review_count, review_due_at, created_at FROM mistakes WHERE user_id = ${userId} ORDER BY created_at`,
    db`SELECT fact, source, created_at FROM memory_facts WHERE user_id = ${userId} ORDER BY created_at`,
    db`SELECT day, stt_seconds, tts_seconds FROM usage_daily WHERE user_id = ${userId} ORDER BY day`,
    db`SELECT started_at, finished_at, result_lesson, beyond_content, answers FROM placement_attempts WHERE user_id = ${userId} ORDER BY started_at`,
    getSubscription(userId),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    note: "Everything Jalees stores about you. Voice recordings are never stored — only the text that was recognised.",
    account: { userId, email },
    profile: profile[0] ?? null,
    sessions,
    turns,
    mistakes,
    memory: facts,
    voiceUsage: usage,
    placementAttempts: placements,
    subscription: subscription && { plan: subscription.plan, status: subscription.status, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd, currentPeriodEnd: subscription.currentPeriodEnd },
  };
}

export interface DeletionResult {
  deleted: Record<string, number>;
}

/**
 * Deletes every row the app holds for this learner (the caller cancels any Stripe subscription first and removes the auth
 * account). Child tables go with their sessions; subscriptions/usage/placement/profile are removed explicitly. Stripe's own
 * invoice records are retained by Stripe as the law requires and are not ours to delete.
 */
export async function deleteUserData(userId: string): Promise<DeletionResult> {
  const db = sql();
  const count = async (q: Promise<unknown[]>) => (await q).length;
  const deleted: Record<string, number> = {};
  deleted.memory = await count(db`DELETE FROM memory_facts WHERE user_id = ${userId} RETURNING id`);
  deleted.mistakes = await count(db`DELETE FROM mistakes WHERE user_id = ${userId} RETURNING id`);
  deleted.sessions = await count(db`DELETE FROM sessions WHERE user_id = ${userId} RETURNING id`); // cascades to turns
  deleted.voiceUsage = await count(db`DELETE FROM usage_daily WHERE user_id = ${userId} RETURNING day`);
  deleted.placements = await count(db`DELETE FROM placement_attempts WHERE user_id = ${userId} RETURNING id`);
  deleted.subscriptions = await count(db`DELETE FROM subscriptions WHERE user_id = ${userId} RETURNING user_id`);
  deleted.profile = await count(db`DELETE FROM profiles WHERE user_id = ${userId} RETURNING user_id`);
  return { deleted };
}
