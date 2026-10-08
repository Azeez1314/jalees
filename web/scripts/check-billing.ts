// Billing checks. Pure access matrix first; the webhook/DB/Stripe sections are added as those pieces are built.
// Run: npm run check:billing
import { config } from "dotenv";
import { decideAccess, type SubscriptionState } from "@/lib/billing";
import { PRICE_CENTS, PRICE_LABEL, TRIAL_DAYS } from "@/lib/plans";

config({ path: ".env.local" });

let failed = 0;
export function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}

const now = new Date("2026-10-10T12:00:00Z");
const day = 86_400_000;
const inDays = (n: number) => new Date(now.getTime() + n * day);
const sub = (over: Partial<SubscriptionState> = {}): SubscriptionState => ({
  status: "active", plan: "monthly", cancelAtPeriodEnd: false, currentPeriodEnd: inDays(20), ...over,
});

check(TRIAL_DAYS === 7 && PRICE_CENTS === 900 && PRICE_LABEL === "$9/month", "plan constants: 7-day trial, $9/month");

// ---- trial -----------------------------------------------------------------------------------------------------
let a = decideAccess(inDays(7), null, now);
check(a.allowed && a.reason === "trial" && a.trialDaysLeft === 7, "new learner: 7 days of trial", JSON.stringify(a));
a = decideAccess(inDays(0.2), null, now);
check(a.allowed && a.reason === "trial" && a.trialDaysLeft === 1, "less than a day left still counts as 1 day, and is allowed");
a = decideAccess(inDays(0), null, now);
check(!a.allowed && a.reason === "expired" && a.trialDaysLeft === 0, "trial ending exactly now is expired");
a = decideAccess(inDays(-3), null, now);
check(!a.allowed && a.reason === "expired", "trial ended 3 days ago → locked");
a = decideAccess(null, null, now);
check(!a.allowed && a.reason === "expired", "no trial date and no subscription → locked (fail closed)");

// ---- paid ------------------------------------------------------------------------------------------------------
for (const status of ["active", "trialing", "past_due"]) {
  a = decideAccess(inDays(-30), sub({ status }), now);
  check(a.allowed && a.reason === "subscribed", `subscription '${status}' keeps access after the trial`);
}
for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", "something_new"]) {
  a = decideAccess(inDays(-30), sub({ status }), now);
  check(!a.allowed && a.reason === "expired", `subscription '${status}' with an ended trial → locked`);
}
a = decideAccess(inDays(3), sub({ status: "canceled" }), now);
check(a.allowed && a.reason === "trial", "a cancelled subscription doesn't cancel a still-running trial");

// cancel at period end
a = decideAccess(inDays(-30), sub({ cancelAtPeriodEnd: true, currentPeriodEnd: inDays(5) }), now);
check(a.allowed && a.reason === "subscribed" && a.endsAt?.getTime() === inDays(5).getTime(), "cancelled-at-period-end: still paid until then, reports when it ends");
a = decideAccess(inDays(-30), sub({ cancelAtPeriodEnd: true, currentPeriodEnd: inDays(-1) }), now);
check(!a.allowed, "cancelled-at-period-end and the period has passed (late webhook) → locked");
a = decideAccess(inDays(-30), sub({ currentPeriodEnd: inDays(-1) }), now);
check(a.allowed, "active but period end just passed (renewal webhook pending) → NOT locked: Stripe's status is the authority");

// ---- comp ------------------------------------------------------------------------------------------------------
a = decideAccess(inDays(-30), sub({ plan: "comp", currentPeriodEnd: null }), now);
check(a.allowed && a.reason === "comp" && a.endsAt === null, "open-ended comp");
a = decideAccess(inDays(-30), sub({ plan: "comp", currentPeriodEnd: inDays(10) }), now);
check(a.allowed && a.reason === "comp", "time-limited comp, still running");
a = decideAccess(inDays(-30), sub({ plan: "comp", currentPeriodEnd: inDays(-1) }), now);
check(!a.allowed && a.reason === "expired", "time-limited comp that ran out → locked");
a = decideAccess(inDays(-30), sub({ plan: "comp", status: "canceled", currentPeriodEnd: null }), now);
check(!a.allowed, "a revoked comp → locked");

async function integration() {
  if (!process.env.DATABASE_URL) {
    console.log("- skipped DB/webhook checks (no DATABASE_URL)");
    return;
  }
  const { runBillingIntegration } = await import("./billing-integration-checks");
  await runBillingIntegration(check);
}

integration()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll billing checks pass.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
