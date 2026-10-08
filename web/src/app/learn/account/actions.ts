"use server";

import { redirect } from "next/navigation";
import { deleteUserData } from "@/lib/account";
import { auth, getUser } from "@/lib/auth/server";
import { billingConfigured, stripe } from "@/lib/stripe";
import { getSubscription } from "@/lib/subscriptions";

export interface DeleteState {
  error?: string;
}

/**
 * Deletes the learner's data. Order matters: stop billing first (so nobody is charged after deleting), then our rows, then the
 * sign-in account. If the auth provider refuses to delete the account itself we still finish and say so on the next page.
 */
export async function deleteMyData(_prev: DeleteState | null, formData: FormData): Promise<DeleteState> {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") {
    return { error: 'Type DELETE (in capitals) to confirm.' };
  }

  // 1. Cancel any Stripe subscription. If this fails we stop: deleting data while still billing would be the worst outcome.
  const sub = await getSubscription(user.id);
  if (sub?.stripeSubscriptionId && sub.plan === "monthly" && ["active", "trialing", "past_due", "unpaid"].includes(sub.status)) {
    if (!billingConfigured()) return { error: "We couldn't reach our payment provider to cancel your subscription, so nothing was deleted. Please try again shortly." };
    try {
      await stripe().subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      console.error("stripe cancel failed during deletion", err);
      return { error: "We couldn't cancel your subscription, so nothing was deleted. Please try again, or use Manage billing first." };
    }
  }

  // 2. Our data.
  await deleteUserData(user.id);

  // 3. The sign-in account (best effort: depends on the auth provider allowing self-deletion).
  let accountRemoved = false;
  try {
    const result = await auth.deleteUser({});
    accountRemoved = !("error" in result && result.error);
  } catch {
    accountRemoved = false;
  }
  if (!accountRemoved) {
    try {
      await auth.signOut();
    } catch {
      // already signed out
    }
  }
  redirect(`/?deleted=${accountRemoved ? "all" : "data"}`);
}
