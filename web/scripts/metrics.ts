// Launch metrics from docs/product-spec.md, computed from the database. Aggregates only: no learner ids, emails or text are printed.
// Run: npm run metrics
import { config } from "dotenv";
import { sql } from "@/lib/db";
import { decideAccess } from "@/lib/billing";
import { TRIAL_DAYS } from "@/lib/plans";

config({ path: ".env.local" });

// Rough unit costs (USD) used for the cost line. Replace with invoiced numbers once there is real traffic.
const COST = { sttPerMinute: 0.003, ttsPerMinute: 0.015, perTurn: 0.001 };
const pct = (n: number, d: number) => (d ? `${((100 * n) / d).toFixed(0)}%` : "n/a");
const one = (v: number, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : "n/a");

async function main() {
  const db = sql();
  const n = async (q: Promise<Record<string, unknown>[]>) => Number((await q)[0].n);

  const learners = await n(db`SELECT count(*) AS n FROM profiles`);
  const subs = await db`SELECT p.trial_ends_at, s.status, s.plan, s.cancel_at_period_end, s.current_period_end
    FROM profiles p LEFT JOIN subscriptions s ON s.user_id = p.user_id`;
  const buckets: Record<string, number> = { trial: 0, subscribed: 0, comp: 0, expired: 0 };
  for (const r of subs) {
    const access = decideAccess(r.trial_ends_at ? new Date(r.trial_ends_at as string) : null, r.status ? { status: r.status as string, plan: r.plan as "monthly" | "comp", cancelAtPeriodEnd: r.cancel_at_period_end as boolean, currentPeriodEnd: r.current_period_end ? new Date(r.current_period_end as string) : null } : null);
    buckets[access.reason]++;
  }

  // ---- Activation: placement completed + first voice session -------------------------------------------------------
  const placed = await n(db`SELECT count(*) AS n FROM profiles WHERE placed_at IS NOT NULL`);
  const voiceUsers = await n(db`SELECT count(DISTINCT s.user_id) AS n FROM turns t JOIN sessions s ON s.id = t.session_id WHERE t.role = 'learner' AND t.input_mode = 'voice'`);
  const activated = await n(db`SELECT count(*) AS n FROM profiles p WHERE p.placed_at IS NOT NULL AND EXISTS (
    SELECT 1 FROM turns t JOIN sessions s ON s.id = t.session_id WHERE s.user_id = p.user_id AND t.role = 'learner' AND t.input_mode = 'voice')`);

  // ---- Engagement (last 28 days) ---------------------------------------------------------------------------------------
  const eng = (await db`
    SELECT count(DISTINCT s.user_id)::int AS active, count(DISTINCT s.id)::int AS sessions,
           count(*) FILTER (WHERE t.role = 'learner')::int AS turns,
           count(*) FILTER (WHERE t.role = 'learner' AND t.input_mode = 'voice')::int AS voice_turns
    FROM turns t JOIN sessions s ON s.id = t.session_id WHERE t.created_at > now() - interval '28 days'`)[0];
  const sessionsPerWeek = eng.active ? eng.sessions / eng.active / 4 : NaN;

  // ---- Retention: active exactly N days after signup (UTC), among learners old enough to have a day N ------------------
  const retention = async (days: number) => {
    const row = (await db.query(
      `SELECT count(*)::int AS eligible,
              count(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM turns t JOIN sessions s ON s.id = t.session_id
                WHERE s.user_id = p.user_id AND t.role = 'learner'
                  AND (t.created_at AT TIME ZONE 'utc')::date = ((p.created_at AT TIME ZONE 'utc')::date + $1::int)))::int AS retained
       FROM profiles p WHERE p.created_at <= now() - ($1::int + 1) * interval '1 day'`,
      [days]
    ))[0];
    return { eligible: row.eligible as number, retained: row.retained as number };
  };
  const d7 = await retention(7);
  const d30 = await retention(30);

  // ---- Revenue: trial → paid ---------------------------------------------------------------------------------------------
  const trialDone = await n(db`SELECT count(*) AS n FROM profiles WHERE trial_ends_at < now()`);
  const converted = await n(db`SELECT count(*) AS n FROM profiles p JOIN subscriptions s ON s.user_id = p.user_id
    WHERE p.trial_ends_at < now() AND s.plan = 'monthly' AND s.stripe_subscription_id IS NOT NULL`);

  // ---- Cost: voice minutes per DAU (last 28 days) ------------------------------------------------------------------------
  const use = (await db`SELECT coalesce(sum(stt_seconds), 0)::float8 AS stt, coalesce(sum(tts_seconds), 0)::float8 AS tts, count(*)::int AS user_days
    FROM usage_daily WHERE day > (now() AT TIME ZONE 'utc')::date - 28`)[0];
  const activeDays = await n(db`SELECT count(*) AS n FROM (
    SELECT DISTINCT s.user_id, (t.created_at AT TIME ZONE 'utc')::date FROM turns t JOIN sessions s ON s.id = t.session_id
    WHERE t.role = 'learner' AND t.created_at > now() - interval '28 days') x`);
  const sttMin = use.stt / 60;
  const ttsMin = use.tts / 60;
  const estCost = sttMin * COST.sttPerMinute + ttsMin * COST.ttsPerMinute + eng.turns * COST.perTurn;

  const rows: [string, string][] = [
    ["Learners", `${learners} (trial ${buckets.trial} · subscribed ${buckets.subscribed} · comp ${buckets.comp} · lapsed ${buckets.expired})`],
    ["Activation (placement + first voice session)", `${activated}/${learners} = ${pct(activated, learners)}  (placed ${placed}, ever spoke ${voiceUsers})`],
    ["Sessions per active learner per week (28d)", `${one(sessionsPerWeek)}  (${eng.active} active learners, ${eng.sessions} sessions)`],
    ["Speaking turns per session (28d)", `${one(eng.sessions ? eng.turns / eng.sessions : NaN)} learner turns, ${pct(eng.voice_turns, eng.turns)} by voice`],
    ["D7 retention", `${d7.retained}/${d7.eligible} = ${pct(d7.retained, d7.eligible)}${d7.eligible < 20 ? "  (too few learners to mean much)" : ""}`],
    ["D30 retention", `${d30.retained}/${d30.eligible} = ${pct(d30.retained, d30.eligible)}${d30.eligible < 20 ? "  (too few learners to mean much)" : ""}`],
    [`Trial → paid (${TRIAL_DAYS}-day trial over)`, `${converted}/${trialDone} = ${pct(converted, trialDone)}`],
    ["Voice minutes per active learner-day (28d)", `${one(activeDays ? (sttMin + ttsMin) / activeDays : NaN)}  (${one(sttMin)} min speech-in, ${one(ttsMin)} min speech-out)`],
    ["Rough variable cost (28d)", `$${one(estCost, 2)}  ≈ $${one(activeDays ? estCost / activeDays : NaN, 3)} per active learner-day  (estimate, not invoiced)`],
  ];
  const w = Math.max(...rows.map(([k]) => k.length));
  console.log("\nJalees launch metrics\n" + "-".repeat(w + 4));
  for (const [k, v] of rows) console.log(`${k.padEnd(w)}  ${v}`);
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
