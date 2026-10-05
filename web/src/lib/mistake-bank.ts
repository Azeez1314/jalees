import { nextReview, type ReviewState } from "@/lib/review";
import { sql } from "@/lib/db";
import type { PastMistake } from "@/lib/prompt";

export interface BankedMistake {
  id: string;
  errorType: string;
  /** What the learner wrote. */
  original: string;
  /** The verified correction. */
  corrected: string;
  timesSeen: number;
  reviewCount: number;
}

// Rows with a NULL key predate the bank (Phase 3) and are never reviewed; review_count >= 4 means mastered.
const LIVE = "key IS NOT NULL AND review_count < 4";

function toBanked(r: Record<string, unknown>): BankedMistake {
  return {
    id: r.id as string,
    errorType: r.error_type as string,
    original: r.original as string,
    corrected: r.corrected as string,
    timesSeen: r.times_seen as number,
    reviewCount: r.review_count as number,
  };
}

/** Mistakes whose review is due now, most overdue first. */
export async function getDueMistakes(userId: string, limit = 5): Promise<BankedMistake[]> {
  const rows = await sql().query(
    `SELECT id, error_type, original, corrected, times_seen, review_count FROM mistakes
     WHERE user_id = $1 AND ${LIVE} AND review_due_at <= now() ORDER BY review_due_at LIMIT $2`,
    [userId, limit]
  );
  return rows.map(toBanked);
}

export async function countDueMistakes(userId: string): Promise<number> {
  const rows = await sql().query(
    `SELECT count(*)::int AS n FROM mistakes WHERE user_id = $1 AND ${LIVE} AND review_due_at <= now()`,
    [userId]
  );
  return rows[0].n as number;
}

/** When the next not-yet-due review comes up (null if nothing is scheduled). */
export async function getNextDueAt(userId: string): Promise<string | null> {
  const rows = await sql().query(
    `SELECT min(review_due_at) AS next FROM mistakes WHERE user_id = $1 AND ${LIVE} AND review_due_at > now()`,
    [userId]
  );
  return (rows[0].next as string | null) ?? null;
}

/** Mistakes to steer the conversation toward (so the learner gets a natural chance to retry): due ones first, then upcoming. */
export async function getPromptMistakes(userId: string, limit = 5): Promise<PastMistake[]> {
  const rows = await sql().query(
    `SELECT original, corrected, error_type FROM mistakes
     WHERE user_id = $1 AND ${LIVE}
     ORDER BY (review_due_at <= now()) DESC, review_due_at LIMIT $2`,
    [userId, limit]
  );
  // Learner-authored text goes into a prompt: cap its length.
  return rows.map((r) => ({
    original: String(r.original).slice(0, 120),
    corrected: String(r.corrected).slice(0, 120),
    errorType: r.error_type as string,
  }));
}

export async function getOwnMistake(userId: string, mistakeId: string): Promise<BankedMistake | null> {
  if (!/^[0-9a-f-]{36}$/i.test(mistakeId)) return null;
  const rows = await sql().query(
    `SELECT id, error_type, original, corrected, times_seen, review_count FROM mistakes
     WHERE id = $1 AND user_id = $2 AND key IS NOT NULL`,
    [mistakeId, userId]
  );
  return rows.length ? toBanked(rows[0]) : null;
}

/** Records a review answer and reschedules the mistake on the ladder. */
export async function applyReview(userId: string, mistake: BankedMistake, correct: boolean): Promise<ReviewState> {
  const state = nextReview(mistake.reviewCount, correct);
  await sql().query(
    `UPDATE mistakes SET review_count = $3, last_reviewed_at = now(),
       review_due_at = CASE WHEN $4::int IS NULL THEN review_due_at ELSE now() + ($4::int * interval '1 day') END
     WHERE id = $1 AND user_id = $2`,
    [mistake.id, userId, state.reviewCount, state.nextInDays]
  );
  return state;
}
