import Link from "next/link";
import type { Access } from "@/lib/billing";
import { PRICE_LABEL } from "@/lib/plans";

/** Trial / expired notice for the dashboard. Quiet while the trial is comfortable; clear once it matters. */
export function AccessBanner({ access }: { access: Access }) {
  if (access.reason === "subscribed" || access.reason === "comp") return null;

  if (access.reason === "expired") {
    return (
      <div role="status" className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-warn">
        <p className="font-medium">Your free trial has ended.</p>
        <p className="mt-0.5 text-sm">
          Subscribe ({PRICE_LABEL}) to keep talking with your buddy. Reviewing your mistakes and your notes stay open.
        </p>
        <Link href="/learn/billing" className="mt-2 inline-block rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink hover:opacity-90">
          Subscribe
        </Link>
      </div>
    );
  }

  const urgent = access.trialDaysLeft <= 2;
  return (
    <p className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2 text-sm ${urgent ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent"}`}>
      <span>
        Free trial: {access.trialDaysLeft} {access.trialDaysLeft === 1 ? "day" : "days"} left
      </span>
      <Link href="/learn/billing" className="underline">
        See plan
      </Link>
    </p>
  );
}
