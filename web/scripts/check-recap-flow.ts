// End-to-end recap check with the REAL database and model, using a throwaway user (rows deleted afterwards).
// Costs a fraction of a cent. Run: npm run check:recap
import { config } from "dotenv";
import { sql } from "@/lib/db";
import { listFacts } from "@/lib/memory";
import { getDueMistakes } from "@/lib/mistake-bank";
import { saveExchange } from "@/lib/queries";
import { getOrCreateRecap } from "@/lib/recap-service";

config({ path: ".env.local" });

let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}

const buddyTurn = (text: string, recast: { original: string; corrected: string; errorType: "gender_agreement" } | null) => ({
  textDiacritized: text, textDisplay: text, recast, promptRepeat: recast !== null, vocabFlags: [], retried: false, recastRejected: false,
});

async function main() {
  const db = sql();
  const user = `test-recapflow-${Math.random().toString(36).slice(2)}`;
  const made: string[] = [];
  const mkSession = async () => {
    const [s] = await db`INSERT INTO sessions (user_id, scenario_id) VALUES (${user}, 'b1l1-around-the-house') RETURNING id, scenario_id, started_at`;
    made.push(s.id);
    return { id: s.id as string, userId: user, scenarioId: s.scenario_id as string, startedAt: s.started_at as string };
  };

  try {
    // A session with no learner messages can't be recapped.
    const empty = await mkSession();
    const none = await getOrCreateRecap(user, empty);
    check("error" in none && none.status === 422, "a session with no learner turns → 422", JSON.stringify(none));

    // A realistic session: two voice turns, one gender mistake, and an English aside with a goal.
    const s = await mkSession();
    await saveExchange(user, s.id, "هذا مفتاح", { asrText: "هذا مفتاح", seconds: 3 }, buddyTurn("نَعَمْ، هَذَا مِفْتَاحٌ. وَمَا هَذَا؟", null));
    await saveExchange(user, s.id, "هذه كتاب", { asrText: "هذه كتاب", seconds: 3 }, buddyTurn("هَذَا كِتَابٌ.", { original: "هذه كتاب", corrected: "هَذَا كِتَابٌ", errorType: "gender_agreement" }));
    await saveExchange(user, s.id, "I'm learning Arabic so I can read the Qur'an. I have two sisters.", null, buddyTurn("مَا هَذَا؟", null));

    const first = await getOrCreateRecap(user, s);
    if ("error" in first) throw new Error(`recap failed: ${first.error}`);
    const r = first.recap;
    check(r.stats.learnerTurns === 3 && r.stats.voiceTurns === 2, "stats count learner and spoken turns", JSON.stringify(r.stats));
    check(r.patterns.length === 1 && r.patterns[0].errorType === "gender_agreement" && r.patterns[0].examples[0]?.right === "هَذَا كِتَابٌ", "patterns come from the real recast, with the curated tip", JSON.stringify(r.patterns.map((p) => p.errorType)));
    check(r.summary.length > 10 && r.nextStep.length > 5, "narrative fields are filled", r.summary);
    const facts = await listFacts(user);
    check(facts.some((f) => /qur/i.test(f.fact)) && facts.some((f) => /sister/i.test(f.fact)), "goal + family were remembered", JSON.stringify(facts.map((f) => f.fact)));
    check(r.newFacts.length === facts.length && r.newFacts.every((f) => facts.some((x) => x.id === f.id)), "the recap's new-fact ids match what was stored");
    check(facts.every((f) => f.source === "conversation"), "extracted facts are labelled as from a conversation");

    const [row] = await db`SELECT ended_at, recap IS NOT NULL AS has FROM sessions WHERE id = ${s.id}`;
    check(row.has && row.ended_at !== null, "the recap is saved and the session is marked ended");

    // Idempotent: a second call must not call the model again or change anything.
    const second = await getOrCreateRecap(user, s);
    check("recap" in second && second.recap.generatedAt === r.generatedAt && second.recap.summary === r.summary, "second call returns the saved recap untouched");
    check((await listFacts(user)).length === facts.length, "second call does not add facts again");

    // Racing two first-time requests must still produce exactly one saved recap.
    const s2 = await mkSession();
    await saveExchange(user, s2.id, "هذا باب", null, buddyTurn("نَعَمْ.", null));
    const [a, b] = await Promise.all([getOrCreateRecap(user, s2), getOrCreateRecap(user, s2)]);
    check("recap" in a && "recap" in b && a.recap.generatedAt === b.recap.generatedAt, "two simultaneous requests end up with the same saved recap", `${"recap" in a && a.recap.generatedAt} vs ${"recap" in b && b.recap.generatedAt}`);

    // The mistake from the session is in the review bank (due tomorrow, so not due yet).
    const bank = await db`SELECT times_seen, review_count FROM mistakes WHERE user_id = ${user} AND key IS NOT NULL`;
    check(bank.length === 1 && bank[0].times_seen === 1, "the session's mistake is in the bank", JSON.stringify(bank));
    check((await getDueMistakes(user)).length === 0, "and it isn't due until tomorrow");
  } finally {
    await db`DELETE FROM memory_facts WHERE user_id = ${user}`;
    await db`DELETE FROM mistakes WHERE user_id = ${user}`;
    for (const id of made) await db`DELETE FROM sessions WHERE id = ${id}`;
  }
}

main()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll recap-flow checks pass.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
