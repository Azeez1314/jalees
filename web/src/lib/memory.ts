import { sql } from "@/lib/db";
import { MAX_FACTS, factKey, sanitizeFact } from "@/lib/facts";

export interface Fact {
  id: string;
  fact: string;
  source: "learner" | "conversation";
  createdAt: string;
}

export async function listFacts(userId: string): Promise<Fact[]> {
  const rows = await sql()`
    SELECT id, fact, source, created_at FROM memory_facts WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return rows.map((r) => ({ id: r.id, fact: r.fact, source: r.source, createdAt: r.created_at }));
}

export type AddFactResult = { ok: true; fact: Fact | null } | { ok: false; error: string };

/**
 * Stores a fact if it passes sanitizing, isn't a duplicate (`fact: null` = already remembered) and the learner is under the
 * cap. The cap check lives in the INSERT itself so concurrent adds can't overshoot it.
 */
export async function addFact(
  userId: string,
  raw: string,
  source: "learner" | "conversation",
  sessionId: string | null = null
): Promise<AddFactResult> {
  const clean = sanitizeFact(raw);
  if ("error" in clean) return { ok: false, error: clean.error };

  const rows = await sql().query(
    `INSERT INTO memory_facts (user_id, fact, key, source, source_session_id)
     SELECT $1, $2, $3, $4, $5
     WHERE (SELECT count(*) FROM memory_facts WHERE user_id = $1) < $6
     ON CONFLICT (user_id, key) DO NOTHING
     RETURNING id, fact, source, created_at`,
    [userId, clean.fact, factKey(clean.fact), source, sessionId, MAX_FACTS]
  );
  if (rows.length) {
    const r = rows[0];
    return { ok: true, fact: { id: r.id, fact: r.fact, source: r.source, createdAt: r.created_at } };
  }
  // No row: either a duplicate (fine) or the cap was hit.
  const dup = await sql().query(`SELECT 1 FROM memory_facts WHERE user_id = $1 AND key = $2`, [userId, factKey(clean.fact)]);
  if (dup.length) return { ok: true, fact: null };
  return { ok: false, error: `The buddy can remember up to ${MAX_FACTS} things — remove one to add another.` };
}

export async function deleteFact(userId: string, factId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(factId)) return false;
  const rows = await sql()`DELETE FROM memory_facts WHERE id = ${factId} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function deleteAllFacts(userId: string): Promise<number> {
  const rows = await sql()`DELETE FROM memory_facts WHERE user_id = ${userId} RETURNING id`;
  return rows.length;
}

/**
 * A few facts for the buddy to keep in mind this session. Stateless rotation: the order is fixed within a session (so the
 * buddy is consistent turn to turn) but differs between sessions (so it doesn't dwell on the same facts every time).
 */
export async function pickFactsForSession(userId: string, sessionId: string, n: number): Promise<string[]> {
  const rows = await sql()`
    SELECT fact FROM memory_facts WHERE user_id = ${userId}
    ORDER BY md5(id::text || ${sessionId}) LIMIT ${n}`;
  return rows.map((r) => r.fact as string);
}
