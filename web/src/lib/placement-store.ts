import { placementItems, type PlacementItem } from "@/content/placement";
import { sql } from "@/lib/db";
import { isFinished, nextItem, placeLearner, scoreAnswer, type ItemResult, type Placement } from "@/lib/placement";

interface StoredAnswer extends ItemResult {
  answer: string;
}

export interface AttemptState {
  attemptId: string;
  /** The question to ask now (null when placement is over). */
  item: PlacementItem | null;
  /** 1-based number of the current question. */
  index: number;
  done: boolean;
  placement: Placement | null;
}

const UUID = /^[0-9a-f-]{36}$/i;

function stateOf(attemptId: string, answers: StoredAnswer[], placement: Placement | null): AttemptState {
  const done = isFinished(answers);
  return { attemptId, item: done ? null : nextItem(answers), index: answers.length + 1, done, placement: done ? (placement ?? placeLearner(answers)) : null };
}

async function load(userId: string, attemptId: string): Promise<{ answers: StoredAnswer[]; finished: boolean; placement: Placement | null } | null> {
  if (!UUID.test(attemptId)) return null;
  const rows = await sql()`SELECT answers, finished_at, result_lesson, beyond_content FROM placement_attempts WHERE id = ${attemptId} AND user_id = ${userId}`;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    answers: r.answers as StoredAnswer[],
    finished: r.finished_at !== null,
    placement: r.result_lesson !== null ? { lesson: r.result_lesson as number, beyondContent: r.beyond_content as boolean } : null,
  };
}

/** Starts a placement test, or resumes the learner's unfinished one (so a refresh doesn't restart it). */
export async function startAttempt(userId: string): Promise<AttemptState> {
  const open = await sql()`SELECT id FROM placement_attempts WHERE user_id = ${userId} AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1`;
  const attemptId = open.length ? (open[0].id as string) : ((await sql()`INSERT INTO placement_attempts (user_id) VALUES (${userId}) RETURNING id`)[0].id as string);
  const loaded = await load(userId, attemptId);
  return stateOf(attemptId, loaded?.answers ?? [], null);
}

/**
 * Scores the learner's answer to the CURRENT question (chosen by the server, never by the client) and advances.
 * `index` is the 1-based question number the client believes it is answering. If that isn't the current question (a double-click,
 * a retry, a stale tab) the answer is ignored and the current state is returned — otherwise a duplicate submission would be
 * scored against the NEXT question and could fail the learner for nothing.
 */
export async function submitAnswer(userId: string, attemptId: string, answer: string, index: number): Promise<AttemptState | null> {
  const loaded = await load(userId, attemptId);
  if (!loaded) return null;
  if (loaded.finished || index !== loaded.answers.length + 1) return stateOf(attemptId, loaded.answers, loaded.placement);

  const item = nextItem(loaded.answers);
  if (!item) return stateOf(attemptId, loaded.answers, loaded.placement);

  const entry: StoredAnswer = { itemId: item.id, lessonNo: item.lessonNo, pass: scoreAnswer(item, answer), answer: answer.slice(0, 300) };
  const answers = [...loaded.answers, entry];

  // Append only if nobody else has answered this question in the meantime.
  const appended = await sql()`
    UPDATE placement_attempts SET answers = answers || ${JSON.stringify([entry])}::jsonb
    WHERE id = ${attemptId} AND user_id = ${userId} AND finished_at IS NULL AND jsonb_array_length(answers) = ${loaded.answers.length}
    RETURNING id`;
  if (!appended.length) {
    const again = await load(userId, attemptId);
    return again ? stateOf(attemptId, again.answers, again.placement) : null;
  }

  if (!isFinished(answers)) return stateOf(attemptId, answers, null);

  const placement = placeLearner(answers);
  await sql().transaction((tx) => [
    tx`UPDATE placement_attempts SET finished_at = now(), result_lesson = ${placement.lesson}, beyond_content = ${placement.beyondContent}
       WHERE id = ${attemptId} AND user_id = ${userId} AND finished_at IS NULL`,
    tx`UPDATE profiles SET level_lesson = ${placement.lesson}, placed_at = now() WHERE user_id = ${userId}`,
  ]);
  return stateOf(attemptId, answers, placement);
}

export const TOTAL_ITEMS = placementItems.length;
