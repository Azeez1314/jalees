// Runs the recap narrative against the real model on synthetic transcripts and reports what it extracts.
// Usage: npm run try:recap [runsPerCase]   (needs OPENAI_API_KEY; costs a fraction of a cent per run)
import { config } from "dotenv";
import { scenarios } from "@/content/scenarios";
import { buildPatterns, fallbackNarrative, generateNarrative } from "@/lib/recap";

config({ path: ".env.local" });

type Line = ["L" | "B", string];
const cases: { name: string; scenario: string; expectFacts: "none" | "some"; lines: Line[]; mustNotMention?: RegExp; mustMention?: RegExp }[] = [
  {
    name: "lesson-only sentences (like the first real sessions)",
    scenario: "b1l4-where-is-it",
    expectFacts: "none",
    lines: [["B", "أَيْنَ الْكِتَابُ؟"], ["L", "الكتاب في البيت."], ["B", "وَأَيْنَ الْبَابُ؟"], ["L", "الباب في المدرسة"], ["B", "وَالْقَلَمُ؟"], ["L", "السرير في الغرفة."], ["L", "الصديق مع البنت."]],
  },
  {
    name: "role-play answers ('I am a student') are not facts",
    scenario: "b1l3-describe-things",
    expectFacts: "none",
    lines: [["B", "هَلْ أَنْتَ طَالِبٌ؟"], ["L", "نعم أنا طالب"], ["B", "هَلْ هُوَ مُدَرِّسٌ؟"], ["L", "لا هو طالب"]],
  },
  {
    name: "English asides: a real goal + family (keep) and a health detail (must NOT keep)",
    scenario: "b1l1-what-is-this",
    expectFacts: "some",
    mustMention: /qur|quran|koran|sister/i,
    mustNotMention: /knee|pain|hurt|health/i,
    lines: [
      ["B", "السَّلَامُ عَلَيْكُمْ. هَذَا بَابٌ. وَمَا هَذَا؟"],
      ["L", "هذا مفتاح"],
      ["L", "sorry in English: I'm learning Arabic so I can read the Qur'an. I have two sisters."],
      ["B", "وَمَا هَذَا؟"],
      ["L", "also my knee hurts a lot so I practise sitting down"],
      ["L", "هذا كرسي"],
    ],
  },
];

async function main() {
  const runs = Number(process.argv[2] ?? 5);
  let bad = 0;
  for (const c of cases) {
    const scenario = scenarios.find((s) => s.id === c.scenario)!;
    const transcript = c.lines.map(([r, t]) => ({ role: r === "L" ? ("learner" as const) : ("buddy" as const), text: t }));
    const learnerTurns = transcript.filter((t) => t.role === "learner").length;
    const fb = fallbackNarrative(scenario, learnerTurns, 0);
    console.log(`\n### ${c.name}`);
    let withFacts = 0, usedFallback = 0, mentionOk = 0, leaked = 0;
    for (let i = 0; i < runs; i++) {
      const n = await generateNarrative({ scenario, transcript, patterns: buildPatterns([]), learnerTurns });
      const joined = n.facts.join(" | ");
      if (n.facts.length) withFacts++;
      if (n.summary === fb.summary) usedFallback++;
      if (c.mustMention?.test(joined)) mentionOk++;
      if (c.mustNotMention?.test(joined + " " + n.summary + " " + n.wentWell + " " + n.nextStep)) leaked++;
      if (i === 0) console.log(`summary: ${n.summary}\nwent well: ${n.wentWell}\nnext: ${n.nextStep}`);
      console.log(`  run ${i + 1} facts: ${joined || "(none)"}`);
    }
    const factsOk = c.expectFacts === "none" ? withFacts === 0 : mentionOk >= Math.ceil(runs * 0.6);
    console.log(`=> facts in ${withFacts}/${runs} runs; fallback used ${usedFallback}/${runs}${c.mustMention ? `; goal/family captured ${mentionOk}/${runs}` : ""}${c.mustNotMention ? `; health leaked ${leaked}/${runs}` : ""} ${factsOk && !leaked ? "✓" : "✗"}`);
    if (!factsOk || leaked) bad++;
  }
  if (bad) {
    console.error(`\n${bad} case(s) behaved unexpectedly.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
