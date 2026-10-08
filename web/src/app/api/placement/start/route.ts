import { getUser } from "@/lib/auth/server";
import { startAttempt } from "@/lib/placement-store";
import { getOrCreateProfile } from "@/lib/queries";

/** Starts (or resumes) the placement test. Free for everyone: it uses no AI, so it isn't behind the paywall. */
export async function POST() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  await getOrCreateProfile(user.id, user.name ?? null); // the result updates the profile, so make sure it exists
  const state = await startAttempt(user.id);
  return Response.json({ attemptId: state.attemptId, index: state.index, prompt: state.item?.prompt ?? null, done: state.done, placement: state.placement });
}
