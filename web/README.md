# Jalees web app (Phases 1-2: text and voice conversation loop)

Next.js 16 (App Router) + Neon (Postgres and Neon Auth) + OpenAI. Learners sign in with an emailed one-time code, pick a
Madinah Book 1 scenario, and chat in Arabic. The buddy only uses the vocabulary and grammar of the scenario's lesson,
restates mistakes correctly ("recast"), and shows replies fully diacritized with a tashkeel toggle. Learners can type
(with an on-screen Arabic keyboard) or **speak**: tap the mic, check the transcript, send, and the buddy's reply is spoken back.

> Next.js 16 has breaking changes from older versions. `AGENTS.md` points at the docs bundled in
> `node_modules/next/dist/docs/` — read the relevant guide before changing routing, `proxy.ts` or caching.

## Setup

1. **Neon project** — create one at [console.neon.tech](https://console.neon.tech).
2. **Neon Auth** — in the project: **Auth → Enable Auth**, then turn on **Sign-up and Sign-in with Email** and the
   **Email OTP / verification code** method. Copy the **Auth URL** from the Configuration tab.
   (Neon's default shared SMTP is development-only; configure a real email provider before inviting testers.)
3. **Env** — `cp .env.example .env.local` and fill in `DATABASE_URL` (pooled connection string),
   `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (`openssl rand -base64 32`) and `OPENAI_API_KEY`.
4. **Install, migrate, seed, run:**

   ```bash
   npm install
   npm run db:migrate   # applies db/schema.sql (idempotent)
   npm run db:seed      # syncs lessons + scenarios from src/content (idempotent)
   npm run dev
   ```

`next build` needs the auth env vars present (Neon Auth validates its config at import time).

## Scripts

| Script | What it does |
|---|---|
| `npm run check:content` | Fails if any scenario opener uses vocab above its lesson (run after editing content) |
| `npm run check:recast` | Unit checks for the generic recast safety validator (no network) |
| `npm run check:agreement` | Unit checks for the demonstrative–noun gender detector (no network) |
| `npm run check:usage` | Daily voice-cap arithmetic and the real `usage_daily` table (throwaway user, cleaned up) |
| `npm run check:voice` | Real TTS → STT round trip, MIME mapping, and `/api/tts` turn-ownership rules (a fraction of a cent; macOS `afinfo`) |
| `npm run audio:openers` | Renders scenario-opener audio to `public/audio/openers/` (idempotent; `-- --force` re-renders). `check:content` fails if it's stale |
| `npm run spike:voice` | The Phase 2 provider spike: samples in `.spike-audio/` (gitignored) for listening, plus a round-trip accuracy table |
| `npm run try:turn -- <scenarioId> "msg" …` | Runs a scripted conversation through the real turn pipeline — no DB or auth. Needs `OPENAI_API_KEY` |
| `npm run db:migrate` / `db:seed` | Schema and content sync |

## How a turn works (`POST /api/turn`)

1. Auth (Neon Auth session) → 401 if missing; the session must belong to the user.
2. `lib/prompt.ts` builds the system prompt: persona, **hard lesson constraints** (allowed vocab + grammar, verb ban),
   noun-gender table, scenario goal, recent mistakes, recast rules.
3. **Agreement check first** — `lib/agreement.ts` looks for a demonstrative next to a noun from the gender table
   (هذا/ذلك + masculine, هذه/تلك + feminine; handles ال, a fused و/ف, and possessive suffixes from lesson 5). If the
   learner mismatched them, *the app* decides there is an error and what the fix is, and tells the model the exact
   corrected sentence. The model is only asked to restate it.
4. `lib/turn.ts` calls the model, then applies guard rails to the draft:
   - **verified correction** — when the app detected an error, the recast must match its fix and the reply must model it.
     If the model still gets it wrong, the app's own correction is used and the reply is replaced by the corrected
     sentence, so the learner never sees a wrong one. A model-invented "correction" of an agreeing sentence is discarded;
   - **buddy's own mistakes** — any sentence in the reply that itself mismatches a demonstrative and noun is removed;
   - **vocab leak** — `lib/vocab.ts` checks every word against the lesson whitelist;
   - **unsafe recast** (anything the detector doesn't cover) — `lib/recast.ts` only allows swapping function words or
     adding/dropping the feminine ة on an adjective; it must quote the learner's words and never change a noun;
   - **dead end** — a reply with no correction must end with a question.
   If anything trips, the model gets one rewrite request naming the problems, and the better-scoring draft wins.
   Leaks that survive are stored (`turns.vocab_flags`) rather than blocked; an unsafe recast is dropped (`turns.recast_rejected`).
5. The learner turn, buddy turn and mistake row are saved in one transaction (`lib/queries.ts`).

## Voice (Phase 2)

Voice is a thin layer over the text path — the same `POST /api/turn` runs underneath.

1. **Mic** (`useRecorder.ts`): tap to start, tap to stop (30 s max). `MediaRecorder` produces webm/opus (Safari: mp4).
2. **`POST /api/stt`** (`lib/ai/stt.ts`, `gpt-4o-mini-transcribe`, `language: "ar"`): the transcript is dropped into the normal
   text box with "Did I hear you right?" so the learner can fix it before sending. No vocabulary `prompt` is used on purpose —
   it would bias the recogniser toward the lesson's words and hide learner mistakes. **Audio is never stored.** What the
   recogniser heard is saved as `turns.asr_text` next to the confirmed text, so you can measure how often it "fixes" mistakes.
3. **`POST /api/turn`** with the optional `voice` metadata, exactly as for typed text.
4. **`POST /api/tts`** (`lib/ai/tts.ts`, `gpt-4o-mini-tts`, voice `marin`) takes a *turn id*, never text, so it can't be used as
   free general TTS. Auto-plays only when the learner spoke ("voice in → voice out"); every buddy bubble has a speaker button.
   Replays come from an in-browser cache (no repeat spend); **Slow audio** is `playbackRate` 0.75 (free).
5. **Scenario openers** are pre-rendered static files, so the first thing a learner hears costs nothing and isn't capped.

**Daily cap:** 10 minutes of voice per learner per UTC day (`lib/usage.ts`, table `usage_daily`) = recorded seconds +
estimated spoken seconds (0.22 s per Arabic letter, measured in the spike). When it's used up the mic and spoken replies
stop; **typing keeps working**. Rough cost at the cap: about $0.10 per learner per day.

**Swapping vendors:** model ids live only in `lib/ai/stt.ts` and `lib/ai/tts.ts`. After changing the voice or instructions, run
`npm run audio:openers -- --force` (the content check will remind you).

**Requirements:** the browser only allows the microphone on `https://` or `localhost`, so a deployed site needs HTTPS.

## Content

`src/content/` is the source of truth (`lessons.ts`, `scenarios.ts`, `genders.ts`); `db:seed` mirrors it into the
`lessons`/`scenarios` tables so sessions can reference scenarios and content can be joined in analytics.
`src/content/lessons.ts` and `src/lib/vocab.ts` started as copies of `../phase0-eval/src/` — keep them in step or the
Phase 0 eval stops testing what ships.

## Known limitations (Phase 1)

- **Recasts are only guaranteed for demonstrative–noun gender** (the commonest beginner error), which the app checks
  itself: 30/30 deliberate errors were recast and 0/20 correct sentences were wrongly flagged against the live model.
  Every other error type (adjective agreement, prepositions, word order…) still relies on `gpt-4o-mini`'s judgment behind
  the generic validator, so it is conservative and will miss things. Watch `turns.recast_rejected` and `turns.retried`
  during learner testing. The detector only knows nouns in `src/content/genders.ts` — add each lesson's nouns there.
- **Neon Auth is beta** (`@neondatabase/auth` 0.5.0-beta). Email OTP is used instead of a clickable magic link because
  that's what Neon Auth documents. Whether OTP sign-in auto-creates new users is not documented — verify with a fresh email.
- The vocab checker is heuristic (affix stripping), so it can miss some derived forms.
- **Arabic voice quality is vendor-dependent.** OpenAI describes its TTS voices as optimized for English. In the spike, speech-to-text
  recovered 100% of the words from the synthesized audio, but that cannot prove correct short vowels or case endings — judge by
  ear, and swap `lib/ai/tts.ts` if needed. Real learner speech is harder for the recogniser than synthesized speech; expect errors
  and rely on the confirm step.
- Learner pronunciation is not scored (deferred to v2). The cap day is UTC. The voice cap is charged by recording length and
  estimated speech length, not by provider invoices. Text practice is limited only by 40 learner turns per session.
