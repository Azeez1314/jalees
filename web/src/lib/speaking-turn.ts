import type OpenAI from "openai";
import { normalizeArabic } from "@/content/lessons";
import type { Scenario } from "@/content/scenarios";
import { wordsKey } from "@/lib/agreement";
import { stripTashkeel } from "@/lib/arabic";
import { limitPraise } from "@/lib/praise";
import { containsScripture, stripScripture } from "@/lib/scripture";
import { buildSpeakingSystemPrompt } from "@/lib/speaking-prompt";
import { draft, normalizeRecast, type BuddyTurnResult, type Draft, type HistoryTurn, type Recast } from "@/lib/turn";

/** Said when a reply had to be discarded and there is nothing safer to fall back to. */
const FALLBACK_REPLY = "حَدِّثْنِي أَكْثَرَ، مِنْ فَضْلِكَ.";

/**
 * Is this a real correction of what the learner wrote? It must quote their words, change them (beyond diacritics) and not just
 * delete words. Deliberately much lighter than the ladder's `isSafeRecast`: the speaking track has no gender tables or lesson
 * vocabulary to check against, so the guard is "quotes the learner, actually differs, doesn't only delete".
 */
export function isPlausibleFix(learnerText: string, original: string, corrected: string): boolean {
  const o = wordsKey(original).split(" ").filter(Boolean);
  const c = wordsKey(corrected).split(" ").filter(Boolean);
  if (!o.length || !c.length || o.join(" ") === c.join(" ")) return false;
  if (!normalizeArabic(learnerText).includes(normalizeArabic(original))) return false;
  const deletionOnly = c.length < o.length && c.every((w) => o.includes(w));
  return !deletionOnly;
}

function normalizeUpgrade(raw: unknown): { original: string; better: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.original !== "string" || typeof u.better !== "string" || !u.original.trim() || !u.better.trim()) return null;
  return { original: u.original.trim(), better: u.better.trim() };
}

/**
 * One turn of the (prototype) speaking track. Same shape as `generateBuddyTurn`'s result so storage, TTS and the UI work
 * unchanged, but no lesson whitelist, no gender table, no repeat-the-correction loop. Guard rails that remain: scripture
 * (never), praise frequency, and a sanity check that a correction really quotes and changes the learner's words.
 */
export async function generateSpeakingTurn(input: {
  scenario: Scenario;
  history: HistoryTurn[];
  learnerText: string;
}): Promise<BuddyTurnResult> {
  const { scenario, history, learnerText } = input;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSpeakingSystemPrompt(scenario.goal) },
    ...history.map(
      (t): OpenAI.Chat.ChatCompletionMessageParam => ({ role: t.role === "buddy" ? "assistant" : "user", content: t.text })
    ),
    { role: "user", content: learnerText },
  ];

  const usableRecast = (p: Record<string, unknown>): Recast | null => {
    const r = normalizeRecast(p.recast);
    return r && isPlausibleFix(learnerText, r.original, r.corrected) ? r : null;
  };
  const usableUpgrade = (p: Record<string, unknown>) => {
    const u = normalizeUpgrade(p.upgrade);
    return u && isPlausibleFix(learnerText, u.original, u.better) ? u : null;
  };

  const assess = (d: Draft) => {
    const badRecast = normalizeRecast(d.parsed.recast) !== null && usableRecast(d.parsed) === null;
    const scripture = containsScripture(d.reply);
    // A reply with no question and no correction leaves the learner with nothing to answer: the conversation dead-ends.
    const noQuestion = !/[؟?]/.test(d.reply);
    return { d, badRecast, scripture, noQuestion, score: (scripture ? 10 : 0) + (badRecast ? 2 : 0) + (noQuestion ? 1 : 0) };
  };

  let best = assess(await draft(messages));
  let retried = false;
  if (best.score > 0) {
    retried = true;
    const problems: string[] = [];
    if (best.scripture) problems.push("your reply refers to the Qur'an or hadith, which you must never do — remove it and continue the everyday conversation");
    if (best.badRecast) problems.push("your correction must quote the learner's words exactly and really change them; if you are not certain there is an error, set recast to null");
    if (best.noQuestion) problems.push("end with ONE open question that needs a full-sentence answer");
    try {
      const second = assess(
        await draft([
          ...messages,
          { role: "assistant", content: best.d.raw },
          { role: "user", content: `[system note, not from the learner] Problems with your last reply: ${problems.join("; ")}. Rewrite it as the same JSON object.` },
        ])
      );
      if (second.score <= best.score) best = second;
    } catch (err) {
      console.warn("speaking rewrite failed; keeping first draft", err);
    }
  }

  let reply = best.d.reply;
  if (containsScripture(reply)) reply = stripScripture(reply) || FALLBACK_REPLY;

  // Prefer a real correction; an "upgrade" (correct but basic sentence) is shown in the same card and never enters the review bank.
  const fix = usableRecast(best.d.parsed);
  const upgrade = fix ? null : usableUpgrade(best.d.parsed);
  const recast: Recast | null = fix ?? (upgrade ? { original: upgrade.original, corrected: upgrade.better, errorType: "other" } : null);

  reply = limitPraise(reply, history.filter((t) => t.role === "buddy").map((t) => t.text), recast !== null);

  return {
    textDiacritized: reply,
    textDisplay: stripTashkeel(reply),
    recast,
    promptRepeat: false,
    vocabFlags: [],
    retried,
    recastRejected: best.badRecast,
  };
}
