// Export / deletion checks against the real DB with two throwaway learners (everything cleaned up). Run: npm run check:account
import { config } from "dotenv";
import { deleteUserData, exportUserData } from "@/lib/account";
import { sql } from "@/lib/db";
import { saveExchange } from "@/lib/queries";
import { addFact } from "@/lib/memory";
import { addUsage } from "@/lib/usage";
import { grantComp } from "@/lib/subscriptions";

config({ path: ".env.local" });

let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}

const buddy = (recast: { original: string; corrected: string; errorType: "gender_agreement" } | null) => ({
  textDiacritized: "هَذَا كِتَابٌ.", textDisplay: "هذا كتاب.", recast, promptRepeat: recast !== null, vocabFlags: [], retried: false, recastRejected: false,
});

async function seed(db: ReturnType<typeof sql>, user: string, marker: string) {
  await db`INSERT INTO profiles (user_id, display_name) VALUES (${user}, ${"Name " + marker})`;
  const [s] = await db`INSERT INTO sessions (user_id, scenario_id) VALUES (${user}, 'b1l1-around-the-house') RETURNING id`;
  await saveExchange(user, s.id, `هذه كتاب ${marker}`, { asrText: `هذه كتاب ${marker}`, seconds: 2 }, buddy({ original: `هذه كتاب ${marker}`, corrected: "هَذَا كِتَابٌ", errorType: "gender_agreement" }));
  await addFact(user, `Fact about ${marker}`, "learner");
  await addUsage(user, { stt: 5, tts: 7 });
  await db`INSERT INTO placement_attempts (user_id, answers) VALUES (${user}, '[]')`;
  await grantComp(user, null);
  return s.id as string;
}

async function main() {
  const db = sql();
  const tag = Math.random().toString(36).slice(2);
  const [A, B] = [`test-acct-a-${tag}`, `test-acct-b-${tag}`];
  const counts = async (u: string) =>
    (await db`SELECT
      (SELECT count(*) FROM profiles WHERE user_id = ${u})::int AS profiles,
      (SELECT count(*) FROM sessions WHERE user_id = ${u})::int AS sessions,
      (SELECT count(*) FROM turns t JOIN sessions s ON s.id = t.session_id WHERE s.user_id = ${u})::int AS turns,
      (SELECT count(*) FROM mistakes WHERE user_id = ${u})::int AS mistakes,
      (SELECT count(*) FROM memory_facts WHERE user_id = ${u})::int AS facts,
      (SELECT count(*) FROM usage_daily WHERE user_id = ${u})::int AS usage,
      (SELECT count(*) FROM placement_attempts WHERE user_id = ${u})::int AS placements,
      (SELECT count(*) FROM subscriptions WHERE user_id = ${u})::int AS subscriptions`)[0];

  try {
    await seed(db, A, `AAA${tag}`);
    await seed(db, B, `BBB${tag}`);
    const beforeA = await counts(A);
    const beforeB = await counts(B);
    check(Object.values(beforeA).every((n) => (n as number) >= 1), "setup: learner A has rows in every table", JSON.stringify(beforeA));

    // ---- export ------------------------------------------------------------------------------------------------------
    const exp = await exportUserData(A, "a@example.test");
    const text = JSON.stringify(exp);
    check(exp.account.userId === A && exp.account.email === "a@example.test", "export: identifies the account");
    check(exp.sessions.length === 1 && exp.turns.length === 2 && exp.mistakes.length === 1 && exp.memory.length === 1 && exp.voiceUsage.length === 1 && exp.placementAttempts.length === 1, "export: contains the learner's sessions, turns, mistakes, notes, usage and placements", JSON.stringify({ s: exp.sessions.length, t: exp.turns.length, m: exp.mistakes.length }));
    check(text.includes(`AAA${tag}`) && !text.includes(`BBB${tag}`), "export: includes A's data and NOTHING of learner B's");
    check(exp.turns.some((t) => t.input_mode === "voice" && t.asr_text) && !/audio_url|\.mp3|\.webm/.test(text), "export: voice turns carry the recognised text, and no audio exists to export");
    check(exp.subscription?.plan === "comp" && !("stripe_customer_id" in (exp.subscription ?? {})), "export: plan/status are included, internal payment ids are not");

    // ---- deletion ------------------------------------------------------------------------------------------------------
    const res = await deleteUserData(A);
    const afterA = await counts(A);
    check(Object.values(afterA).every((n) => n === 0), "delete: every one of A's rows is gone (all 8 tables)", JSON.stringify(afterA));
    check(res.deleted.sessions === 1 && res.deleted.profile === 1 && res.deleted.memory === 1, "delete: reports what it removed", JSON.stringify(res.deleted));
    const afterB = await counts(B);
    check(JSON.stringify(afterB) === JSON.stringify(beforeB) && Object.values(afterB).every((n) => (n as number) >= 1), "delete: learner B's data is completely untouched (every table has exactly the rows it had before)", `before ${JSON.stringify(beforeB)} after ${JSON.stringify(afterB)}`);
    check((await deleteUserData(A)).deleted.profile === 0, "delete: running it again is harmless");
    const empty = await exportUserData(A, null);
    check(empty.profile === null && empty.sessions.length === 0 && empty.turns.length === 0, "export after deletion: nothing left");
  } finally {
    for (const u of [A, B]) await deleteUserData(u);
  }
}

main()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll account checks pass.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
