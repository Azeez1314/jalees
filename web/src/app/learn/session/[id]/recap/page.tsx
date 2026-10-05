import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { scenarios } from "@/content/scenarios";
import { getUser } from "@/lib/auth/server";
import { listFacts } from "@/lib/memory";
import { countDueMistakes } from "@/lib/mistake-bank";
import { getRecap, getSession } from "@/lib/queries";
import { GenerateRecap } from "./GenerateRecap";
import { RecapView } from "./RecapView";

export const dynamic = "force-dynamic";

export default async function RecapPage({ params }: PageProps<"/learn/session/[id]/recap">) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");

  const session = await getSession(user.id, id);
  if (!session) notFound();
  const scenario = scenarios.find((s) => s.id === session.scenarioId);
  if (!scenario) notFound();

  const recap = await getRecap(user.id, id);

  const header = (
    <>
      <Link href={`/learn/session/${id}`} className="text-sm text-muted underline">
        ← Back to the conversation
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Session recap</h1>
      <p className="text-muted">{scenario.title}</p>
    </>
  );

  if (!recap) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        {header}
        <GenerateRecap sessionId={id} />
      </main>
    );
  }

  // Only offer "Forget" for facts that still exist (the learner may already have removed them).
  const remembered = new Set((await listFacts(user.id)).map((f) => f.id));

  return (
    <RecapView
      sessionId={id}
      scenarioTitle={scenario.title}
      recap={recap}
      newFacts={recap.newFacts.filter((f) => remembered.has(f.id))}
      dueCount={await countDueMistakes(user.id)}
    />
  );
}
