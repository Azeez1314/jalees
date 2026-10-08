import type Stripe from "stripe";
import { appUrl, requireEnv, stripe } from "@/lib/stripe";
import { getCustomerId, saveCustomerId } from "@/lib/subscriptions";

/**
 * The learner's Stripe customer, created on first use and saved BEFORE they pay — so every webhook can map a customer back to
 * a learner. The idempotency key collapses a double-click into one customer; saveCustomerId settles any remaining race.
 */
export async function ensureCustomer(userId: string, email: string | null, client: Stripe = stripe()): Promise<string> {
  const existing = await getCustomerId(userId);
  if (existing) return existing;
  const customer = await client.customers.create(
    { email: email ?? undefined, metadata: { user_id: userId } },
    { idempotencyKey: `jalees-customer-${userId}` }
  );
  return saveCustomerId(userId, customer.id);
}

/**
 * A hosted Checkout page for the monthly plan. The 7-day trial is the app's (no card), so none is added here: subscribing
 * starts billing immediately. `client_reference_id` and the subscription metadata both carry the learner id.
 */
export async function createCheckoutUrl(userId: string, email: string | null, client: Stripe = stripe()): Promise<string> {
  const customer = await ensureCustomer(userId, email, client);
  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: userId,
    line_items: [{ price: requireEnv("STRIPE_PRICE_ID"), quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { user_id: userId } },
    success_url: `${appUrl()}/learn/billing?checkout=success`,
    cancel_url: `${appUrl()}/learn/billing?checkout=cancelled`,
  });
  if (!session.url) throw new Error("Stripe returned a Checkout Session without a URL");
  return session.url;
}

/** Stripe's Customer Portal (cancel, update card, invoices). Only for learners who already have a Stripe customer. */
export async function createPortalUrl(userId: string, client: Stripe = stripe()): Promise<string | null> {
  const customer = await getCustomerId(userId);
  if (!customer) return null;
  const session = await client.billingPortal.sessions.create({ customer, return_url: `${appUrl()}/learn/billing` });
  return session.url;
}
