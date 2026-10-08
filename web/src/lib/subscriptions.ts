import { sql } from "@/lib/db";
import { decideAccess, type Access, type SubscriptionState } from "@/lib/billing";
import { getOrCreateProfile } from "@/lib/queries";

const toDate = (v: unknown): Date | null => (v ? new Date(v as string | Date) : null);

export interface SubscriptionRow extends SubscriptionState {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

function toRow(r: Record<string, unknown>): SubscriptionRow {
  return {
    userId: r.user_id as string,
    stripeCustomerId: (r.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (r.stripe_subscription_id as string | null) ?? null,
    status: r.status as string,
    plan: r.plan as "monthly" | "comp",
    cancelAtPeriodEnd: r.cancel_at_period_end as boolean,
    currentPeriodEnd: toDate(r.current_period_end),
  };
}

export async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  const rows = await sql()`SELECT * FROM subscriptions WHERE user_id = ${userId}`;
  return rows.length ? toRow(rows[0]) : null;
}

/** Who may talk to the buddy right now. Creates the profile (and with it the 7-day trial) on first sight, so a brand-new learner is never locked out. */
export async function getAccess(userId: string): Promise<Access> {
  const profile = await getOrCreateProfile(userId, null);
  return decideAccess(profile.trialEndsAt, await getSubscription(userId));
}

export async function getUserIdByCustomer(customerId: string): Promise<string | null> {
  const rows = await sql()`SELECT user_id FROM subscriptions WHERE stripe_customer_id = ${customerId}`;
  return rows.length ? (rows[0].user_id as string) : null;
}

/** The Stripe customer for this learner, if one was already created. */
export async function getCustomerId(userId: string): Promise<string | null> {
  return (await getSubscription(userId))?.stripeCustomerId ?? null;
}

/**
 * Records the learner's Stripe customer before any payment happens, so webhooks can always map customer → learner.
 * Race-safe: if two requests create customers at once, the first write wins and both callers use it.
 */
export async function saveCustomerId(userId: string, customerId: string): Promise<string> {
  const rows = await sql()`
    INSERT INTO subscriptions (user_id, stripe_customer_id) VALUES (${userId}, ${customerId})
    ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = COALESCE(subscriptions.stripe_customer_id, EXCLUDED.stripe_customer_id)
    RETURNING stripe_customer_id`;
  return rows[0].stripe_customer_id as string;
}

export interface SubscriptionSnapshot {
  subscriptionId: string;
  customerId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
}

/** Overwrites the learner's subscription state with what Stripe says right now. */
export async function upsertSubscription(userId: string, s: SubscriptionSnapshot): Promise<void> {
  await sql()`
    INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan, cancel_at_period_end, current_period_end, updated_at)
    VALUES (${userId}, ${s.customerId}, ${s.subscriptionId}, ${s.status}, 'monthly', ${s.cancelAtPeriodEnd}, ${s.currentPeriodEnd?.toISOString() ?? null}, now())
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_customer_id = EXCLUDED.stripe_customer_id, stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status, plan = 'monthly', cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      current_period_end = EXCLUDED.current_period_end, updated_at = now()`;
}

/** Grants access without Stripe (the owner, testers, partners). `days` null = open-ended. */
export async function grantComp(userId: string, days: number | null): Promise<void> {
  const end = days === null ? null : new Date(Date.now() + days * 86_400_000).toISOString();
  await sql()`
    INSERT INTO subscriptions (user_id, status, plan, current_period_end, updated_at) VALUES (${userId}, 'active', 'comp', ${end}, now())
    ON CONFLICT (user_id) DO UPDATE SET status = 'active', plan = 'comp', cancel_at_period_end = false, current_period_end = ${end}, updated_at = now()`;
}

export async function hasProcessedEvent(eventId: string): Promise<boolean> {
  return (await sql()`SELECT 1 FROM stripe_events WHERE id = ${eventId}`).length > 0;
}

export async function markEventProcessed(eventId: string, type: string): Promise<void> {
  await sql()`INSERT INTO stripe_events (id, type) VALUES (${eventId}, ${type}) ON CONFLICT (id) DO NOTHING`;
}
