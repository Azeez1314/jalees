/**
 * Who may talk to the buddy. Pure (no I/O) so the whole matrix is unit-tested offline (npm run check:billing).
 * After the trial, conversations (turns, speech in/out, starting sessions) are locked; review, memory, billing and
 * account/data pages stay open — the callers decide which routes to guard, this only answers "has access?".
 */

export type AccessReason = "subscribed" | "comp" | "trial" | "expired";

export interface Access {
  allowed: boolean;
  reason: AccessReason;
  /** When the trial ends/ended (null if unknown). */
  trialEndsAt: Date | null;
  /** Whole days of trial left (0 once over; only meaningful while reason === "trial"). */
  trialDaysLeft: number;
  /** A subscription that will end at the period end (cancelled but still paid up). */
  endsAt: Date | null;
}

export interface SubscriptionState {
  status: string;
  plan: "monthly" | "comp";
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
}

/** Stripe statuses that keep access. past_due is a grace period: Stripe is still retrying the card. */
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

const DAY_MS = 86_400_000;

export function decideAccess(trialEndsAt: Date | null, subscription: SubscriptionState | null, now: Date = new Date()): Access {
  const trialMs = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0;
  const trialDaysLeft = trialMs > 0 ? Math.ceil(trialMs / DAY_MS) : 0;
  const base = { trialEndsAt, trialDaysLeft, endsAt: null as Date | null };

  if (subscription) {
    if (subscription.plan === "comp") {
      // A comp may be open-ended (no period end) or time-limited.
      const open = !subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > now.getTime();
      if (open && subscription.status === "active") return { ...base, allowed: true, reason: "comp", endsAt: subscription.currentPeriodEnd };
    } else if (PAID_STATUSES.has(subscription.status)) {
      // A cancelled-at-period-end subscription is still paid for until then; after it the status becomes canceled anyway,
      // but guard on the date too in case the "deleted" webhook is late.
      const stillPaid = !subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > now.getTime() || !subscription.cancelAtPeriodEnd;
      if (stillPaid) {
        return {
          ...base,
          allowed: true,
          reason: "subscribed",
          endsAt: subscription.cancelAtPeriodEnd ? subscription.currentPeriodEnd : null,
        };
      }
    }
  }

  if (trialMs > 0) return { ...base, allowed: true, reason: "trial" };
  return { ...base, allowed: false, reason: "expired" };
}

/** Subscription states we write from Stripe's own `status` field; anything unknown is treated as not paid. */
export function isPaidStatus(status: string): boolean {
  return PAID_STATUSES.has(status);
}
