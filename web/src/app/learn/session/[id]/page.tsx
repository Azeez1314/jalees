import { notFound, redirect } from "next/navigation";
import { scenarios } from "@/content/scenarios";
import { getUser } from "@/lib/auth/server";
import { getOrCreateProfile, getSession, getTurns } from "@/lib/queries";
import { getUsage } from "@/lib/usage";
import { Conversation } from "./Conversation";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: PageProps<"/learn/session/[id]">) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");

  const session = await getSession(user.id, id);
  if (!session) notFound();
  const scenario = scenarios.find((s) => s.id === session.scenarioId);
  if (!scenario) notFound();

  const [profile, turns, usage] = await Promise.all([
    getOrCreateProfile(user.id, user.name ?? null),
    getTurns(id),
    getUsage(user.id),
  ]);

  return (
    <Conversation
      sessionId={id}
      scenarioId={scenario.id}
      title={scenario.title}
      goal={scenario.goal}
      initialTurns={turns.map((t) => ({
        id: t.id,
        role: t.role,
        textDisplay: t.textDisplay,
        textDiacritized: t.textDiacritized,
        recast: t.recast,
        promptRepeat: t.promptRepeat,
      }))}
      initialTashkeel={profile.tashkeelPref === "full"}
      initialRemainingSeconds={Math.round(usage.remainingSeconds)}
    />
  );
}
