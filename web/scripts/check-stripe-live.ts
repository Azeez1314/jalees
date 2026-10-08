// Talks to Stripe in TEST MODE only: verifies your Price is $9/month, and that a Checkout Session and a Customer Portal
// session can be created. No payment is made. Created objects are cleaned up. Refuses live keys.
// Needs STRIPE_SECRET_KEY (sk_test_...) and STRIPE_PRICE_ID in .env.local. Run: npm run check:stripe
import { config } from "dotenv";
import Stripe from "stripe";
import { createCheckoutUrl, createPortalUrl } from "@/lib/checkout";
import { sql } from "@/lib/db";
import { PRICE_CENTS, PRICE_CURRENCY } from "@/lib/plans";

config({ path: ".env.local" });

let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!key || !priceId) {
    console.log("- skipped: set STRIPE_SECRET_KEY (a sk_test_… key) and STRIPE_PRICE_ID in web/.env.local, then rerun. See README → Billing setup.");
    return;
  }
  if (!key.startsWith("sk_test_")) throw new Error("Refusing to run: STRIPE_SECRET_KEY is not a test-mode key (sk_test_…).");
  const stripe = new Stripe(key);

  const price = await stripe.prices.retrieve(priceId);
  check(price.active, "the Price is active");
  check(price.unit_amount === PRICE_CENTS && price.currency === PRICE_CURRENCY, `the Price is $${PRICE_CENTS / 100} ${PRICE_CURRENCY.toUpperCase()}`, `${price.unit_amount} ${price.currency}`);
  check(price.type === "recurring" && price.recurring?.interval === "month" && price.recurring.interval_count === 1, "the Price recurs monthly", JSON.stringify(price.recurring));
  check(!price.recurring?.trial_period_days, "the Price has no built-in Stripe trial (the 7-day trial is app-managed)", String(price.recurring?.trial_period_days));

  const userId = `test-live-${Math.random().toString(36).slice(2)}`;
  let customerId: string | null = null;
  let sessionId: string | null = null;
  try {
    const url = await createCheckoutUrl(userId, `${userId}@example.test`, stripe);
    check(/^https:\/\/checkout\.stripe\.com\//.test(url), "a real Checkout Session was created (hosted page URL)", url.slice(0, 60));
    const row = (await sql()`SELECT stripe_customer_id FROM subscriptions WHERE user_id = ${userId}`)[0];
    customerId = row?.stripe_customer_id ?? null;
    check(Boolean(customerId), "the Stripe customer id was saved for the learner");

    const sessions = await stripe.checkout.sessions.list({ customer: customerId ?? undefined, limit: 1 });
    sessionId = sessions.data[0]?.id ?? null;
    const s = sessions.data[0];
    check(s?.mode === "subscription" && s.client_reference_id === userId && s.status === "open", "the session is an open subscription Checkout bound to the learner", JSON.stringify({ mode: s?.mode, ref: s?.client_reference_id, status: s?.status }));

    try {
      const portal = await createPortalUrl(userId, stripe);
      check(Boolean(portal && /^https:\/\/billing\.stripe\.com\//.test(portal)), "a Customer Portal session can be created");
    } catch (err) {
      check(false, "a Customer Portal session can be created", `${(err as Error).message} — activate the portal at dashboard.stripe.com/test/settings/billing/portal`);
    }
  } finally {
    if (sessionId) await stripe.checkout.sessions.expire(sessionId).catch(() => {});
    if (customerId) await stripe.customers.del(customerId).catch(() => {});
    await sql()`DELETE FROM subscriptions WHERE user_id = ${userId}`;
  }
}

main()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nDone.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
