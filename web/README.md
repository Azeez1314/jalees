# Jalees web app (Phases 1-4: conversation, recaps, review, placement, billing)

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
| `npm run check:billing` | The access matrix (trial / subscribed / past_due / canceled / comp), the Stripe webhook handler with signed fake events (duplicates, out-of-order, outage-then-retry, bad signatures), the paywall, and the exact parameters sent to Checkout/Portal. Real Neon tables, throwaway users |
| `npm run check:placement` | The placement items are in-lesson and score correctly, wrong answers fail, the stop rule and outcomes, and the real attempt flow (resume, double-submit, ownership) |
| `npm run check:account` | Data export and deletion across all 8 tables with two learners: A's data is fully exported/removed, B's is untouched |
| `npm run check:scripture` | The "never quotes Qur'an or hadith" guard, plus `-- --live` to try to provoke the real model |
| `npm run check:stripe` | **Stripe test mode only** (refuses live keys): your Price is $9 USD monthly, and a real Checkout Session and Portal session can be created. No payment is made |
| `npm run check:launch` | Pre-launch checklist: fails while placeholders, draft legal pages, test-mode Stripe or a localhost APP_URL remain |
| `npm run metrics` | The spec's launch metrics (activation, engagement, D7/D30, trial→paid, cost per learner-day), aggregates only |
| `npm run check:content` | Fails if any scenario opener uses vocab above its lesson (run after editing content) |
| `npm run check:recast` | Unit checks for the generic recast safety validator (no network) |
| `npm run check:agreement` | Unit checks for the demonstrative–noun gender detector (no network) |
| `npm run check:praise` | Praise rate-limiting: strips sentence-opening praise unless the last 3 replies had none, and never next to a correction (no network) |
| `npm run check:usage` | Daily voice-cap arithmetic and the real `usage_daily` table (throwaway user, cleaned up) |
| `npm run check:voice` | Real TTS → STT round trip, MIME mapping, and `/api/tts` turn-ownership rules (a fraction of a cent; macOS `afinfo`) |
| `npm run check:retention` | Phase 3 logic (review ladder, mistake keys, streak, fact rules, tips, recap parsing) plus the real mistake-bank and memory tables with throwaway users |
| `npm run check:recap` | The recap flow end to end against the real DB and model: stats, patterns, fact extraction, idempotency, two racing requests (a fraction of a cent) |
| `npm run try:recap [runs]` | The recap narrative on three synthetic transcripts: lesson-only and role-play (must store no facts), and English asides (goal kept, a health detail must not be) |
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

## Retention (Phase 3)

The loop that brings a self-study learner back: finish a session → see what to work on → review it on a schedule.

- **Recap** (`/learn/session/[id]/recap`, `lib/recap.ts`, `lib/recap-service.ts`): generated once when the learner taps *Finish & recap*
  (idempotent — a refresh or double-click never re-spends). The **patterns** are deterministic: this session's corrections grouped by
  error type, with the real wrong → right pairs and a hand-written tip from `content/tips.ts`. The model writes only the English
  narrative and may quote Arabic only words that appear in the transcript or the lesson (anything else is replaced by a plain
  fallback). Grammar explanations are never model-written.
- **Mistake bank + spaced review** (`/learn/review`, `lib/review.ts`, `lib/mistake-bank.ts`): real, checkable corrections are banked once
  per distinct corrected sentence (a repeat bumps `times_seen` and restarts the ladder). Review is **typed on purpose** (dictation would let
  the recogniser silently fix the very error being practised), checked with the same word normalization as everywhere else, and moves
  a mistake along 1 → 3 → 7 → 21 days; four correct in a row = mastered. Deletions ("you used a verb above your lesson") are not mistakes
  and are never recast or banked.
- **Memory** (`/learn/memory`, `lib/memory.ts`, `lib/facts.ts`): learners write short notes about themselves, and facts they volunteer in a
  session are added at recap time. They can see, add and delete everything, or forget it all. Stored: short English phrases only.
  Refused: emails, links, phone numbers or long numbers. The recap extractor is told to skip health, money, politics, sexuality,
  contact details, addresses and anything about children, and to ignore sentences that merely practise vocabulary.
  Capped at 40 per learner.
- **Streak**: consecutive UTC days with at least one message, counting through yesterday so a morning visit isn't a zero; no guilt copy.

**The buddy does not use memory in Arabic yet (`BUDDY_SPEAKS_MEMORY = false` in `lib/facts.ts`).** Measured with gpt-4o-mini on the
Lesson 3 "Who are you?" scenario: replies containing words above the lesson rose from 5/38 (13%) to 15/38 (39%) when three facts were
added — the model reaches for *sister*, *work*, *country* despite being told to use a fact only if it can say it with the allowed
words. At Book 1 almost no personal fact is sayable in-lesson anyway. Facts currently personalize the English recap and the memory
page. To re-enable, re-run that comparison (`npm run try:turn -- b1l3-who-are-you "…" --fact "…"`, ~5 parallel runs at a time — the
200k tokens/min limit skews bigger batches).

## Billing and access (Phase 4)

**Model:** every learner gets a **7-day free trial with no card** (`profiles.trial_ends_at`, set at signup — the app, not Stripe, runs the
trial). After it, talking with the buddy needs the **$9/month** plan. Constants live in `lib/plans.ts`.

- **Who has access** is one pure function, `decideAccess` (`lib/billing.ts`): a live subscription (`active` / `trialing` / `past_due` —
  past_due is a grace period while Stripe retries the card), a comp, or a running trial. Anything else is locked. It fails closed.
- **What locks:** `/api/turn`, `/api/stt`, `/api/tts` and starting a session return **402** `{code: "subscription_required"}`.
  **What stays open:** mistake review, memory, recaps, placement, billing, and account/data pages, so a lapsed learner can always
  see, download and delete their data and has a reason to come back.
- **Checkout/Portal** (`lib/checkout.ts`): hosted Stripe Checkout (`mode: subscription`) and the Customer Portal. The Stripe customer is
  created and saved *before* payment, so every webhook can find the learner. Subscribing mid-trial starts billing immediately.
- **Webhook** (`/api/stripe/webhook`, `lib/stripe-sync.ts`): verifies the signature on the raw body, then for `checkout.session.completed` and
  `customer.subscription.created|updated|deleted` **re-reads the subscription from Stripe** and overwrites our row. Events can arrive
  duplicated and out of order, so we never trust the event body: a stale "active" event can't resurrect a cancelled subscription.
  Event ids are recorded only after success, so a failed attempt is retried by Stripe. (In current Stripe API versions the period end is on
  the subscription *items*; `snapshotFromStripe` reads it there.)
- **Comps** (the owner, testers): `npx tsx scripts/grant-access.ts <userId> [days]` — see below.

### Billing setup (test mode)

1. In Stripe (test mode): **Product catalog → Add product** "Jalees", recurring **$9.00 USD / month**; copy the **Price id** (`price_…`).
2. **Settings → Billing → Customer portal**: activate it (allow cancelling and updating the card).
3. Copy the secret key (`sk_test_…`) from **Developers → API keys**.
4. Put `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `APP_URL=http://localhost:3000` in `web/.env.local`. Run `npm run check:stripe` — it should confirm the Price.
5. For the webhook locally: install the [Stripe CLI](https://docs.stripe.com/stripe-cli), `stripe login`, then
   `stripe listen --forward-to localhost:3000/api/stripe/webhook` and put the `whsec_…` it prints in `STRIPE_WEBHOOK_SECRET`. Restart `npm run dev`.
6. In the app: **/learn/billing → Subscribe**, pay with Stripe's test card `4242 4242 4242 4242` (any future date, any CVC). Within seconds the page flips
   to "Subscribed". Then **Manage billing → cancel**, and watch it end at the period end.

In production: create the same product, price, portal **and webhook endpoint** (`https://YOUR-DOMAIN/api/stripe/webhook`, events above) in live
mode, and use the live keys. `npm run check:launch` lists everything still outstanding.

## Placement (Phase 4)

`/learn/placement`: ten short English → Arabic prompts, two per lesson, escalating. Production, not recognition. Scored **deterministically**
(`lib/placement.ts`): every required word slot must appear (diacritics, alef/hamza spelling, a leading ال and final ة/ه ignored; extra harmless words
allowed; **word order is not checked**) and the existing gender-agreement detector must find no error. No model is involved, so a grade can't be
hallucinated and the whole thing is unit-tested. It **stops at the first miss** (no spiral of questions the learner can't answer), shows no
per-item right/wrong, and starts the learner at the lesson of the first miss. If they pass everything and no further lesson exists, it says so honestly
("more lessons are on the way"). The server holds the attempt and chooses the next item; the client sends the question number so a double-click can
never be scored against the next question. Add items to `content/placement.ts` when you add a lesson and it extends automatically.

## Your data

Everything about one learner can be downloaded (`/api/account/export`) or deleted (`/learn/account`) by the learner. Deletion cancels any Stripe
subscription **first** (and refuses to proceed if that fails, so nobody is billed after deleting), removes every row in all 8 tables, then tries to close the
sign-in account. Whether Neon Auth lets a user delete themselves is **unverified** (the SDK exposes `deleteUser`; the managed server may have it switched
off): if it refuses, the learner is told their data is gone and that their sign-in account needs closing by us — in the Neon console under Auth → Users.
Voice audio is never stored. Stripe keeps its own invoice records as the law requires.

### Comping access

```bash
npx tsx scripts/grant-access.ts <email|userId> [days]   # no days = open-ended
npx tsx scripts/grant-access.ts <email|userId> revoke
```

An email resolves through Neon Auth's user table; an unknown user is refused rather than silently comped. **The owner's own account** gets the 7-day trial
like everyone else — comp yourself before it ends.

## Pre-launch

`npm run check:launch`. The legal pages (`/privacy`, `/terms`) are **drafts written from what the app really does — not legal advice**. They show a "Draft"
banner and visible `[PLACEHOLDERS]` (company, contact email, governing law, refund policy in `src/lib/site.ts`) until a lawyer has reviewed them and
`LEGAL_DRAFT` is set to false.

## Content

`src/content/` is the source of truth (`lessons.ts`, `scenarios.ts`, `genders.ts`); `db:seed` mirrors it into the
`lessons`/`scenarios` tables so sessions can reference scenarios and content can be joined in analytics.
`src/content/lessons.ts` and `src/lib/vocab.ts` started as copies of `../phase0-eval/src/` — keep them in step or the
Phase 0 eval stops testing what ships.

## Known limitations

- **Content is Book 1, lessons 1-5 only** (the spec's target learner is Book 2-3). This is the biggest gap between the product and its pitch;
  authoring further lessons (vocab, grammar, genders, scenarios, placement items) is the highest-value next step.
- **Scripture is never generated**: the prompt forbids it and `lib/scripture.ts` strips any sentence that frames or points at the Qur'an or hadith.
  Everyday expressions the course teaches (السلام عليكم, بسم الله, الحمد لله) are allowed as greetings. Real scripture, if ever added, must be
  retrieval-only from a verified corpus.
- **Neon Auth is beta** and its self-deletion path is unverified (see *Your data*). The Stripe webhook needs a public URL outside local testing.
- **OpenAI limits**: the key reaches only `gpt-4o-mini`, `gpt-4o-mini-transcribe` and `gpt-4o-mini-tts`, with a 200,000 tokens/minute cap.
  Each turn is 1-3 model calls; raise the limit before real traffic.
- **Placement** is translation-prompt based, order-insensitive and covers lessons 1-5; a spoken free-conversation placement would need a model judge.

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
- Recap and memory quality are `gpt-4o-mini`'s. The recap narrative is generic when the model's text is unusable (fallback), and fact
  extraction is conservative by design (an empty list is the normal outcome for lesson-only sessions).
- There are no reminders, push notifications or emails: the only nudge is the due count on `/learn`. Review is typed, not spoken.
- **Praise.** The buddy always wants to praise, and without an allowed list it reached for words above the lesson (جيد, ممتاز, مبروك,
  ما شاء الله). `praisePhrases` in `content/lessons.ts` (also mirrored in `phase0-eval`) now allows a small set of whole expressions
  from lesson 1 — no verbs, so no أحسنت. gpt-4o-mini then praised ~87% of replies ("مُمْتَازٌ!" opened most of them) and ignored the
  prompt rule to be rare, so `lib/praise.ts` enforces it in code: sentence-opening praise is stripped unless the last 3 buddy replies
  had none, and always next to a correction. Measured on 80 replies: 27% contain praise and 1% leak a word above the lesson (was 8%).
  The model still prefers one word (ممتاز) when it is allowed to praise. Remaining leaks are mostly place names (مدينة, بلد, مصر).
- Learner pronunciation is not scored (deferred to v2). The cap day is UTC. The voice cap is charged by recording length and
  estimated speech length, not by provider invoices. Text practice is limited only by 40 learner turns per session.
