-- Jalees Phase 1 schema. Idempotent: safe to re-run (npm run db:migrate).
-- user_id columns are plain text (the id from Neon Auth's neon_auth schema), no cross-schema FK.
-- Per-user isolation is enforced in the app: every query on a user-owned table filters by user_id.

CREATE TABLE IF NOT EXISTS profiles (
  user_id        text PRIMARY KEY,
  display_name   text,
  level_book     int  NOT NULL DEFAULT 1,
  level_lesson   int  NOT NULL DEFAULT 1,
  tashkeel_pref  text NOT NULL DEFAULT 'full' CHECK (tashkeel_pref IN ('full', 'none')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id         serial PRIMARY KEY,
  book       int  NOT NULL,
  lesson_no  int  NOT NULL,
  title      text NOT NULL,
  vocab      jsonb NOT NULL,
  grammar    jsonb NOT NULL,
  UNIQUE (book, lesson_no)
);

CREATE TABLE IF NOT EXISTS scenarios (
  id                 text PRIMARY KEY,
  lesson_id          int  NOT NULL REFERENCES lessons(id),
  title              text NOT NULL,
  goal               text NOT NULL,
  opening_line       text NOT NULL,
  target_structures  jsonb NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text NOT NULL,
  scenario_id   text NOT NULL REFERENCES scenarios(id),
  started_at    timestamptz NOT NULL DEFAULT now(),
  ended_at      timestamptz,
  minutes_used  numeric NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sessions_user_started_idx ON sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS turns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role              text NOT NULL CHECK (role IN ('learner', 'buddy')),
  transcript_raw    text,                 -- learner turns: exactly what they typed
  text_display      text NOT NULL,
  text_diacritized  text NOT NULL,
  recast            jsonb,                -- buddy turns: {original, corrected, errorType} | null
  prompt_repeat     boolean NOT NULL DEFAULT false,
  vocab_flags       jsonb,                -- buddy turns: words that leaked above the lesson (pedagogy testing)
  retried           boolean NOT NULL DEFAULT false,
  recast_rejected   boolean NOT NULL DEFAULT false,  -- model's correction was unsafe even after a retry and was discarded
  -- clock_timestamp(), not now(): rows saved in one transaction must still sort in insertion order
  created_at        timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS turns_session_created_idx ON turns (session_id, created_at);

CREATE TABLE IF NOT EXISTS mistakes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        text NOT NULL,
  session_id     uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  error_type     text NOT NULL,
  original       text NOT NULL,
  corrected      text NOT NULL,
  review_due_at  timestamptz NOT NULL DEFAULT now() + interval '1 day',
  review_count   int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mistakes_user_created_idx ON mistakes (user_id, created_at DESC);

-- Phase 2 (voice) ---------------------------------------------------------------------------------------------
-- Daily voice spend per learner; the app enforces a 10-minute cap on stt_seconds + tts_seconds (src/lib/usage.ts).
-- day is the UTC date.
CREATE TABLE IF NOT EXISTS usage_daily (
  user_id      text NOT NULL,
  day          date NOT NULL,
  stt_seconds  numeric NOT NULL DEFAULT 0,
  tts_seconds  numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- Voice turns keep what the speech-to-text heard (asr_text) next to what the learner confirmed sending
-- (transcript_raw), which shows how often the recogniser "fixes" mistakes. Audio itself is never stored.
ALTER TABLE turns
  ADD COLUMN IF NOT EXISTS input_mode text NOT NULL DEFAULT 'text' CHECK (input_mode IN ('text', 'voice')),
  ADD COLUMN IF NOT EXISTS asr_text text,
  ADD COLUMN IF NOT EXISTS audio_seconds numeric;

-- Phase 3 (retention) -----------------------------------------------------------------------------------------
-- Mistake bank: one row per distinct corrected sentence per learner (key = normalized corrected words), so repeating a
-- mistake bumps times_seen and resets its review ladder instead of piling up duplicates. Legacy rows have a NULL key and
-- are ignored by review. review_count = correct reviews in a row (4 = mastered); review_due_at follows the 1/3/7/21-day ladder.
ALTER TABLE mistakes
  ADD COLUMN IF NOT EXISTS key text,
  ADD COLUMN IF NOT EXISTS times_seen int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS mistakes_user_key_idx ON mistakes (user_id, key) WHERE key IS NOT NULL;

-- What the buddy remembers about a learner. Learners can see, add and delete every row (web/src/app/learn/memory).
CREATE TABLE IF NOT EXISTS memory_facts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            text NOT NULL,
  fact               text NOT NULL,
  key                text NOT NULL,
  source             text NOT NULL CHECK (source IN ('learner', 'conversation')),
  source_session_id  uuid REFERENCES sessions(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
CREATE INDEX IF NOT EXISTS memory_facts_user_idx ON memory_facts (user_id, created_at DESC);

-- Post-session recap (generated once, on demand) — see web/src/lib/recap.ts.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recap jsonb;
