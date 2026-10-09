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
check(scoreAnswer(byId("p4b"), "ذهب خالد الى المدرسه"), "ه typed for final ة and ى typed as ا are accepted");
check(scoreAnswer(byId("p4a"), "الكتاب على المكتب هنا"), "an extra harmless word is allowed");
check(scoreAnswer(byId("p2a"), "هذا سكر وذاك لبن"), "an alternative demonstrative (ذاك), with a fused و, is accepted");
check(scoreAnswer(byId("p2a"), "هذا سكر ذلك لبن"), "…and so is the same answer without the و");
check(scoreAnswer(byId("p9a"), "أنا طالبة جديدة"), "feminine alternative accepted (طالبة جديدة)");
check(scoreAnswer(byId("p1b"), "أهذا بيت"), "a yes/no question with أ is accepted");
check(scoreAnswer(byId("p1b"), "هذا بيت"), "…and so is the plain statement (we test the words, not the punctuation)");
check(!scoreAnswer(byId("p1a"), ""), "empty answer fails");
check(!scoreAnswer(byId("p1a"), "hadha bab"), "Latin transliteration fails (production must be Arabic)");
check(!scoreAnswer(byId("p6a"), "هذا سيارة جديدة"), "wrong-gender demonstrative fails even with the right nouns");

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
const missAtId = (id: string) => missAt(placementItems.findIndex((i) => i.id === id));
check(placeLearner(missAt(0)).lesson === 1, "misses the first item → lesson 1");
check(placeLearner(missAtId("p1b")).lesson === 1, "misses the second L1 item → lesson 1");
check(placeLearner(missAtId("p2a")).lesson === 2, "passes L1, misses L2 → lesson 2");
check(placeLearner(missAtId("p4b")).lesson === 4, "passes L4's first item, misses its second → lesson 4");
check(placeLearner(missAtId("p6a")).lesson === 6, "passes through L5, misses L6 → lesson 6");
check(placeLearner(missAtId("p10a")).lesson === 10, "passes through L9, misses L10 → lesson 10");
const top = maxContentLesson();
const all = placeLearner(placementItems.map(pass));
check(all.lesson === top && all.beyondContent, `passes everything → lesson ${top} and 'beyond content' (nothing further exists yet)`, JSON.stringify(all));
// extends automatically: if the content grew a lesson with no placement items yet, a perfect score starts there, not 'beyond'.
const grown = placeLearner(placementItems.map(pass), placementItems, top + 1);
check(grown.lesson === top + 1 && !grown.beyondContent, `if content has a lesson ${top + 1}, a perfect score starts there (not 'beyond content')`, JSON.stringify(grown));
check(top === 10, "content currently ends at lesson 10");

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
