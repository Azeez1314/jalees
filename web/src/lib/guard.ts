import { getAccess } from "@/lib/subscriptions";

export const SUBSCRIPTION_REQUIRED = "subscription_required";

/**
 * For routes that spend money on AI (turns, speech in/out). Returns a ready-made 402 Response when the learner's trial is over
 * and they have no subscription, otherwise null. Review, memory, recap, billing and account routes deliberately don't call this.
 */
export async function paywall(userId: string): Promise<Response | null> {
  const access = await getAccess(userId);
  if (access.allowed) return null;
  return Response.json(
    { error: "Your free trial has ended. Subscribe to keep practising with your buddy — review and your notes stay open.", code: SUBSCRIPTION_REQUIRED },
    { status: 402 }
  );
}
