import type Stripe from "stripe";
import {
  getUserIdByCustomer,
  hasProcessedEvent,
  markEventProcessed,
  upsertSubscription,
  type SubscriptionSnapshot,
} from "@/lib/subscriptions";

/** The two things the webhook needs from Stripe, behind an interface so tests can drive it without the network. */
export interface BillingStripe {
  getSubscription(subscriptionId: string): Promise<SubscriptionSnapshot>;
  /** The learner id stored in the customer's metadata when we created it (fallback if our DB row is missing). */
  getCustomerUserId(customerId: string): Promise<string | null>;
}

const id = (v: string | { id: string } | null | undefined): string | null => (typeof v === "string" ? v : (v?.id ?? null));

/**
 * Normalises a Stripe Subscription. NOTE: in current API versions the period end lives on the subscription ITEMS, not the
 * subscription. We take the latest item end. A scheduled `cancel_at` counts as "ends at period end" for flexible billing mode.
 */
export function snapshotFromStripe(sub: Stripe.Subscription): SubscriptionSnapshot {
  const ends = sub.items.data.map((i) => i.current_period_end).filter((n): n is number => typeof n === "number");
  return {
    subscriptionId: sub.id,
    customerId: id(sub.customer) ?? "",
    status: sub.status,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end) || sub.cancel_at != null,
    currentPeriodEnd: ends.length ? new Date(Math.max(...ends) * 1000) : null,
  };
}

export function realBillingStripe(client: Stripe): BillingStripe {
  return {
    async getSubscription(subscriptionId) {
      return snapshotFromStripe(await client.subscriptions.retrieve(subscriptionId));
    },
    async getCustomerUserId(customerId) {
      const customer = await client.customers.retrieve(customerId);
      return "deleted" in customer && customer.deleted ? null : (customer.metadata?.user_id ?? null);
    },
  };
}

export type HandleResult =
  | { status: "duplicate" }
  | { status: "ignored"; reason: string }
  | { status: "synced"; userId: string; subscriptionStatus: string };

async function resolveUser(stripe: BillingStripe, customerId: string | null, hint?: string | null): Promise<string | null> {
  if (customerId) {
    const known = await getUserIdByCustomer(customerId);
    if (known) return known;
  }
  if (hint) return hint;
  return customerId ? stripe.getCustomerUserId(customerId) : null;
}

async function sync(stripe: BillingStripe, userId: string, subscriptionId: string): Promise<HandleResult> {
  // Always re-read the subscription from Stripe instead of trusting the event body: events can arrive duplicated and out
  // of order, but "what Stripe says right now" is always the truth, so processing order stops mattering.
  const snapshot = await stripe.getSubscription(subscriptionId);
  await upsertSubscription(userId, snapshot);
  return { status: "synced", userId, subscriptionStatus: snapshot.status };
}

async function process(stripe: BillingStripe, event: Stripe.Event): Promise<HandleResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = id(s.subscription as string | { id: string } | null);
      if (s.mode !== "subscription" || !subscriptionId) return { status: "ignored", reason: "not a subscription checkout" };
      const userId = await resolveUser(stripe, id(s.customer as string | { id: string } | null), s.client_reference_id);
      return userId ? sync(stripe, userId, subscriptionId) : { status: "ignored", reason: "unknown customer" };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await resolveUser(stripe, id(sub.customer), sub.metadata?.user_id);
      return userId ? sync(stripe, userId, sub.id) : { status: "ignored", reason: "unknown customer" };
    }
    default:
      return { status: "ignored", reason: `unhandled event type ${event.type}` };
  }
}

/**
 * Applies one verified Stripe event. Safe to call twice for the same event (duplicate deliveries are skipped by id) and
 * safe if events arrive out of order. The id is recorded only AFTER success, so a failed attempt is retried by Stripe.
 */
export async function handleStripeEvent(stripe: BillingStripe, event: Stripe.Event): Promise<HandleResult> {
  if (await hasProcessedEvent(event.id)) return { status: "duplicate" };
  const result = await process(stripe, event);
  await markEventProcessed(event.id, event.type);
  return result;
}
