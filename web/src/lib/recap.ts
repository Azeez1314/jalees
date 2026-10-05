import { cumulativeVocab, normalizeArabic } from "@/content/lessons";
import { tips } from "@/content/tips";
import type { Scenario } from "@/content/scenarios";
import { LLM_MODEL, llm } from "@/lib/ai/llm";
import { sanitizeFact } from "@/lib/facts";
import { isBankable } from "@/lib/review";
import type { ErrorType } from "@/lib/prompt";
import type { Recast } from "@/lib/turn";
import { checkVocab } from "@/lib/vocab";

export interface RecapPattern {
  errorType: ErrorType;
  title: string;
  /** Curated, human-reviewed explanation (never model-written). */
  tip: string;
  count: number;
  /** Real recast pairs from this session. */
  examples: { wrong: string; right: string }[];
}

export interface Recap {
  generatedAt: string;
  stats: { learnerTurns: number; voiceTurns: number };
  summary: string;
  wentWell: string;
  nextStep: string;
  patterns: RecapPattern[];
  /** Facts newly learned from this session (ids let the recap offer a "Forget" button). */
  newFacts: { id: string; fact: string }[];
}

export interface Narrative {
  summary: string;
  wentWell: string;
  nextStep: string;
  facts: string[];
}

const ARABIC = /[؀-ۿ]/;
const MAX_EXAMPLES = 2;
const MAX_NEW_FACTS = 3;

/**
 * Groups this session's corrections by error type. Deterministic: counts and examples come from the recasts the learner
 * actually saw, and explanations from the curated tips table — the model is not involved.
 */
export function buildPatterns(recasts: Recast[]): RecapPattern[] {
  const byType = new Map<ErrorType, Recast[]>();
  for (const r of recasts.filter(isBankable)) byType.set(r.errorType, [...(byType.get(r.errorType) ?? []), r]);

  return [...byType.entries()]
    .map(([errorType, list]) => {
      const seen = new Set<string>();
      const examples: { wrong: string; right: string }[] = [];
      for (const r of list) {
        if (seen.has(r.corrected) || examples.length >= MAX_EXAMPLES) continue;
        seen.add(r.corrected);
        examples.push({ wrong: r.original, right: r.corrected });
      }
      return { errorType, title: tips[errorType].title, tip: tips[errorType].tip, count: list.length, examples };
    })
    .sort((a, b) => b.count - a.count);
}

/** What the recap says if the model's text is missing or unusable — plain, true, and never wrong. */
export function fallbackNarrative(scenario: Scenario, learnerTurns: number, patternCount: number): Narrative {
  return {
    summary: `You practised "${scenario.title}" and sent ${learnerTurns} ${learnerTurns === 1 ? "reply" : "replies"}.`,
    wentWell: "",
    nextStep: patternCount
      ? "Do a quick review of today's mistakes tomorrow, then try another scenario."
      : "Try another scenario, or the same one again to build speed.",
    facts: [],
  };
}

/** Facts are stored subject-less ("Has two sisters"); models often prepend "The learner"/"Learner", so strip it. */
export function tidyFact(fact: string): string {
  const t = fact.trim().replace(/^(?:the\s+)?(?:learner|user|student)\s+/i, "").replace(/\.$/, "");
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const cap = (s: string, maxWords: number) => (words(s).length > maxWords ? words(s).slice(0, maxWords).join(" ") + "…" : s.trim());

const ARABIC_WORD = /[\u0621-\u063A\u0640-\u065F\u0670]+/g;

/** Words the recap may quote: the lesson's vocabulary plus whatever actually appears in this session's transcript. */
export function quotableArabic(lessonNo: number, transcriptTexts: string[]): Set<string> {
  const allowed = new Set(cumulativeVocab(lessonNo));
  for (const t of transcriptTexts) for (const w of t.match(ARABIC_WORD) ?? []) allowed.add(normalizeArabic(w));
  return allowed;
}

/**
 * Turns the model's raw JSON into a safe Narrative. A narrative field may quote Arabic only if every Arabic word is in
 * `allowedArabic` (the lesson vocabulary or the transcript); otherwise the model has written Arabic we can't vouch for and
 * the field is replaced by its fallback. Facts go through the same sanitizer as learner-typed ones; everything is length-capped.
 */
export function parseNarrative(raw: string, fallback: Narrative, allowedArabic: Set<string> = new Set()): Narrative {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return fallback;
  }
  const text = (v: unknown, maxWords: number, fb: string, field: string) => {
    if (typeof v !== "string") return fb;
    const t = cap(v, maxWords);
    if (!t) return fb;
    if (ARABIC.test(t)) {
      const unknown = checkVocab(t, allowedArabic);
      if (unknown.length) {
        console.warn(`recap: "${field}" quoted Arabic not in the transcript or lesson (${unknown.map((u) => u.token).join(", ")}); replaced`);
        return fb;
      }
    }
    return t;
  };
  const facts: string[] = [];
  if (Array.isArray(obj.facts)) {
    for (const f of obj.facts) {
      if (typeof f !== "string") continue;
      const clean = sanitizeFact(tidyFact(f));
      if ("fact" in clean && !facts.includes(clean.fact)) facts.push(clean.fact);
      if (facts.length >= MAX_NEW_FACTS) break;
    }
  }
  return {
    summary: text(obj.summary, 60, fallback.summary, "summary"),
    wentWell: text(obj.went_well, 30, fallback.wentWell, "went_well"),
    nextStep: text(obj.next_step, 30, fallback.nextStep, "next_step"),
    facts,
  };
}

const SYSTEM = `You write the end-of-session recap for a beginner learning Arabic (Madinah Book 1) with a conversation buddy. You are given the scenario, the transcript (Arabic) and a short list of the correction types that came up. Reply with ONE JSON object and nothing else:
{
  "summary": "<=60 words: what they practised and how it went>",
  "went_well": "<=25 words: one specific thing visible in the transcript, or an empty string if nothing stands out>",
  "next_step": "<=25 words: one concrete, realistic suggestion>",
  "facts": ["<=3 short facts about the learner as a person, or an empty list>"]
}

Rules:
- Write directly to the learner ("you"), in warm, plain English. You may quote Arabic words, but ONLY words that appear in the transcript, copied exactly — never write any other Arabic. Do not explain grammar rules (the app shows those separately) and do not invent praise: mention only what the transcript shows.
- "facts" are ONLY durable personal details the learner volunteered about themselves (their reason for learning Arabic, family members, job, interests, how they like to be addressed), in English, under 100 characters each, written as a short phrase with NO subject (start directly with the detail — never "The learner…", "Learner…" or "They…"). Sentences that merely practise vocabulary or answer the exercise (an object being somewhere, how many pens they have) are NOT facts about the learner, and you must never make up or infer a detail. Most sessions have none, and an empty list is the right answer then.
- You may also be given facts already known about the learner. Let them shape the tone and relevance of next_step (for example their reason for learning), but never repeat them back, and never list a known fact again under "facts".
- Never record sensitive details: health, money, politics, sexuality, contact information, exact addresses, or anything about children. If unsure, leave it out.`;

/** One model call for the human-sounding part of the recap. Falls back to plain text on any failure. */
export async function generateNarrative(input: {
  scenario: Scenario;
  transcript: { role: "learner" | "buddy"; text: string }[];
  patterns: RecapPattern[];
  learnerTurns: number;
  /** Facts already remembered about the learner; used only to make the English next step relevant. */
  knownFacts?: string[];
}): Promise<Narrative> {
  const fallback = fallbackNarrative(input.scenario, input.learnerTurns, input.patterns.length);
  const lines = input.transcript.slice(-40).map((t) => `${t.role === "learner" ? "Learner" : "Buddy"}: ${t.text.slice(0, 200)}`);
  const corrections = input.patterns.length
    ? input.patterns.map((p) => `${p.title} ×${p.count}`).join(", ")
    : "none";
  try {
    const res = await llm().chat.completions.create({
      model: LLM_MODEL,
      max_completion_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Scenario: ${input.scenario.title} — ${input.scenario.goal}\nCorrection types this session: ${corrections}\nAlready known about the learner: ${input.knownFacts?.length ? input.knownFacts.join("; ") : "nothing"}\n\nTranscript:\n${lines.join("\n")}`,
        },
      ],
    });
    const allowed = quotableArabic(input.scenario.lessonNo, input.transcript.map((t) => t.text));
    return parseNarrative(res.choices[0].message.content ?? "", fallback, allowed);
  } catch (err) {
    console.warn("recap narrative failed; using fallback", err);
    return fallback;
  }
}
