// Offline checks for the speaking-track prototype (no network). Run: npm run check:speaking
import { scenarios } from "@/content/scenarios";
import { findScenario, isSpeaking, speakingScenarios } from "@/content/speaking";
import { containsScripture } from "@/lib/scripture";
import { buildSpeakingSystemPrompt } from "@/lib/speaking-prompt";
import { isPlausibleFix } from "@/lib/speaking-turn";

let failed = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
};

// ---- content ---------------------------------------------------------------------------------------------------
const ids = speakingScenarios.map((s) => s.id);
check(speakingScenarios.length === 5, "five speaking scenarios");
check(new Set(ids).size === ids.length && ids.every((i) => i.startsWith("sp-")), "ids are unique and prefixed sp-");
check(ids.every((i) => !scenarios.some((s) => s.id === i)), "ids do not collide with ladder scenarios");
check(speakingScenarios.every((s) => s.track === "speaking" && isSpeaking(s)), "all are on the speaking track");
check(scenarios.every((s) => !isSpeaking(s)), "no ladder scenario is on the speaking track");
check(speakingScenarios.every((s) => /[ً-ْ]/.test(s.openingLine)), "openers are diacritized (they are spoken)");
check(speakingScenarios.every((s) => /[؟?]/.test(s.openingLine)), "every opener asks the learner something");
check(speakingScenarios.every((s) => !containsScripture(s.openingLine)), "no opener trips the scripture guard");
check(findScenario("sp-opinion")?.title === "What do you think?" && findScenario("b1l1-what-is-this") !== undefined && findScenario("nope") === undefined, "findScenario finds either track");

// ---- prompt ----------------------------------------------------------------------------------------------------
const p = buildSpeakingSystemPrompt("Tell a story.");
check(p.includes("SITUATION: Tell a story."), "the situation is injected");
check(!p.includes("ALLOWED VOCABULARY") && !p.includes("VERBS ARE"), "no ladder whitelist or verb ban in the speaking prompt");
check(p.includes("AT MOST ONE") && p.includes("NEVER quote"), "one correction per turn, and the scripture rule, are present");
check(p.includes('"upgrade"'), "the output schema includes an upgrade slot");

// ---- correction sanity -----------------------------------------------------------------------------------------
const said = "أنا ذهبت إلى السوق أمس و اشتريت كتاب";
check(isPlausibleFix(said, "اشتريت كتاب", "اشْتَرَيْتُ كِتَابًا"), "a real fix of a quoted fragment is plausible");
check(!isPlausibleFix(said, "اشتريت كتاب", "اشتريت كتاب"), "a diacritics-only 'fix' is not a correction");
check(!isPlausibleFix(said, "ذهبت إلى المدرسة", "ذهبت إلى السوق"), "a 'quote' that is not in the learner's text is rejected");
check(!isPlausibleFix(said, "أنا ذهبت إلى السوق", "ذهبت إلى السوق"), "deleting words is not a correction");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll speaking-track checks pass.");
