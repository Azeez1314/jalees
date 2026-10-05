import { scenarios } from "@/content/scenarios";
import { addFact, listFacts } from "@/lib/memory";
import { countVoiceTurns, getRecap, getTurns, saveRecap, type SessionRow } from "@/lib/queries";
import { buildPatterns, generateNarrative, type Recap } from "@/lib/recap";

export type RecapResult = { recap: Recap } | { error: string; status: number };

/**
 * Returns the session's recap, generating and saving it on first call. Idempotent: an existing recap is returned untouched,
 * so refreshes and double-clicks never spend another model call or re-add facts. `session` must already be verified as
 * belonging to `userId`.
 */
export async function getOrCreateRecap(userId: string, session: SessionRow): Promise<RecapResult> {
  const existing = await getRecap(userId, session.id);
  if (existing) return { recap: existing };

  const scenario = scenarios.find((s) => s.id === session.scenarioId);
  if (!scenario) return { error: "Scenario no longer exists", status: 410 };

  const turns = await getTurns(session.id);
  const learnerTurns = turns.filter((t) => t.role === "learner").length;
  if (!learnerTurns) return { error: "Say or type something in this session first, then finish it.", status: 422 };

  const patterns = buildPatterns(turns.flatMap((t) => (t.recast ? [t.recast] : [])));
  const transcript = turns.map((t) => ({
    role: t.role,
    text: t.role === "learner" ? (t.transcriptRaw ?? t.textDisplay) : t.textDisplay,
  }));
  const knownFacts = (await listFacts(userId)).slice(0, 8).map((f) => f.fact);
  const narrative = await generateNarrative({ scenario, transcript, patterns, learnerTurns, knownFacts });

  const newFacts: Recap["newFacts"] = [];
  for (const fact of narrative.facts) {
    const added = await addFact(userId, fact, "conversation", session.id);
    if (added.ok && added.fact) newFacts.push({ id: added.fact.id, fact: added.fact.fact });
  }

  const recap: Recap = {
    generatedAt: new Date().toISOString(),
    stats: { learnerTurns, voiceTurns: await countVoiceTurns(session.id) },
    summary: narrative.summary,
    wentWell: narrative.wentWell,
    nextStep: narrative.nextStep,
    patterns,
    newFacts,
  };
  if (await saveRecap(userId, session.id, recap)) return { recap };
  // Another request saved first; return theirs.
  const winner = await getRecap(userId, session.id);
  return winner ? { recap: winner } : { error: "Couldn't save the recap.", status: 500 };
}
