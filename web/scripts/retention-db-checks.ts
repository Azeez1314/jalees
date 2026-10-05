// DB integration checks for Phase 3, run by check-retention.ts with throwaway user ids (everything is deleted afterwards).
import { sql } from "@/lib/db";
import { MAX_FACTS } from "@/lib/facts";
import { addFact, deleteAllFacts, deleteFact, listFacts, pickFactsForSession } from "@/lib/memory";
import { applyReview, countDueMistakes, getDueMistakes, getOwnMistake, getPromptMistakes } from "@/lib/mistake-bank";
import { getPracticeDays, saveExchange } from "@/lib/queries";
import { utcDay } from "@/lib/streak";
import type { Recast } from "@/lib/turn";

type Check = (ok: boolean, label: string, detail?: string) => void;

const buddy = (recast: Recast | null) => ({
  textDiacritized: "هَذَا كِتَابٌ.",
  textDisplay: "هذا كتاب.",
  recast,
  promptRepeat: recast !== null,
  vocabFlags: [],
  retried: false,
  recastRejected: false,
});

export async function runDbChecks(check: Check) {
  const db = sql();
  const suffix = Math.random().toString(36).slice(2);
  const user = `test-retention-${suffix}`;
  const stranger = `test-retention-other-${suffix}`;
  const sessions: string[] = [];
  const newSession = async (u: string) => {
    const [s] = await db`INSERT INTO sessions (user_id, scenario_id) VALUES (${u}, 'b1l1-around-the-house') RETURNING id`;
    sessions.push(s.id);
    return s.id as string;
  };

  try {
    // ---- mistake bank: dedupe + eligibility ---------------------------------------------------------------------
    const s1 = await newSession(user);
    const gender: Recast = { original: "هذه كتاب", corrected: "هَذَا كِتَابٌ", errorType: "gender_agreement" };
    await saveExchange(user, s1, "هذه كتاب", null, buddy(gender));
    let rows = await db`SELECT times_seen, review_count, review_due_at > now() AS due_later FROM mistakes WHERE user_id = ${user}`;
    check(rows.length === 1 && rows[0].times_seen === 1 && rows[0].due_later, "a bankable recast creates one mistake due in the future", JSON.stringify(rows));

    await saveExchange(user, s1, "هذه الكتاب", null, buddy({ ...gender, original: "هذه الكتاب", corrected: "هَذَا الْكِتَابُ" }));
    rows = await db`SELECT times_seen FROM mistakes WHERE user_id = ${user}`;
    check(rows.length === 1 && rows[0].times_seen === 2, "the same mistake again bumps times_seen, no duplicate row", JSON.stringify(rows));

    await saveExchange(user, s1, "جلس الولد في الفصل", null, buddy({ original: "جلس الولد في الفصل", corrected: "الْوَلَدُ فِي الْفَصْلِ", errorType: "other" }));
    await saveExchange(user, s1, "نعم", null, buddy(null));
    rows = await db`SELECT count(*)::int AS n FROM mistakes WHERE user_id = ${user}`;
    check(rows[0].n === 1, "non-bankable recasts and plain turns add no mistake rows");

    await db`INSERT INTO mistakes (user_id, session_id, error_type, original, corrected, review_due_at) VALUES (${user}, ${s1}, 'other', 'legacy', 'legacy', now() - interval '5 days')`;
    check((await getDueMistakes(user)).length === 0, "legacy rows (NULL key) are never reviewed");

    // ---- ladder -------------------------------------------------------------------------------------------------
    check((await countDueMistakes(user)) === 0, "a fresh mistake is not due yet (first review is a day later)");
    await db`UPDATE mistakes SET review_due_at = now() - interval '1 hour' WHERE user_id = ${user} AND key IS NOT NULL`;
    const due = await getDueMistakes(user);
    check(due.length === 1 && (await countDueMistakes(user)) === 1, "it becomes due once its time passes");
    check((await getPromptMistakes(user)).length === 1, "due mistakes are offered to the buddy");

    const days = async () =>
      Number((await db`SELECT extract(epoch FROM (review_due_at - now())) / 86400 AS d FROM mistakes WHERE id = ${due[0].id}`)[0].d);
    let st = await applyReview(user, due[0], true);
    check(st.reviewCount === 1 && Math.abs((await days()) - 3) < 0.01, "correct review #1 → next in 3 days");
    st = await applyReview(user, { ...due[0], reviewCount: 1 }, true);
    check(st.reviewCount === 2 && Math.abs((await days()) - 7) < 0.01, "correct review #2 → next in 7 days");
    st = await applyReview(user, { ...due[0], reviewCount: 2 }, true);
    check(st.reviewCount === 3 && Math.abs((await days()) - 21) < 0.01, "correct review #3 → next in 21 days");
    st = await applyReview(user, { ...due[0], reviewCount: 3 }, true);
    check(st.mastered, "correct review #4 → mastered");
    await db`UPDATE mistakes SET review_due_at = now() - interval '1 hour' WHERE id = ${due[0].id}`;
    check((await countDueMistakes(user)) === 0 && (await getPromptMistakes(user)).length === 0, "mastered mistakes leave the queue and the prompt");

    // a wrong answer later restarts the ladder
    await db`UPDATE mistakes SET review_count = 2 WHERE id = ${due[0].id}`;
    st = await applyReview(user, { ...due[0], reviewCount: 2 }, false);
    check(st.reviewCount === 0 && Math.abs((await days()) - 1) < 0.01, "a wrong answer restarts at 1 day");

    check((await getOwnMistake(user, due[0].id)) !== null, "owner can load their mistake");
    check((await getOwnMistake(stranger, due[0].id)) === null, "another user cannot");
    check((await getOwnMistake(user, "not-a-uuid")) === null, "malformed ids are rejected");

    // ---- memory facts -------------------------------------------------------------------------------------------
    const a = await addFact(user, "Learning Arabic for Umrah in March", "learner");
    check(a.ok && a.fact !== null && a.fact.source === "learner", "a fact is stored", JSON.stringify(a));
    const dup = await addFact(user, "learning arabic for umrah in march!", "conversation");
    check(dup.ok && dup.fact === null, "the same fact (case/punctuation differ) is not stored twice");
    const bad = await addFact(user, "write to me at a@b.com", "learner");
    check(!bad.ok, "contact details are refused");
    check((await listFacts(user)).length === 1, "exactly one fact so far");

    for (let i = 1; i < MAX_FACTS; i++) await addFact(user, `Fact number ${i} about the learner`, "learner");
    check((await listFacts(user)).length === MAX_FACTS, `fills up to the cap of ${MAX_FACTS}`);
    const over = await addFact(user, "One fact too many", "learner");
    check(!over.ok && /up to/.test(over.error), "the cap is enforced", JSON.stringify(over));
    check((await listFacts(stranger)).length === 0, "another user's list is separate");

    const picks = async (sid: string) => (await pickFactsForSession(user, sid, 3)).join("|");
    const sA = await newSession(user);
    check((await picks(sA)) === (await picks(sA)), "the picked facts are stable within a session");
    const variants = new Set<string>();
    for (let i = 0; i < 4; i++) variants.add(await picks(await newSession(user)));
    check(variants.size > 1, "different sessions pick different facts (rotation)");
    check((await pickFactsForSession(user, sA, 3)).length === 3, "picks the requested number");

    const first = (await listFacts(user))[0];
    check(!(await deleteFact(stranger, first.id)), "another user cannot delete it");
    check(await deleteFact(user, first.id), "owner can delete one fact");
    check((await deleteAllFacts(user)) === MAX_FACTS - 1, "forget-everything removes the rest");
    check((await listFacts(user)).length === 0, "nothing remains");

    // ---- practice days (streak input) ---------------------------------------------------------------------------
    const days2 = await getPracticeDays(user);
    check(days2.includes(utcDay()), "today shows up as a practice day", days2.join(","));
    check((await getPracticeDays(stranger)).length === 0, "a user with no turns has no practice days");
  } finally {
    await db`DELETE FROM memory_facts WHERE user_id IN (${user}, ${stranger})`;
    await db`DELETE FROM mistakes WHERE user_id IN (${user}, ${stranger})`;
    for (const id of sessions) await db`DELETE FROM sessions WHERE id = ${id}`; // cascades to turns
  }
}
