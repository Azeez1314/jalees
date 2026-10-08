// Webhook / DB / access integration checks for billing, run by check-billing.ts. Real Neon tables with throwaway users
// (deleted afterwards); Stripe itself is replaced by a fake BillingStripe, and signatures are produced with Stripe's own helper.
import Stripe from "stripe";
import { sql } from "@/lib/db";
import { decideAccess } from "@/lib/billing";
import { handleStripeEvent, snapshotFromStripe, type BillingStripe } from "@/lib/stripe-sync";
import { createCheckoutUrl, createPortalUrl, ensureCustomer } from "@/lib/checkout";
import { paywall, SUBSCRIPTION_REQUIRED } from "@/lib/guard";
import { getAccess, getSubscription, grantComp, saveCustomerId, type SubscriptionSnapshot } from "@/lib/subscriptions";

type Check = (ok: boolean, label: string, detail?: string) => void;

const DAY = 86_400_000;
const event = (id: string, type: string, object: Record<string, unknown>) =>
  ({ id, type, object: "event", data: { object } }) as unknown as Stripe.Event;

export async function runBillingIntegration(check: Check) {
  const db = sql();
  const tag = Math.random().toString(36).slice(2);
  const users = [`test-bill-a-${tag}`, `test-bill-b-${tag}`, `test-bill-c-${tag}`, `test-bill-new-${tag}`];
  const [A, B, C, NEW] = users;
  const cus = { a: `cus_test_a_${tag}`, b: `cus_test_b_${tag}`, c: `cus_test_c_${tag}`, unknown: `cus_test_unknown_${tag}`, race1: `cus_r1_${tag}`, race2: `cus_r2_${tag}` };
  const sub = { a: `sub_test_a_${tag}`, b: `sub_test_b_${tag}` };

  // The fake "Stripe": whatever state the test sets is "what Stripe says right now".
  let current: SubscriptionSnapshot = { subscriptionId: sub.a, customerId: cus.a, status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: new Date(Date.now() + 30 * DAY) };
  let fetches = 0;
  let failNext = false;
  const metadataUsers: Record<string, string> = {};
  const fake: BillingStripe = {
    async getSubscription() {
      fetches++;
      if (failNext) {
        failNext = false;
        throw new Error("simulated Stripe outage");
      }
      return { ...current };
    },
    async getCustomerUserId(customerId) {
      return metadataUsers[customerId] ?? null;
    },
  };

  try {
    // Profiles with an already-ended trial, so only a subscription can grant access.
    for (const u of [A, B, C]) {
      await db`INSERT INTO profiles (user_id, trial_ends_at) VALUES (${u}, now() - interval '2 days')`;
    }
    check(!(await getAccess(A)).allowed, "trial over + no subscription → locked");

    // ---- checkout.session.completed ---------------------------------------------------------------------------
    await saveCustomerId(A, cus.a); // what the checkout step does before payment
    let r = await handleStripeEvent(fake, event(`evt_1_${tag}`, "checkout.session.completed", { mode: "subscription", subscription: sub.a, customer: cus.a, client_reference_id: A }));
    check(r.status === "synced" && r.userId === A, "checkout.session.completed → subscription synced to the right learner", JSON.stringify(r));
    const row = await getSubscription(A);
    check(row?.status === "active" && row.plan === "monthly" && row.stripeSubscriptionId === sub.a, "subscription row is saved", JSON.stringify(row));
    const acc1 = await getAccess(A);
    check(acc1.allowed && acc1.reason === "subscribed", "access is now granted (subscribed)");

    // ---- duplicates ---------------------------------------------------------------------------------------------
    const before = fetches;
    r = await handleStripeEvent(fake, event(`evt_1_${tag}`, "checkout.session.completed", { mode: "subscription", subscription: sub.a, customer: cus.a, client_reference_id: A }));
    check(r.status === "duplicate" && fetches === before, "the same event id delivered twice is skipped (no second Stripe call)");

    // ---- cancel at period end -----------------------------------------------------------------------------------
    current = { ...current, cancelAtPeriodEnd: true, currentPeriodEnd: new Date(Date.now() + 6 * DAY) };
    await handleStripeEvent(fake, event(`evt_2_${tag}`, "customer.subscription.updated", { id: sub.a, customer: cus.a, metadata: {} }));
    const acc2 = await getAccess(A);
    check(acc2.allowed && acc2.endsAt !== null, "cancelled at period end: still allowed, and the end date is reported", JSON.stringify(acc2));

    // ---- deleted, then a stale 'updated' arrives out of order ---------------------------------------------------
    current = { ...current, status: "canceled", cancelAtPeriodEnd: false };
    await handleStripeEvent(fake, event(`evt_3_${tag}`, "customer.subscription.deleted", { id: sub.a, customer: cus.a, metadata: {} }));
    check(!(await getAccess(A)).allowed, "customer.subscription.deleted → access revoked");
    await handleStripeEvent(fake, event(`evt_stale_${tag}`, "customer.subscription.updated", { id: sub.a, customer: cus.a, status: "active", metadata: {} })); // an OLD event body claiming 'active'
    check((await getSubscription(A))?.status === "canceled" && !(await getAccess(A)).allowed, "a stale 'active' event arriving late can't resurrect a cancelled subscription (state is re-read from Stripe)");

    // ---- unknown customer / metadata fallback -------------------------------------------------------------------
    r = await handleStripeEvent(fake, event(`evt_4_${tag}`, "customer.subscription.created", { id: "sub_x", customer: cus.unknown, metadata: {} }));
    check(r.status === "ignored", "an event for a customer we don't know is ignored, not an error", JSON.stringify(r));
    metadataUsers[cus.b] = B; // the DB has no row for this customer, but Stripe's customer metadata names the learner
    current = { subscriptionId: sub.b, customerId: cus.b, status: "trialing", cancelAtPeriodEnd: false, currentPeriodEnd: new Date(Date.now() + 14 * DAY) };
    r = await handleStripeEvent(fake, event(`evt_5_${tag}`, "customer.subscription.created", { id: sub.b, customer: cus.b, metadata: {} }));
    check(r.status === "synced" && r.userId === B, "no DB row for the customer → falls back to the customer's metadata", JSON.stringify(r));
    check((await getAccess(B)).allowed, "a 'trialing' Stripe subscription grants access");

    // ---- unrelated events -----------------------------------------------------------------------------------------
    r = await handleStripeEvent(fake, event(`evt_6_${tag}`, "invoice.created", {}));
    check(r.status === "ignored", "event types we don't handle are ignored");
    check((await db`SELECT 1 FROM stripe_events WHERE id = ${`evt_6_${tag}`}`).length === 1, "…and still recorded as processed");
    r = await handleStripeEvent(fake, event(`evt_7_${tag}`, "checkout.session.completed", { mode: "payment", customer: cus.a }));
    check(r.status === "ignored", "a one-off payment checkout is ignored");

    // ---- failure then retry ---------------------------------------------------------------------------------------
    current = { subscriptionId: `sub_c_${tag}`, customerId: cus.c, status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: new Date(Date.now() + 30 * DAY) };
    await saveCustomerId(C, cus.c);
    const retryEvent = event(`evt_8_${tag}`, "customer.subscription.created", { id: `sub_c_${tag}`, customer: cus.c, metadata: {} });
    failNext = true;
    let threw = false;
    try {
      await handleStripeEvent(fake, retryEvent);
    } catch {
      threw = true;
    }
    check(threw && (await db`SELECT 1 FROM stripe_events WHERE id = ${`evt_8_${tag}`}`).length === 0, "if Stripe is down the handler throws and does NOT mark the event processed (so Stripe retries)");
    r = await handleStripeEvent(fake, retryEvent);
    check(r.status === "synced" && (await getAccess(C)).allowed, "the retry of the same event then succeeds");

    // ---- statuses --------------------------------------------------------------------------------------------------
    for (const [status, allowed] of [["past_due", true], ["unpaid", false], ["incomplete", false]] as const) {
      current = { ...current, status };
      await handleStripeEvent(fake, event(`evt_s_${status}_${tag}`, "customer.subscription.updated", { id: `sub_c_${tag}`, customer: cus.c, metadata: {} }));
      check((await getAccess(C)).allowed === allowed, `Stripe status '${status}' → access ${allowed ? "kept (grace period)" : "locked"}`);
    }

    // ---- customer id is saved once ---------------------------------------------------------------------------------
    const winners = await Promise.all([saveCustomerId(NEW, cus.race1), saveCustomerId(NEW, cus.race2)]);
    check(winners[0] === winners[1], "two simultaneous customer creations settle on one customer id", JSON.stringify(winners));

    // ---- a brand-new learner is never locked out -----------------------------------------------------------------------
    const fresh = await getAccess(NEW);
    check(fresh.allowed && fresh.reason === "trial" && fresh.trialDaysLeft >= 6, "a learner with no profile yet gets a profile and a 7-day trial on first check", JSON.stringify(fresh));

    // ---- comp --------------------------------------------------------------------------------------------------------
    await grantComp(NEW, null);
    await db`UPDATE profiles SET trial_ends_at = now() - interval '1 day' WHERE user_id = ${NEW}`;
    const comp = await getAccess(NEW);
    check(comp.allowed && comp.reason === "comp", "an open-ended comp keeps access after the trial");
    await grantComp(NEW, -1);
    check(!(await getAccess(NEW)).allowed, "a comp that has run out → locked");

    // ---- snapshotFromStripe -------------------------------------------------------------------------------------------
    const epoch = (d: number) => Math.floor((Date.now() + d * DAY) / 1000);
    const s1 = snapshotFromStripe({ id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: false, cancel_at: null, items: { data: [{ current_period_end: epoch(10) }, { current_period_end: epoch(30) }] } } as unknown as Stripe.Subscription);
    check(s1.currentPeriodEnd !== null && Math.abs(s1.currentPeriodEnd.getTime() - (Date.now() + 30 * DAY)) < 5000, "period end is read from the subscription items (latest of several)");
    const s2 = snapshotFromStripe({ id: "sub_2", customer: { id: "cus_2" }, status: "active", cancel_at_period_end: false, cancel_at: epoch(5), items: { data: [] } } as unknown as Stripe.Subscription);
    check(s2.customerId === "cus_2" && s2.cancelAtPeriodEnd && s2.currentPeriodEnd === null, "an expanded customer object is handled; a scheduled cancel_at counts as cancelling; no items → no period end");

    // ---- the signed webhook route ---------------------------------------------------------------------------------------
    process.env.STRIPE_SECRET_KEY ??= "sk_test_offline_check";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_check_secret";
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const stripeLib = new Stripe("sk_test_offline_check");
    const body = JSON.stringify(event(`evt_route_${tag}`, "invoice.created", {}));
    const signed = (payload: string, secret = "whsec_check_secret") =>
      stripeLib.webhooks.generateTestHeaderString({ payload, secret });
    const post = (payload: string, sig: string | null) =>
      POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: sig ? { "stripe-signature": sig } : {} }));

    check((await post(body, signed(body))).status === 200, "route: a correctly signed event → 200");
    check((await post(body, null)).status === 400, "route: no signature header → 400");
    check((await post(body, signed(body, "whsec_wrong"))).status === 400, "route: signed with the wrong secret → 400");
    check((await post(body.replace("invoice.created", "invoice.paid"), signed(body))).status === 400, "route: body altered after signing → 400");
    check((await post(body, "t=1,v1=deadbeef")).status === 400, "route: garbage signature → 400");
    check(decideAccess(null, null).allowed === false, "fail closed: no data → locked");

    // ---- the paywall guard used by /api/turn, /api/stt, /api/tts ---------------------------------------------------------
    const lockedRes = await paywall(users[3]); // NEW: comp ran out, trial over
    const lockedBody = lockedRes ? await lockedRes.json() : null;
    check(lockedRes?.status === 402 && lockedBody?.code === SUBSCRIPTION_REQUIRED && /trial has ended/i.test(lockedBody.error), "paywall: a lapsed learner gets 402 with code 'subscription_required' and a plain-language message", JSON.stringify(lockedBody));
    check((await paywall(B)) === null, "paywall: a learner with a live subscription (B: Stripe 'trialing', app trial long over) passes (null)");
    check((await paywall(C))?.status === 402, "paywall: …and C, whose Stripe status was left at 'incomplete' above, is correctly locked");
    await db`UPDATE profiles SET trial_ends_at = now() + interval '3 days' WHERE user_id = ${users[3]}`;
    await grantComp(users[3], -1); // comp lapsed, but the trial is running again
    check((await paywall(users[3])) === null, "paywall: a learner still in their trial passes");

    // ---- checkout / portal: exactly what we send Stripe (recording fake client) -------------------------------------------
    process.env.STRIPE_PRICE_ID = "price_check_900";
    process.env.APP_URL = "https://app.example.test/";
    const calls: { customerCreate: unknown[]; session: unknown[]; portal: unknown[] } = { customerCreate: [], session: [], portal: [] };
    const fakeClient = {
      customers: { create: async (params: unknown, opts: unknown) => (calls.customerCreate.push({ params, opts }), { id: `cus_made_${tag}` }) },
      checkout: { sessions: { create: async (params: unknown) => (calls.session.push(params), { url: "https://checkout.stripe.test/pay/cs_1" }) } },
      billingPortal: { sessions: { create: async (params: unknown) => (calls.portal.push(params), { url: "https://billing.stripe.test/session/bps_1" }) } },
    } as unknown as Stripe;
    const D = `test-bill-d-${tag}`;
    users.push(D);
    check((await createPortalUrl(D, fakeClient)) === null && calls.portal.length === 0, "portal: a learner with no Stripe customer gets null (and no Stripe call)");
    const url = await createCheckoutUrl(D, "learner@example.test", fakeClient);
    const cc = calls.customerCreate[0] as { params: { email: string; metadata: { user_id: string } }; opts: { idempotencyKey: string } };
    check(url === "https://checkout.stripe.test/pay/cs_1", "checkout: returns the hosted Checkout URL");
    check(cc.params.email === "learner@example.test" && cc.params.metadata.user_id === D && cc.opts.idempotencyKey === `jalees-customer-${D}`, "checkout: creates the customer with the learner id in metadata and a per-learner idempotency key", JSON.stringify(cc));
    check((await getSubscription(D))?.stripeCustomerId === `cus_made_${tag}`, "checkout: the customer id is saved BEFORE payment (so webhooks can find the learner)");
    const sess = calls.session[0] as Record<string, unknown> & { line_items: { price: string; quantity: number }[]; subscription_data: { metadata: { user_id: string }; trial_period_days?: number } };
    check(sess.mode === "subscription" && sess.customer === `cus_made_${tag}` && sess.client_reference_id === D, "checkout: subscription mode, bound to the learner's customer and client_reference_id", JSON.stringify(sess));
    check(sess.line_items[0].price === "price_check_900" && sess.line_items[0].quantity === 1, "checkout: the configured Price, quantity 1");
    check(sess.subscription_data.metadata.user_id === D && sess.subscription_data.trial_period_days === undefined, "checkout: learner id on the subscription; no Stripe trial (the trial is app-managed, no card)");
    check(sess.success_url === "https://app.example.test/learn/billing?checkout=success" && sess.cancel_url === "https://app.example.test/learn/billing?checkout=cancelled", "checkout: return URLs come from APP_URL (trailing slash tolerated)");
    check(sess.allow_promotion_codes === true, "checkout: promotion codes allowed");
    await createCheckoutUrl(D, "learner@example.test", fakeClient);
    check(calls.customerCreate.length === 1, "checkout: a second checkout reuses the saved customer (no second customer)");
    check((await ensureCustomer(D, null, fakeClient)) === `cus_made_${tag}`, "ensureCustomer returns the saved id");
    check((await createPortalUrl(D, fakeClient)) === "https://billing.stripe.test/session/bps_1" && (calls.portal[0] as { customer: string; return_url: string }).return_url === "https://app.example.test/learn/billing", "portal: opens a session for the saved customer and returns to /learn/billing");
  } finally {
    for (const u of users) {
      await db`DELETE FROM subscriptions WHERE user_id = ${u}`;
      await db`DELETE FROM profiles WHERE user_id = ${u}`;
    }
    await db`DELETE FROM stripe_events WHERE id LIKE ${"%" + tag + "%"}`;
  }
}
