// DB integration checks for the placement flow (throwaway users, cleaned up). Run by check-placement.ts.
import { maxContentLesson } from "@/lib/placement";
import { placementItems } from "@/content/placement";
import { sql } from "@/lib/db";
import { startAttempt, submitAnswer } from "@/lib/placement-store";

type Check = (ok: boolean, label: string, detail?: string) => void;

export async function runPlacementDb(check: Check) {
  const db = sql();
  const tag = Math.random().toString(36).slice(2);
  const [U1, U2, U3, STRANGER] = [`test-place-1-${tag}`, `test-place-2-${tag}`, `test-place-3-${tag}`, `test-place-x-${tag}`];
  const good = (i: number) => placementItems[i].example;
  // The first lesson-3 item (index k): a learner who answers everything before it correctly, then misses it, is placed at lesson 3.
  const k = placementItems.findIndex((i) => i.lessonNo === 3);
  const top = maxContentLesson();
  const lessonOf = async (u: string) => (await db`SELECT level_lesson, placed_at FROM profiles WHERE user_id = ${u}`)[0];

  try {
    for (const u of [U1, U2, U3]) await db`INSERT INTO profiles (user_id, level_lesson) VALUES (${u}, 1)`;

    // ---- a learner who misses at lesson 3 -----------------------------------------------------------------------------
    let s = await startAttempt(U1);
    check(s.item?.id === placementItems[0].id && s.index === 1 && !s.done, "start: the first question is asked");
    const resumed = await startAttempt(U1);
    check(resumed.attemptId === s.attemptId && resumed.index === 1, "start again (e.g. a page refresh) resumes the same attempt");

    for (let i = 0; i < k; i++) s = (await submitAnswer(U1, s.attemptId, good(i), i + 1))!; // everything before lesson 3 correct
    check(s.item?.id === placementItems[k].id && s.index === k + 1 && !s.done, "right answers so far → the first lesson 3 question is next");
    s = (await submitAnswer(U1, s.attemptId, "hello", k + 1))!; // misses
    check(s.done && s.placement?.lesson === 3 && !s.placement.beyondContent, "the first miss ends the test and places the learner at that lesson (3)", JSON.stringify(s.placement));
    const p1 = await lessonOf(U1);
    check(p1.level_lesson === 3 && p1.placed_at !== null, "the profile is updated with the lesson and the placement time");
    const rec = (await db`SELECT finished_at, result_lesson, answers FROM placement_attempts WHERE id = ${s.attemptId}`)[0];
    check(rec.finished_at !== null && rec.result_lesson === 3 && (rec.answers as unknown[]).length === k + 1, "the attempt is stored with its answers");
    const after = await submitAnswer(U1, s.attemptId, good(k + 1), k + 2);
    check(after?.done === true && after.placement?.lesson === 3 && (await db`SELECT jsonb_array_length(answers) AS n FROM placement_attempts WHERE id = ${s.attemptId}`)[0].n === k + 1, "answering after the test is over changes nothing");
    const fresh = await startAttempt(U1);
    check(fresh.attemptId !== s.attemptId && fresh.index === 1, "a finished test can be retaken (a new attempt starts from question 1)");

    // ---- an absolute beginner ----------------------------------------------------------------------------------------
    const b = await startAttempt(U2);
    const bd = (await submitAnswer(U2, b.attemptId, "hello", 1))!;
    check(bd.done && bd.placement?.lesson === 1, "a learner who can't answer the first question starts at lesson 1 after ONE question (no spiral)");

    // ---- a learner who answers everything -----------------------------------------------------------------------------
    let t = await startAttempt(U3);
    for (let i = 0; i < placementItems.length; i++) t = (await submitAnswer(U3, t.attemptId, good(i), i + 1))!;
    check(t.done && t.placement?.lesson === top && t.placement.beyondContent, `answering everything → lesson ${top} and 'beyond content'`, JSON.stringify(t.placement));
    check((await lessonOf(U3)).level_lesson === top, `…and the profile says lesson ${top}`);

    // ---- double submit & ownership ---------------------------------------------------------------------------------
    const d = await startAttempt(STRANGER);
    await db`INSERT INTO profiles (user_id) VALUES (${STRANGER})`;
    const [x, y] = await Promise.all([submitAnswer(STRANGER, d.attemptId, good(0), 1), submitAnswer(STRANGER, d.attemptId, good(0), 1)]);
    const stored = (await db`SELECT jsonb_array_length(answers) AS n FROM placement_attempts WHERE id = ${d.attemptId}`)[0].n;
    check(stored === 1 && x !== null && y !== null, "a double-submit of question 1 (both say index 1) records it once", `stored=${stored}`);
    check((await submitAnswer(STRANGER, d.attemptId, good(0), 1))?.index === 2, "…and a late duplicate after that is ignored: still on question 2");
    check((await db`SELECT jsonb_array_length(answers) AS n FROM placement_attempts WHERE id = ${d.attemptId}`)[0].n === 1, "…it was NOT scored against question 2");
    check((await submitAnswer(STRANGER, d.attemptId, good(1), 5))?.index === 2, "an answer claiming a future question number is ignored");
    check((await submitAnswer(U1, d.attemptId, "x", 1)) === null, "someone else's attempt id is not found");
    check((await submitAnswer(U1, "not-a-uuid", "x", 1)) === null, "a malformed attempt id is not found");
  } finally {
    for (const u of [U1, U2, U3, STRANGER]) {
      await db`DELETE FROM placement_attempts WHERE user_id = ${u}`;
      await db`DELETE FROM profiles WHERE user_id = ${u}`;
    }
  }
}
