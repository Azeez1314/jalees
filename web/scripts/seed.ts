// Syncs src/content/{lessons,scenarios}.ts into the lessons/scenarios tables. Idempotent. Run: npm run db:seed
// The code is the source of truth (runtime reads it directly); the tables exist so sessions can reference scenarios
// and so content can be joined in SQL analytics.
import { config } from "dotenv";
import { lessons } from "@/content/lessons";
import { scenarios } from "@/content/scenarios";
import { sql } from "@/lib/db";

config({ path: ".env.local" });

async function main() {
  const db = sql();

  for (const l of lessons) {
    await db`
      INSERT INTO lessons (book, lesson_no, title, vocab, grammar)
      VALUES (${l.book}, ${l.lessonNo}, ${l.title}, ${JSON.stringify(l.newVocab)}::jsonb, ${JSON.stringify(l.newGrammar)}::jsonb)
      ON CONFLICT (book, lesson_no) DO UPDATE
        SET title = EXCLUDED.title, vocab = EXCLUDED.vocab, grammar = EXCLUDED.grammar`;
  }

  for (const s of scenarios) {
    await db`
      INSERT INTO scenarios (id, lesson_id, title, goal, opening_line, target_structures)
      VALUES (
        ${s.id},
        (SELECT id FROM lessons WHERE book = 1 AND lesson_no = ${s.lessonNo}),
        ${s.title}, ${s.goal}, ${s.openingLine}, ${JSON.stringify(s.targetStructures)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE
        SET lesson_id = EXCLUDED.lesson_id, title = EXCLUDED.title, goal = EXCLUDED.goal,
            opening_line = EXCLUDED.opening_line, target_structures = EXCLUDED.target_structures`;
  }

  console.log(`Seeded ${lessons.length} lessons and ${scenarios.length} scenarios.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
