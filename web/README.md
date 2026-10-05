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
| `npm run check:recast` | Unit checks for the recast safety validator (no network) |
| `npm run try:turn -- <scenarioId> "msg" …` | Runs a scripted conversation through the real turn pipeline — no DB or auth. Needs `OPENAI_API_KEY` |
| `npm run db:migrate` / `db:seed` | Schema and content sync |

## How a turn works (`POST /api/turn`)

1. Auth (Neon Auth session) → 401 if missing; the session must belong to the user.
2. `lib/prompt.ts` builds the system prompt: persona, **hard lesson constraints** (allowed vocab + grammar, verb ban),
   noun-gender table, scenario goal, recent mistakes, recast rules.
3. `lib/turn.ts` calls the model, then applies guard rails to the draft:
   - **vocab leak** — `lib/vocab.ts` checks every word against the lesson whitelist;
   - **unsafe recast** — `lib/recast.ts` only allows a correction that swaps function words or adds/drops the feminine
     ة on an adjective; it must quote the learner's actual words and never change a noun;
   - **dead end** — a reply with no correction must end with a question.
   If anything trips, the model gets one rewrite request naming the problems, and the better-scoring draft wins.
   Leaks that survive are stored (`turns.vocab_flags`) rather than blocked; an unsafe recast is dropped (`turns.recast_rejected`).
4. The learner turn, buddy turn and mistake row are saved in one transaction (`lib/queries.ts`).

## Content

`src/content/` is the source of truth (`lessons.ts`, `scenarios.ts`, `genders.ts`); `db:seed` mirrors it into the
`lessons`/`scenarios` tables so sessions can reference scenarios and content can be joined in analytics.
`src/content/lessons.ts` and `src/lib/vocab.ts` started as copies of `../phase0-eval/src/` — keep them in step or the
Phase 0 eval stops testing what ships.

## Known limitations (Phase 1)

- **Recast reliability** depends on the model. With `gpt-4o-mini` it was solid on demonstrative–noun gender
  (6/6) but inconsistent on harder inputs (e.g. noun + possessive suffix). Watch `turns.recast_rejected` and
  `turns.retried` during learner testing, and re-evaluate when a stronger model is available on the key.
- **Neon Auth is beta** (`@neondatabase/auth` 0.5.0-beta). Email OTP is used instead of a clickable magic link because
  that's what Neon Auth documents. Whether OTP sign-in auto-creates new users is not documented — verify with a fresh email.
- The vocab checker is heuristic (affix stripping), so it can miss some derived forms.
- No daily usage cap yet (only 40 learner turns per session); that arrives with voice in Phase 2.
