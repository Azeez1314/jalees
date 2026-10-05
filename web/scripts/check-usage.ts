// Checks the daily voice cap: pure arithmetic, then the real Neon table with a throwaway user (rows deleted afterwards).
// Run: npm run check:usage
import { config } from "dotenv";
import { sql } from "@/lib/db";
import { DAILY_CAP_SECONDS, addUsage, getUsage, summarizeUsage } from "@/lib/usage";

config({ path: ".env.local" });

let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}

check(DAILY_CAP_SECONDS === 600, "cap is 10 minutes");
check(summarizeUsage(0, 0).remainingSeconds === 600, "fresh learner has the full 600s");
check(summarizeUsage(100, 50).remainingSeconds === 450, "stt + tts both count toward the cap");
check(summarizeUsage(400, 400).remainingSeconds === 0, "remaining never goes negative");

async function db() {
  if (!process.env.DATABASE_URL) {
    console.log("- skipped DB checks (no DATABASE_URL)");
    return;
  }
  const user = `test-usage-${Math.random().toString(36).slice(2)}`;
  try {
    check((await getUsage(user)).usedSeconds === 0, "unknown user has zero usage");
    const a = await addUsage(user, { stt: 12.5 });
    check(a.sttSeconds === 12.5 && a.remainingSeconds === 587.5, "first add creates today's row", JSON.stringify(a));
    const b = await addUsage(user, { tts: 30, stt: 7.5 });
    check(b.sttSeconds === 20 && b.ttsSeconds === 30 && b.remainingSeconds === 550, "second add accumulates", JSON.stringify(b));
    // Concurrent adds must not lose updates.
    await Promise.all(Array.from({ length: 5 }, () => addUsage(user, { stt: 10 })));
    const c = await getUsage(user);
    check(c.sttSeconds === 70, "5 concurrent adds all land", JSON.stringify(c));
    await addUsage(user, { tts: 600 });
    check((await getUsage(user)).remainingSeconds === 0, "cap exhausted -> 0 remaining");
    const rows = await sql().query("SELECT count(*)::int AS n FROM usage_daily WHERE user_id = $1", [user]);
    check(rows[0].n === 1, "one row per user per day");
  } finally {
    await sql().query("DELETE FROM usage_daily WHERE user_id = $1", [user]);
  }
}

db()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll usage checks pass.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
