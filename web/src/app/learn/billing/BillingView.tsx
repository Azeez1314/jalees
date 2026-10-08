import Link from "next/link";
import type { Access } from "@/lib/billing";
import { PRICE_LABEL, TRIAL_DAYS } from "@/lib/plans";
import { manageBilling, subscribe } from "./actions";
import { AutoRefresh } from "./AutoRefresh";

const ERRORS: Record<string, string> = {
  "not-configured": "Billing isn't set up on this server yet.",
  checkout: "We couldn't open the payment page. Please try again in a moment.",
  portal: "We couldn't open the billing portal. Please try again in a moment.",
};

const fmt = (d: Date) => d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

/** The billing screen as a plain component (the page loads the data), so every state can be previewed with mock data. */
export function BillingView(props: {
  access: Access;
  /** Next renewal for a live subscription. */
  renewsOn: Date | null;
  configured: boolean;
  hasStripeCustomer: boolean;
  checkout: string | null;
  reason: string | null;
  errorCode: string | null;
}) {
  const { access, renewsOn, configured, hasStripeCustomer, checkout, reason, errorCode } = props;
  const error = errorCode ? ERRORS[errorCode] : null;
  const waitingForStripe = checkout === "success" && access.reason !== "subscribed";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      {waitingForStripe && <AutoRefresh />}
      <Link href="/learn" className="text-sm text-muted underline">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your plan</h1>

      {checkout === "success" && (
        <p role="status" className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-accent">
          {access.reason === "subscribed" ? "Thank you — you're subscribed." : "Thank you! Confirming your payment — this page updates by itself."}
        </p>
      )}
      {checkout === "cancelled" && <p className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-muted">No payment was made. You can subscribe whenever you like.</p>}
      {reason === "expired" && access.reason === "expired" && (
        <p role="status" className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-warn">Your free trial has ended — subscribe to start a new conversation.</p>
      )}
      {error && <p role="alert" className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-warn">{error}</p>}

      <section className="mt-6 rounded-xl border border-line bg-card p-5">
        {access.reason === "subscribed" && (
          <>
            <p className="text-lg font-semibold">Subscribed · {PRICE_LABEL}</p>
            <p className="mt-1 text-muted">
              {access.endsAt
                ? `Your subscription ends on ${fmt(access.endsAt)}. You keep full access until then.`
                : renewsOn
                  ? `Renews on ${fmt(renewsOn)}.`
                  : "Thanks for supporting Jalees."}
            </p>
          </>
        )}
        {access.reason === "comp" && (
          <>
            <p className="text-lg font-semibold">Complimentary access</p>
            <p className="mt-1 text-muted">
              {access.endsAt ? `Your free access runs until ${fmt(access.endsAt)}.` : "You have free access to Jalees."}
            </p>
          </>
        )}
        {access.reason === "trial" && (
          <>
            <p className="text-lg font-semibold">
              Free trial · {access.trialDaysLeft} {access.trialDaysLeft === 1 ? "day" : "days"} left
            </p>
            <p className="mt-1 text-muted">
              Everything is included during your {TRIAL_DAYS}-day trial, and no card is needed. After that, Jalees is {PRICE_LABEL}.
            </p>
          </>
        )}
        {access.reason === "expired" && (
          <>
            <p className="text-lg font-semibold">Your free trial has ended</p>
            <p className="mt-1 text-muted">
              Jalees is {PRICE_LABEL} — less than one hour with a tutor. Subscribe to keep talking with your buddy.
              Reviewing your mistakes, your notes and your data stay open either way.
            </p>
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {access.reason !== "subscribed" && access.reason !== "comp" && (
            <form action={subscribe}>
              <button
                disabled={!configured}
                className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
              >
                Subscribe — {PRICE_LABEL}
              </button>
            </form>
          )}
          {hasStripeCustomer && (
            <form action={manageBilling}>
              <button disabled={!configured} className="rounded-lg border border-line px-5 py-2.5 hover:bg-accent-soft disabled:opacity-50">
                Manage billing
              </button>
            </form>
          )}
        </div>
        {!configured && <p className="mt-3 text-sm text-muted">Payments aren&apos;t switched on for this server yet.</p>}
        <p className="mt-4 text-sm text-muted">
          Cancel any time from &ldquo;Manage billing&rdquo;. Payments are handled by Stripe — we never see your card.
        </p>
      </section>
    </main>
  );
}
