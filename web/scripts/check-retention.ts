// Checks for the Phase 3 retention layer: pure logic first, then (if DATABASE_URL is set) the real Neon tables with
// throwaway users whose rows are deleted afterwards. Run: npm run check:retention
import { config } from "dotenv";
import { tips } from "@/content/tips";
import { MAX_FACT_CHARS, factKey, sanitizeFact } from "@/lib/facts";
import { ERROR_TYPES } from "@/lib/prompt";
import { LADDER_DAYS, isBankable, mistakeKey, nextReview } from "@/lib/review";
import { computeStreak } from "@/lib/streak";
import { scenarios } from "@/content/scenarios";
import { buildPatterns, fallbackNarrative, parseNarrative, quotableArabic, tidyFact } from "@/lib/recap";

config({ path: ".env.local" });

let failed = 0;
export function check(ok: boolean, label: string, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
}

// ---- review ladder ----------------------------------------------------------------------------------------------
check(LADDER_DAYS.join(",") === "1,3,7,21", "ladder is 1/3/7/21 days");
let state = { reviewCount: 0, mastered: false, nextInDays: 1 as number | null };
const path: (number | null)[] = [];
for (let i = 0; i < 4; i++) {
  state = nextReview(state.reviewCount, true);
  path.push(state.nextInDays);
}
check(path.join(",") === "3,7,21,", "four correct reviews walk 3 → 7 → 21 days then master", path.join(","));
check(state.mastered && state.nextInDays === null, "fourth correct review = mastered, leaves the queue");
check(nextReview(3, false).reviewCount === 0 && nextReview(3, false).nextInDays === 1, "a wrong answer restarts at 1 day");
check(!nextReview(2, true).mastered, "not mastered before four");

// ---- bankable mistakes -----------------------------------------------------------------------------------------
check(isBankable({ original: "هذه كتاب", corrected: "هَذَا كِتَابٌ", errorType: "gender_agreement" }), "gender fix is bankable");
check(!isBankable({ original: "جلس الولد في الفصل.", corrected: "الْوَلَدُ فِي الْفَصْلِ.", errorType: "other" }), "the real deletion case is not bankable");
check(!isBankable({ original: "جلس الولد في الفصل", corrected: "الولد في الفصل", errorType: "word_choice" }), "deletion-only is not bankable even with a real type");
check(!isBankable({ original: "هذا كتاب", corrected: "هَذَا كِتَابٌ", errorType: "gender_agreement" }), "diacritics-only is not bankable");
check(!isBankable({ original: "هذا بيت", corrected: "هذا بيت جميل", errorType: "other" }), "type 'other' is never bankable");
check(isBankable({ original: "البيت هذا", corrected: "هَذَا الْبَيْتُ", errorType: "word_order" }), "word-order fix is bankable");

// ---- mistake identity -------------------------------------------------------------------------------------------
check(mistakeKey("هَذَا كِتَابٌ.") === mistakeKey("هذا الكتاب"), "same corrected sentence → same key (tashkeel, punctuation, ال ignored)");
check(mistakeKey("هذا كتاب") !== mistakeKey("هذه بنت"), "different sentences → different keys");

// ---- streak ------------------------------------------------------------------------------------------------------
check(computeStreak([], "2026-10-10") === 0, "no practice = 0");
check(computeStreak(["2026-10-10", "2026-10-09", "2026-10-08"], "2026-10-10") === 3, "3 consecutive days ending today");
check(computeStreak(["2026-10-09", "2026-10-08"], "2026-10-10") === 2, "not practised yet today: streak ending yesterday still counts");
check(computeStreak(["2026-10-08", "2026-10-07"], "2026-10-10") === 0, "a missed day breaks it");
check(computeStreak(["2026-10-10", "2026-10-08"], "2026-10-10") === 1, "a gap stops the count");
check(computeStreak(["2026-03-01", "2026-02-28", "2026-02-27"], "2026-03-01") === 3, "crosses a month boundary");
check(computeStreak(["2027-01-01", "2026-12-31"], "2027-01-01") === 2, "crosses a year boundary");

// ---- facts -------------------------------------------------------------------------------------------------------
const ok = sanitizeFact("  Learning Arabic   for Umrah in March \n");
check("fact" in ok && ok.fact === "Learning Arabic for Umrah in March", "whitespace is normalized", JSON.stringify(ok));
check("error" in sanitizeFact(""), "empty is rejected");
check("error" in sanitizeFact("x".repeat(MAX_FACT_CHARS + 1)), "too long is rejected");
check("error" in sanitizeFact("email me at sara@example.com"), "emails are rejected");
check("error" in sanitizeFact("see https://example.com/me"), "links are rejected");
check("error" in sanitizeFact("my number is 0771234567"), "phone-like numbers are rejected");
check("fact" in sanitizeFact("Has two sisters and a brother"), "small numbers in words are fine");
check(factKey("Likes football!") === factKey("likes  Football"), "same fact → same key regardless of case/punctuation");

// ---- tips --------------------------------------------------------------------------------------------------------
check(ERROR_TYPES.every((t) => tips[t]?.title && tips[t]?.tip), "every error type has a curated tip");

// ---- recap (pure parts) ------------------------------------------------------------------------------------------
const g1 = { original: "هذه كتاب", corrected: "هَذَا كِتَابٌ", errorType: "gender_agreement" as const };
const g2 = { original: "هذا بنت", corrected: "هَذِهِ بِنْتٌ", errorType: "gender_agreement" as const };
const p1 = { original: "في البيت الكتاب", corrected: "الْكِتَابُ فِي الْبَيْتِ", errorType: "word_order" as const };
const junk = { original: "جلس الولد", corrected: "الْوَلَدُ", errorType: "other" as const };
const pats = buildPatterns([g1, g2, g1, p1, junk]);
check(pats.length === 2, "patterns: only bankable recasts count (the 'other' deletion is dropped)", JSON.stringify(pats.map((p) => p.errorType)));
check(pats[0].errorType === "gender_agreement" && pats[0].count === 3, "patterns: grouped by type, most frequent first");
check(pats[0].examples.length === 2, "patterns: at most 2 distinct examples per type (a repeated sentence isn't listed twice)");
check(pats[0].tip === tips.gender_agreement.tip, "patterns: the explanation is the curated tip");
check(buildPatterns([]).length === 0, "patterns: no corrections → none");

const fb = fallbackNarrative(scenarios[0], 4, 1);
const good = JSON.stringify({ summary: "You practised naming objects and got most right.", went_well: "You kept answering without hesitation.", next_step: "Try the next scenario.", facts: ["Is learning Arabic for Umrah in March", "Is learning Arabic for umrah in march!", "Email: a@b.com"] });
const n1 = parseNarrative(good, fb);
check(n1.summary.startsWith("You practised") && n1.nextStep === "Try the next scenario.", "narrative: good JSON is used");
check(n1.facts.length === 2 && n1.facts[0] === "Is learning Arabic for Umrah in March", "narrative: facts are sanitized (contact details dropped); exact repeats removed", JSON.stringify(n1.facts));
const quotable = quotableArabic(1, ["هذا باب", "المفتاح هنا"]);
const quoted = parseNarrative(JSON.stringify({ summary: "You said هذا باب and the key word المفتاح correctly.", went_well: "ok", next_step: "go", facts: [] }), fb, quotable);
check(quoted.summary.includes("هذا باب"), "narrative: Arabic quoted from the transcript/lesson is allowed", quoted.summary);
const invented = parseNarrative(JSON.stringify({ summary: "You should say مستشفى more often.", went_well: "ok", next_step: "go", facts: [] }), fb, quotable);
check(invented.summary === fb.summary, "narrative: Arabic that is NOT in the transcript or lesson → fallback text", invented.summary);
check(parseNarrative(JSON.stringify({ summary: "You said هذا بيت well.", went_well: "ok", next_step: "go", facts: [] }), fb).summary === fb.summary, "narrative: with no quotable set, any Arabic → fallback text");
check(parseNarrative("not json", fb).summary === fb.summary, "narrative: invalid JSON → fallback");
check(tidyFact("The learner has two sisters.") === "Has two sisters" && tidyFact("Learner is learning Arabic") === "Is learning Arabic" && tidyFact("Works as a nurse") === "Works as a nurse", "facts: a leading 'The learner' is stripped and the first letter capitalised");
check(parseNarrative("```json\n" + good + "\n```", fb).summary.startsWith("You practised"), "narrative: fenced JSON is accepted");
check(parseNarrative(JSON.stringify({ summary: Array(100).fill("word").join(" "), facts: ["a", "b", "c", "d", "e"].map((x) => `Fact ${x}`) }), fb).summary.split(" ").length <= 61, "narrative: long text is capped");
check(parseNarrative(JSON.stringify({ summary: "ok", facts: ["Fact a", "Fact b", "Fact c", "Fact d", "Fact e"] }), fb).facts.length === 3, "narrative: at most 3 new facts");
check(!/[\u0600-\u06FF]/.test(fb.summary + fb.wentWell + fb.nextStep), "narrative: the fallback has no Arabic script");

async function db() {
  if (!process.env.DATABASE_URL) {
    console.log("- skipped DB checks (no DATABASE_URL)");
    return;
  }
  const { runDbChecks } = await import("./retention-db-checks");
  await runDbChecks(check);
}

db()
  .then(() => {
    if (failed) {
      console.error(`\n${failed} check(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll retention checks pass.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
