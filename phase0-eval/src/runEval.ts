import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import OpenAI from "openai";
import { lessons, cumulativeVocab } from "./lessons.js";
import { buildTestConversations } from "./testConversations.js";
import { checkVocab } from "./tokenizer.js";
import { getBuddyTurn, getGrammarViolations } from "./grader.js";
import type { EvalCase } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, "..", "results");

async function runLesson(client: OpenAI, lessonNo: number): Promise<EvalCase[]> {
  const allowedVocab = cumulativeVocab(lessonNo);
  const seeds = buildTestConversations(lessonNo);
  const cases: EvalCase[] = [];

  for (const seed of seeds) {
    const evalCase: EvalCase = {
      lesson: lessonNo,
      scenario: seed.title,
      learnerTurn: seed.learnerTurn,
      buddyTurn: null,
      vocabViolations: [],
      grammarViolations: [],
    };
    try {
      const buddyTurn = await getBuddyTurn(client, lessonNo, seed.title, seed.learnerTurn);
      evalCase.buddyTurn = buddyTurn;
      evalCase.vocabViolations = checkVocab(buddyTurn.reply_diacritized, allowedVocab);
      evalCase.grammarViolations = await getGrammarViolations(client, lessonNo, buddyTurn.reply_diacritized);
    } catch (err) {
      evalCase.error = err instanceof Error ? err.message : String(err);
    }
    cases.push(evalCase);
  }
  return cases;
}

function writeReport(lessonNo: number, cases: EvalCase[]) {
  const lesson = lessons.find((l) => l.lessonNo === lessonNo)!;
  const total = cases.length;
  const errored = cases.filter((c) => c.error).length;
  const withVocabLeak = cases.filter((c) => c.vocabViolations.length > 0).length;
  const withGrammarLeak = cases.filter((c) => c.grammarViolations.length > 0).length;
  const clean = cases.filter(
    (c) => !c.error && c.vocabViolations.length === 0 && c.grammarViolations.length === 0
  ).length;

  const lines: string[] = [];
  lines.push(`# Phase 0 eval — Lesson ${lessonNo}: ${lesson.title}`);
  lines.push("");
  lines.push(`- Cases run: ${total}`);
  lines.push(`- Errored (API/parse failure): ${errored}`);
  lines.push(`- Clean (no flagged vocab or grammar): ${clean} (${((clean / total) * 100).toFixed(0)}%)`);
  lines.push(`- Cases with vocab flags: ${withVocabLeak}`);
  lines.push(`- Cases with grammar flags: ${withGrammarLeak}`);
  lines.push("");
  lines.push("## Flagged cases");
  lines.push("");

  for (const c of cases) {
    if (c.error) {
      lines.push(`### ⚠️ ERROR — scenario: ${c.scenario}`);
      lines.push(`- Learner turn: ${c.learnerTurn}`);
      lines.push(`- Error: ${c.error}`);
      lines.push("");
      continue;
    }
    if (c.vocabViolations.length === 0 && c.grammarViolations.length === 0) continue;
    lines.push(`### Scenario: ${c.scenario}`);
    lines.push(`- Learner turn: ${c.learnerTurn}`);
    lines.push(`- Buddy reply: ${c.buddyTurn?.reply_diacritized}`);
    if (c.vocabViolations.length) {
      lines.push(`- Vocab flags: ${c.vocabViolations.map((v) => v.token).join(", ")}`);
    }
    if (c.grammarViolations.length) {
      for (const g of c.grammarViolations) {
        lines.push(`- Grammar flag [${g.severity}]: ${g.structure} — "${g.evidence}"`);
      }
    }
    lines.push("");
  }

  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(path.join(RESULTS_DIR, `lesson-${lessonNo}.md`), lines.join("\n"));
  console.log(
    `Lesson ${lessonNo}: ${clean}/${total} clean, ${withVocabLeak} vocab flags, ${withGrammarLeak} grammar flags, ${errored} errors -> results/lesson-${lessonNo}.md`
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  const client = new OpenAI();

  const lessonArgIdx = process.argv.indexOf("--lesson");
  const onlyLesson = lessonArgIdx >= 0 ? Number(process.argv[lessonArgIdx + 1]) : undefined;
  const targets = onlyLesson ? lessons.filter((l) => l.lessonNo === onlyLesson) : lessons;

  for (const lesson of targets) {
    console.log(`Running lesson ${lesson.lessonNo} (${lesson.title})...`);
    const cases = await runLesson(client, lesson.lessonNo);
    writeReport(lesson.lessonNo, cases);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
