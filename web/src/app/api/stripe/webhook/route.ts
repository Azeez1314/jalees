import { handleStripeEvent, realBillingStripe } from "@/lib/stripe-sync";
import { requireEnv, stripe } from "@/lib/stripe";

// Stripe needs the exact raw body to verify the signature, so read it as text and never parse it first.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch {
    // Not from Stripe (or the secret is wrong / the body was altered).
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(realBillingStripe(stripe()), event);
    return Response.json({ received: true, result: result.status });
  } catch (err) {
    console.error("stripe webhook failed", event.type, event.id, err);
    return Response.json({ error: "Handler failed" }, { status: 500 }); // non-2xx: Stripe retries for up to 3 days
  }
}
