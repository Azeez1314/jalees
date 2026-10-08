"use server";

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { createCheckoutUrl, createPortalUrl } from "@/lib/checkout";
import { billingConfigured } from "@/lib/stripe";

async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}

/** Sends the learner to Stripe Checkout. Server action + redirect, so it works without client JavaScript. */
export async function subscribe() {
  const user = await requireUser();
  if (!billingConfigured()) redirect("/learn/billing?error=not-configured");
  let url: string;
  try {
    url = await createCheckoutUrl(user.id, user.email ?? null);
  } catch (err) {
    console.error("checkout failed", err);
    redirect("/learn/billing?error=checkout");
  }
  redirect(url); // outside the try: redirect() works by throwing
}

export async function manageBilling() {
  const user = await requireUser();
  if (!billingConfigured()) redirect("/learn/billing?error=not-configured");
  let url: string | null;
  try {
    url = await createPortalUrl(user.id);
  } catch (err) {
    console.error("portal failed", err);
    redirect("/learn/billing?error=portal");
  }
  redirect(url ?? "/learn/billing");
}
