// Placement checks (no network): the authored items are in-lesson, their example answers pass, typical mistakes fail,
// and the stop rule / outcomes behave. Run: npm run check:placement
import { cumulativeVocab, lessons } from "@/content/lessons";
import { placementItems } from "@/content/placement";
import { checkVocab } from "@/lib/vocab";
import { isFinished, maxContentLesson, nextItem, placeLearner, scoreAnswer, type ItemResult } from "@/lib/placement";
import { stripTashkeel } from "@/lib/arabic";
import { config } from "dotenv";

config({ path: ".env.local" });

let failed = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
};

// ---- authored content ------------------------------------------------------------------------------------------
const ids = placementItems.map((i) => i.id);
check(new Set(ids).size === ids.length, "item ids are unique");
check(placementItems.every((i, n) => n === 0 || i.lessonNo >= placementItems[n - 1].lessonNo), "items escalate: lessons never go down");
check(lessons.every((l) => placementItems.some((i) => i.lessonNo === l.lessonNo)), "every lesson with content has at least one placement item");
check(placementItems.every((i) => !/[؀-ۿ]/.test(i.prompt)), "prompts are English (no Arabic to copy)");
for (const item of placementItems) {
  const leaks = checkVocab(item.example, cumulativeVocab(item.lessonNo));
  check(leaks.length === 0, `${item.id} example stays inside lesson ${item.lessonNo} vocabulary`, leaks.map((l) => l.token).join(", "));
  check(scoreAnswer(item, item.example), `${item.id} example passes`);
  check(scoreAnswer(item, stripTashkeel(item.example)), `${item.id} passes without tashkeel (how learners type)`);
  for (const w of item.wrong) check(!scoreAnswer(item, w), `${item.id} rejects "${w}"`);
}

// ---- scoring details -------------------------------------------------------------------------------------------
const byId = (id: string) => placementItems.find((i) => i.id === id)!;
check(scoreAnswer(byId("p4a"), "الكتاب على الطاوله"), "ه typed for final ة is accepted");
check(scoreAnswer(byId("p4a"), "الكتاب على الطاولة هنا"), "an extra harmless word is allowed");
check(scoreAnswer(byId("p2a"), "ذاك البيت كبير"), "an alternative demonstrative (ذاك) is accepted");
check(scoreAnswer(byId("p3a"), "هل أنتِ طالبة؟"), "feminine alternative accepted (طالبة)");
check(!scoreAnswer(byId("p1a"), ""), "empty answer fails");
check(!scoreAnswer(byId("p1a"), "hadha bab"), "Latin transliteration fails (production must be Arabic)");
check(!scoreAnswer(byId("p1b"), "هذا بنت"), "wrong-gender demonstrative fails even with the right nouns");

// ---- ask order and stop rule -----------------------------------------------------------------------------------
const pass = (item: { id: string; lessonNo: number }): ItemResult => ({ itemId: item.id, lessonNo: item.lessonNo, pass: true });
const fail = (item: { id: string; lessonNo: number }): ItemResult => ({ itemId: item.id, lessonNo: item.lessonNo, pass: false });

check(nextItem([])?.id === "p1a", "starts with the first item");
check(nextItem([pass(placementItems[0])])?.id === "p1b", "then the next in order");
check(nextItem([fail(placementItems[0])]) === null, "the first miss ends placement immediately");
check(isFinished([fail(placementItems[0])]), "…and it reports finished");
check(!isFinished([pass(placementItems[0])]), "not finished mid-way");
check(nextItem(placementItems.map(pass)) === null && isFinished(placementItems.map(pass)), "all passed → finished");

// ---- outcomes --------------------------------------------------------------------------------------------------
const missAt = (idx: number) => [...placementItems.slice(0, idx).map(pass), fail(placementItems[idx])];
check(placeLearner(missAt(0)).lesson === 1, "misses the first item → lesson 1");
check(placeLearner(missAt(1)).lesson === 1, "misses the second L1 item → lesson 1");
check(placeLearner(missAt(2)).lesson === 2, "passes L1, misses L2 → lesson 2");
check(placeLearner(missAt(5)).lesson === 3, "misses the second L3 item → lesson 3");
check(placeLearner(missAt(8)).lesson === 5, "passes through L4, misses L5 → lesson 5");
const all = placeLearner(placementItems.map(pass));
check(all.lesson === 5 && all.beyondContent, "passes everything → lesson 5 and 'beyond content' (nothing further exists yet)", JSON.stringify(all));
// extends automatically: if the content grew a lesson 6 with no placement items yet, a perfect score starts at 6, not 'beyond'.
const grown = placeLearner(placementItems.map(pass), placementItems, 6);
check(grown.lesson === 6 && !grown.beyondContent, "if content has a lesson 6, a perfect score starts there (not 'beyond content')", JSON.stringify(grown));
check(maxContentLesson() === 5, "content currently ends at lesson 5");

async function db() {
  if (!process.env.DATABASE_URL) {
    console.log("- skipped DB checks (no DATABASE_URL)");
    return;
  }
  const { runPlacementDb } = await import("./placement-db-checks");
  await runPlacementDb(check);
}

db()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll placement checks pass.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
