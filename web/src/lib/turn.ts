import type OpenAI from "openai";
import { LLM_MODEL, llm } from "@/lib/ai/llm";
import { cumulativeVocab, normalizeArabic } from "@/content/lessons";
import type { Scenario } from "@/content/scenarios";
import {
  changesDemonstrative,
  detectAgreementError,
  hasJudgeablePair,
  removeAgreementErrors,
  replyModelsFix,
  sameWords,
} from "@/lib/agreement";
import { stripTashkeel } from "@/lib/arabic";
import { ERROR_TYPES, buildBuddySystemPrompt, type ErrorType, type PastMistake } from "@/lib/prompt";
import { isSafeRecast } from "@/lib/recast";
import { checkVocab } from "@/lib/vocab";


export interface HistoryTurn {
  role: "learner" | "buddy";
  /** Learner: text as typed. Buddy: fully diacritized text. */
  text: string;
}

export interface Recast {
  original: string;
  corrected: string;
  errorType: ErrorType;
}

export interface BuddyTurnResult {
  textDiacritized: string;
  textDisplay: string;
  recast: Recast | null;
  promptRepeat: boolean;
  /** Words in the reply that are outside the lesson's whitelist after any retry. Empty = clean. */
  vocabFlags: string[];
  /** True if the first draft had a problem (vocab leak, unsafe recast, no question) and we asked for a rewrite. */
  retried: boolean;
  /** True if the model's correction was still unsafe after the retry and was discarded. */
  recastRejected: boolean;
}

interface Draft {
  raw: string;
  parsed: Record<string, unknown>;
  reply: string;
}

function parseJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse((fenced ? fenced[1] : text).trim());
}

function normalizeRecast(raw: unknown): Recast | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.original !== "string" || typeof r.corrected !== "string") return null;
  if (!r.original.trim() || !r.corrected.trim()) return null;
  const errorType = ERROR_TYPES.includes(r.error_type as ErrorType) ? (r.error_type as ErrorType) : "other";
  return { original: r.original.trim(), corrected: r.corrected.trim(), errorType };
}

/** One model call returning a usable draft. Empty or malformed responses happen occasionally — try once more before failing. */
async function draft(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<Draft> {
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await llm().chat.completions.create({
      model: LLM_MODEL,
      max_completion_tokens: 600,
      response_format: { type: "json_object" },
      messages,
    });
    const choice = res.choices[0];
    const raw = choice.message.content ?? "";
    try {
      const parsed = parseJson(raw);
      const reply = typeof parsed.reply_diacritized === "string" ? parsed.reply_diacritized.trim() : "";
      if (reply) return { raw, parsed, reply };
      lastError = `no reply field (finish_reason=${choice.finish_reason})`;
    } catch {
      lastError = `unparseable response (finish_reason=${choice.finish_reason}): ${raw.slice(0, 200)}`;
    }
  }
  throw new Error(`Model failed to produce a usable reply: ${lastError}`);
}

export async function generateBuddyTurn(input: {
  scenario: Scenario;
  history: HistoryTurn[];
  learnerText: string;
  recentMistakes: PastMistake[];
  /** Things the buddy knows about this learner (see lib/memory.ts). */
  memoryFacts?: string[];
}): Promise<BuddyTurnResult> {
  const { scenario, history, learnerText, recentMistakes, memoryFacts = [] } = input;
  const allowed = cumulativeVocab(scenario.lessonNo);

  // The commonest beginner error (demonstrative–noun gender) is decided by the app from the gender table, not by the
  // model: when it fires, the model is told the exact fix and then verified (see agreement.ts).
  const detected = detectAgreementError(learnerText, scenario.lessonNo);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildBuddySystemPrompt(scenario.lessonNo, scenario.goal, recentMistakes, memoryFacts) },
    ...history.map(
      (t): OpenAI.Chat.ChatCompletionMessageParam => ({
        role: t.role === "buddy" ? "assistant" : "user",
        content: t.text,
      })
    ),
    ...(detected
      ? [
          {
            role: "system" as const,
            content: `The app has verified a gender-agreement error in the learner's next message. They wrote «${detected.original}»; the correct sentence is «${detected.corrected}». Your reply must be that corrected sentence, restated with full tashkeel and nothing else. Set "recast" to {"original": "${detected.original}", "corrected": <that sentence with full tashkeel>, "error_type": "gender_agreement"} and "prompt_repeat" to true.`,
          },
        ]
      : []),
    { role: "user", content: learnerText },
  ];

  // A recast is only shown if it quotes what the learner actually wrote and is a minimal, safe fix (see recast.ts).
  const recastProblem = (p: Record<string, unknown>): string | null => {
    const r = normalizeRecast(p.recast);
    if (detected) {
      // The app already knows the right fix, so the model's recast must be exactly that.
      if (r && sameWords(r.corrected, detected.corrected)) return null;
      return `the learner's sentence has a gender-agreement error and the correct sentence is «${detected.corrected}». Restate exactly that sentence and set recast to it`;
    }
    if (!r) return null;
    // The model claims a demonstrative is wrong although it agrees with a noun we know — a false alarm.
    if (changesDemonstrative(r.original, r.corrected) && hasJudgeablePair(learnerText, scenario.lessonNo)) {
      return "the learner's demonstrative already agrees with its noun, so there is no error to correct. Set recast to null";
    }
    const quotesLearner = normalizeArabic(learnerText).includes(normalizeArabic(r.original));
    if (quotesLearner && isSafeRecast(r.original, r.corrected, scenario.lessonNo)) return null;
    return "your correction was rejected — it must quote the learner's words exactly and fix only the agreement or a particle (e.g. swap هذه/هذا). Never change the learner's noun to a different word, and never delete words (using vocabulary beyond the lesson is not an error). If you are not certain there is an error, set recast to null";
  };

  // Scores a draft against the guard rails. Lower is better; 0 means nothing to fix.
  const assess = (d: Draft) => {
    const flags = checkVocab(d.reply, allowed);
    const recastIssue = recastProblem(d.parsed);
    // With no correction to repeat, the learner needs something to answer or the conversation dead-ends.
    const noQuestion =
      !detected && (recastIssue !== null || normalizeRecast(d.parsed.recast) === null) && !/[؟?]/.test(d.reply);
    // When we know the fix, the reply must actually model it (the observed failure: swapping the noun for كتابة).
    const missesFix = detected !== null && !replyModelsFix(d.reply, detected);
    // The buddy must never itself pair a demonstrative with a noun of the wrong gender.
    const badReply = detectAgreementError(d.reply, scenario.lessonNo);
    return {
      d,
      flags,
      recastIssue,
      noQuestion,
      missesFix,
      badReply,
      score: flags.length * 2 + (recastIssue ? 2 : 0) + (missesFix ? 2 : 0) + (badReply ? 3 : 0) + (noQuestion ? 1 : 0),
    };
  };

  let best = assess(await draft(messages));
  let retried = false;

  // One rewrite attempt naming every problem. We keep whichever draft scores better (a rewrite can fix one thing and
  // break another), and a failed rewrite never costs us a usable first draft. The vocab checker is heuristic, so a
  // still-flagged reply is returned and stored rather than blocked — we measure, not censor. An unsafe recast is dropped.
  if (best.score > 0) {
    retried = true;
    const problems: string[] = [];
    if (best.flags.length) {
      const words = [...new Set(best.flags.map((f) => f.token))].join("، ");
      problems.push(`your reply used words the learner has not studied yet: ${words}. Use ONLY the allowed vocabulary and grammar`);
    }
    if (best.recastIssue) problems.push(best.recastIssue);
    if (best.badReply) {
      problems.push(
        `your reply contains a gender-agreement mistake («${best.badReply.original}») — هذا/ذلك go with masculine nouns and هذه/تلك with feminine nouns`
      );
    }
    if (best.missesFix && detected) problems.push(`your reply must be the corrected sentence «${detected.corrected}» with full tashkeel`);
    if (best.noQuestion) {
      problems.push(
        "your reply must end with a short question the learner can answer, pointing at something new (for example ما هذا؟), instead of just repeating what they said"
      );
    }
    try {
      const second = assess(
        await draft([
          ...messages,
          { role: "assistant", content: best.d.raw },
          {
            role: "user",
            content: `[system note, not from the learner] Problems with your last reply: ${problems.join("; ")}. Rewrite it as the same JSON object.`,
          },
        ])
      );
      if (second.score <= best.score) best = second;
    } catch (err) {
      console.warn("rewrite attempt failed; keeping first draft", err);
    }
  }

  let recast = best.recastIssue ? null : normalizeRecast(best.d.parsed.recast);
  let reply = best.d.reply;

  if (detected) {
    // Deterministic outcome: the learner always sees the verified correction, quoted from their own words. Prefer the
    // model's fully diacritized wording of it; otherwise fall back to ours (only the swapped word carries tashkeel).
    // (If the model forgot the recast but its reply is the fix, that reply is the best-diacritized wording we have.)
    const fullyDiacritized = [recast?.corrected, reply].find((c) => c && sameWords(c, detected.corrected));
    const corrected = fullyDiacritized?.trim() ?? detected.corrected;
    recast = { original: detected.original, corrected, errorType: "gender_agreement" };
    // If the model still never modelled the fix, say the corrected sentence ourselves rather than show a wrong reply.
    if (best.missesFix) reply = corrected;
  }

  // Last line of defence: never show a reply that itself mismatches a demonstrative and noun. Drop the bad sentence(s);
  // if nothing is left, fall back to the scenario's own (verified) opening line.
  if (detectAgreementError(reply, scenario.lessonNo)) {
    reply = removeAgreementErrors(reply, scenario.lessonNo) || scenario.openingLine;
  }

  return {
    textDiacritized: reply,
    textDisplay: stripTashkeel(reply),
    recast,
    promptRepeat: detected ? true : recast !== null && best.d.parsed.prompt_repeat !== false,
    vocabFlags: [...new Set((reply === best.d.reply ? best.flags : checkVocab(reply, allowed)).map((f) => f.token))],
    retried,
    recastRejected: detected ? false : best.recastIssue !== null,
  };
}
