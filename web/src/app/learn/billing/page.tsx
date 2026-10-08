import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { billingConfigured } from "@/lib/stripe";
import { getAccess, getSubscription } from "@/lib/subscriptions";
import { BillingView } from "./BillingView";

export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null);

export default async function BillingPage({ searchParams }: PageProps<"/learn/billing">) {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  const params = await searchParams;
  const [access, subscription] = await Promise.all([getAccess(user.id), getSubscription(user.id)]);

  return (
    <BillingView
      access={access}
      renewsOn={subscription?.currentPeriodEnd ?? null}
      configured={billingConfigured()}
      hasStripeCustomer={Boolean(subscription?.stripeCustomerId)}
      checkout={one(params.checkout)}
      reason={one(params.reason)}
      errorCode={one(params.error)}
    />
  );
}
