# Phase 0 — Lesson-constraint leakage eval

Per the Jalees build order, this runs *before any app code*: it tests whether
the LLM (currently OpenAI's `gpt-6-luna`, the cheapest current tier — see
`docs/architecture.md`), given a strict "you may only use vocab/grammar
through Lesson N" system prompt, actually stays inside that boundary — or
drifts into fancier Arabic than the learner has been taught. If this fails
badly, the lesson-constrained-buddy concept needs rework before building the
app — and a cheap/small model is exactly where that's most likely to happen,
so treat this eval as the test of whether `gpt-6-luna` is good enough, not
just the harness.

## What it does

For each of Madinah Book 1, Lessons 1–5:

1. Runs 20 single-turn test conversations (a learner line + a scenario goal
   chosen to tempt the buddy into reaching beyond the lesson — see
   `src/testConversations.ts`).
2. Gets the buddy's reply as structured JSON (same shape the real app will use).
3. Checks the reply two ways:
   - **Vocab**: deterministic whitelist check (`src/tokenizer.ts`) — normalizes
     tashkeel/hamza/ta-marbuta and strips common prefixes/suffixes, then
     matches against the cumulative allowed vocab for that lesson. Reliable,
     but affix-stripping is heuristic — expect some false positives/negatives.
   - **Grammar**: a second LLM call acts as an independent grader, given
     the allowed grammar list and the reply, and flags structures beyond it.
     Arabic morphology doesn't lend itself to regex checking, so this is
     LLM-judgment, not ground truth.
4. Writes one markdown report per lesson to `results/lesson-N.md` with a
   clean-rate summary and every flagged case for manual review.

## ⚠️ Known limitation: the lesson data is a draft

`src/lessons.ts` is a best-effort reconstruction of Madinah Book 1 Lessons
1–5's topic progression, written from general knowledge of the curriculum's
structure — **not transcribed from the book**. It has not been checked
line-by-line against the actual book. Treat a first run of this eval as
validating the *harness* (does the leak-detection method work at all), not as
a final verdict on prompt quality — go through the actual Book 1 and correct
`newVocab`/`newGrammar` per lesson before trusting the results for real.

## Running it

```bash
cd phase0-eval
npm install
cp .env.example .env   # fill in OPENAI_API_KEY
npm run eval            # all 5 lessons, 100 calls total (+100 grader calls)
npm run eval:lesson 3   # just Lesson 3
```

Reports land in `results/lesson-N.md` (gitignored — regenerate anytime).

## Reading the results

- **Clean rate near 100%** across lessons → the constraint-prompting approach
  works; move to Phase 1 (text conversation loop).
- **Vocab flags** are usually the buddy substituting a word it "wants" to use
  instead of stopping at the lesson boundary — check if it's a real leak or a
  gap in the whitelist (a legitimate word missing from `lessons.ts`).
- **Grammar flags**, especially conjugated verbs before verbs are taught, are
  the higher-severity failure mode described in the product spec ("LLM leaks
  above-lesson Arabic") — if these show up often, the system prompt needs a
  harder constraint (e.g. explicit "no verbs" instruction, few-shot examples
  of correctly-constrained replies) before Phase 1.

## Extending

- More lessons: add entries to `lessons.ts` (vocab/grammar are cumulative —
  each lesson only lists what's *new*).
- More/different test cases: edit `testConversations.ts`.
- Swapping models: change `MODEL` in `src/grader.ts`.
