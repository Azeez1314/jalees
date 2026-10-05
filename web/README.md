# Jalees web app (Phase 1: text conversation loop)

Next.js 16 (App Router) + Neon (Postgres and Neon Auth) + OpenAI. Learners sign in with an emailed one-time code, pick a
Madinah Book 1 scenario, and chat in Arabic. The buddy only uses the vocabulary and grammar of the scenario's lesson,
restates mistakes correctly ("recast"), and shows replies fully diacritized with a tashkeel toggle.

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
- No daily usage cap yet (only 40 learner turns per session); that arrives with voice in Phase 2.
