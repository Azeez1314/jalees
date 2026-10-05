import OpenAI from "openai";
import { cumulativeVocab, normalizeArabic } from "@/content/lessons";
import type { Scenario } from "@/content/scenarios";
import { stripTashkeel } from "@/lib/arabic";
import { ERROR_TYPES, buildBuddySystemPrompt, type ErrorType, type PastMistake } from "@/lib/prompt";
import { isSafeRecast } from "@/lib/recast";
import { checkVocab } from "@/lib/vocab";

/** Swap vendors here only — see docs/architecture.md ("every external AI service sits behind a thin interface"). */
const MODEL = "gpt-4o-mini";

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

let client: OpenAI | null = null;
function openai(): OpenAI {
  return (client ??= new OpenAI());
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
    const res = await openai().chat.completions.create({
      model: MODEL,
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
}): Promise<BuddyTurnResult> {
  const { scenario, history, learnerText, recentMistakes } = input;
  const allowed = cumulativeVocab(scenario.lessonNo);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildBuddySystemPrompt(scenario.lessonNo, scenario.goal, recentMistakes) },
    ...history.map(
      (t): OpenAI.Chat.ChatCompletionMessageParam => ({
        role: t.role === "buddy" ? "assistant" : "user",
        content: t.text,
      })
    ),
    { role: "user", content: learnerText },
  ];

  // A recast is only shown if it quotes what the learner actually wrote and is a minimal, safe fix (see recast.ts).
  const recastProblem = (p: Record<string, unknown>): string | null => {
    const r = normalizeRecast(p.recast);
    if (!r) return null;
    const quotesLearner = normalizeArabic(learnerText).includes(normalizeArabic(r.original));
    if (quotesLearner && isSafeRecast(r.original, r.corrected, scenario.lessonNo)) return null;
    return "your correction was rejected — it must quote the learner's words exactly and fix only the agreement or a particle (e.g. swap هذه/هذا). Never change the learner's noun to a different word. If you are not certain there is an error, set recast to null";
  };

  // Scores a draft against the guard rails. Lower is better; 0 means nothing to fix.
  const assess = (d: Draft) => {
    const flags = checkVocab(d.reply, allowed);
    const recastIssue = recastProblem(d.parsed);
    // With no correction to repeat, the learner needs something to answer or the conversation dead-ends.
    const noQuestion = (recastIssue !== null || normalizeRecast(d.parsed.recast) === null) && !/[؟?]/.test(d.reply);
    return { d, flags, recastIssue, noQuestion, score: flags.length * 2 + (recastIssue ? 2 : 0) + (noQuestion ? 1 : 0) };
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

  const recast = best.recastIssue ? null : normalizeRecast(best.d.parsed.recast);
  return {
    textDiacritized: best.d.reply,
    textDisplay: stripTashkeel(best.d.reply),
    recast,
    promptRepeat: recast !== null && best.d.parsed.prompt_repeat !== false,
    vocabFlags: [...new Set(best.flags.map((f) => f.token))],
    retried,
    recastRejected: best.recastIssue !== null,
  };
}
