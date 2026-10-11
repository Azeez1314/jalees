// Prototype evaluation: how are learners doing on the speaking track? Reads stored sessions, no model calls.
// Run: npm run report:speaking
import { config } from "dotenv";
import { cumulativeVocab, normalizeArabic } from "@/content/lessons";
import { sql } from "@/lib/db";

config({ path: ".env.local" });

const ARABIC_WORD = /[ء-غـ-ٰٟ]+/g;
const words = (t: string) => (t.match(ARABIC_WORD) ?? []).map(normalizeArabic).filter((w) => w.length > 1);

async function main() {
  const db = sql();
  const rows = await db`
    SELECT s.id AS session_id, s.user_id, s.scenario_id, s.started_at,
           t.role, t.transcript_raw, t.recast, t.input_mode, t.audio_seconds
    FROM sessions s JOIN turns t ON t.session_id = s.id
    WHERE s.scenario_id LIKE 'sp-%'
    ORDER BY s.started_at, t.created_at, t.id`;
  if (!rows.length) {
    console.log("No speaking-track sessions yet.");
    return;
  }

  const known = cumulativeVocab(23); // Book 1 only — a rough "already-taught" reference until Books 2-3 are authored
  type Agg = { learner: number; words: number; voice: number; seconds: number; recasts: number; upgrades: number; distinct: Set<string>; user: string; scenario: string; started: string; lens: number[] };
  const bySession = new Map<string, Agg>();
  for (const r of rows) {
    const a: Agg =
      bySession.get(r.session_id) ??
      { learner: 0, words: 0, voice: 0, seconds: 0, recasts: 0, upgrades: 0, distinct: new Set<string>(), user: r.user_id, scenario: r.scenario_id, started: r.started_at, lens: [] };
    bySession.set(r.session_id, a);
    if (r.role === "learner") {
      const w = words(String(r.transcript_raw ?? ""));
      a.learner++;
      a.words += w.length;
      a.lens.push(w.length);
      w.forEach((x) => a.distinct.add(x));
      if (r.input_mode === "voice") {
        a.voice++;
        a.seconds += Number(r.audio_seconds ?? 0);
      }
    } else if (r.recast) {
      // An "upgrade" is stored as a recast with error type "other"; real corrections have a concrete type.
      if ((r.recast as { errorType?: string }).errorType === "other") a.upgrades++;
      else a.recasts++;
    }
  }

  console.log("session            user          scenario            turns  words/turn  1st→last  voice  fixes  upgrades");
  const users = new Set<string>();
  let turns = 0, wordsTotal = 0;
  const outside = new Map<string, number>();
  for (const [id, a] of bySession) {
    users.add(a.user);
    turns += a.learner;
    wordsTotal += a.words;
    for (const w of a.distinct) if (!known.has(w)) outside.set(w, (outside.get(w) ?? 0) + 1);
    const first = a.lens[0] ?? 0, last = a.lens[a.lens.length - 1] ?? 0;
    console.log(
      `${id.slice(0, 8)}  ${a.user.slice(0, 10).padEnd(12)}  ${a.scenario.padEnd(18)}  ${String(a.learner).padStart(5)}  ${(a.words / Math.max(1, a.learner)).toFixed(1).padStart(10)}  ${`${first}→${last}`.padStart(8)}  ${String(a.voice).padStart(5)}  ${String(a.recasts).padStart(5)}  ${String(a.upgrades).padStart(8)}`
    );
  }
  console.log(
    `\n${bySession.size} sessions, ${users.size} learners, ${turns} learner turns, ${(wordsTotal / Math.max(1, turns)).toFixed(1)} words per turn on average.`
  );
  console.log(`Words used that are outside the Book 1 lists (a rough 'stretch' measure): ${outside.size} distinct.`);
  console.log([...outside.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w, n]) => `${w}×${n}`).join("  "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
