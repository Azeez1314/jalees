// Runs a scripted conversation through the real turn pipeline (prompt -> model -> leak guard). No DB, no auth.
// Usage: npm run try:turn -- <scenarioId> "learner msg 1" "learner msg 2" ...
// Needs OPENAI_API_KEY (in .env.local or the environment).
import { config } from "dotenv";
import { scenarios } from "@/content/scenarios";
import { generateBuddyTurn, type HistoryTurn } from "@/lib/turn";

config({ path: ".env.local" });

async function main() {
  const [scenarioId, ...lines] = process.argv.slice(2);
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario || !lines.length) {
    console.error(`Usage: npm run try:turn -- <scenarioId> "msg" ...\nScenarios: ${scenarios.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }

  console.log(`# ${scenario.title} (lesson ${scenario.lessonNo})\nbuddy: ${scenario.openingLine}\n`);
  const history: HistoryTurn[] = [{ role: "buddy", text: scenario.openingLine }];

  for (const learnerText of lines) {
    const r = await generateBuddyTurn({ scenario, history, learnerText, recentMistakes: [] });
    console.log(`learner: ${learnerText}`);
    console.log(`buddy:   ${r.textDiacritized}`);
    if (r.recast) console.log(`  recast [${r.recast.errorType}]: "${r.recast.original}" -> "${r.recast.corrected}"  (promptRepeat=${r.promptRepeat})`);
    if (r.retried) console.log(`  (guard retried${r.recastRejected ? ", recast discarded" : ""})`);
    if (r.vocabFlags.length) console.log(`  ! still outside lesson vocab: ${r.vocabFlags.join("، ")}`);
    console.log();
    history.push({ role: "learner", text: learnerText }, { role: "buddy", text: r.textDiacritized });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
