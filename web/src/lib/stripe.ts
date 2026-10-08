import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazy, so `next build` and the offline checks work without STRIPE_SECRET_KEY set. */
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set (see web/.env.example)");
    client = new Stripe(key);
  }
  return client;
}

export function requireEnv(name: "STRIPE_PRICE_ID" | "STRIPE_WEBHOOK_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see web/.env.example)`);
  return value;
}

/** Public base URL, used for Stripe return links. Set APP_URL in production; localhost is the dev default. */
export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** True when billing is configured (the UI hides Subscribe instead of crashing when it isn't). */
export function billingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
