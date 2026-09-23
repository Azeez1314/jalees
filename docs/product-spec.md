# Jalees — MVP Product Spec

One-line identity: A buddy that teaches — voice conversation practice in Fus'ha for self-study, Qur'an-motivated learners following the Madinah books.

## Target user & problem

Non-Arab Muslims learning Arabic for Qur'an and Islamic heritage. Typical profile: strong reading/listening (often Madinah Book 2–3 level), near-zero speaking ability. Self-study, no teacher. Core blockers: no conversation partner, fear of embarrassment in the sacred language, no idea what level they're at.

Positioning: "The missing half of the Madinah curriculum." Price anchor: a human tutor at $10–20/hour — the app is a patient partner available anytime for less per month than one tutor session.

Goal framing (never "speak like a native"): speak with فصاحة — like an educated Arab in formal settings — and understand Qur'an and heritage texts without translation.

## MVP scope (v1)

1. **Placement conversation** — short voice/text assessment measuring production, not recognition. Output: "Start from Book X, Lesson Y."
2. **Turn-based voice conversation** — push-to-talk: record → STT → LLM → TTS → play. No realtime duplex. Thinking time is a feature.
3. **Lesson-constrained buddy** — buddy uses only vocabulary and grammar covered up to the learner's current Madinah lesson. Scenarios are ABY-style situational dialogues mapped per lesson.
4. **Live transcript** — buddy's speech shown on screen, fully diacritized (learners read well; hearing + seeing with tashkeel is a multiplier).
5. **Recast corrections** — buddy naturally restates the learner's sentence correctly, then prompts "say it again" before moving on (the fluency rep).
6. **Session recap + mistake bank** — post-session grammar recap; errors categorized (gender agreement, verb forms, prepositions, iʿrāb, tajwid-style over-articulation) and stored for spaced review.
7. **Buddy memory** — remembers learner's life details and prior mistakes across sessions; opens with follow-ups. Primary retention mechanism.
8. **10-minute daily session cap** — controls STT/TTS spend; pedagogically sound (short daily > long rare). Streaks framed around consistency.
9. **Subscription after free trial** — consumer, individual.

## Pipeline architecture

- STT: Munsit or Whisper-class (evaluate on accented learner speech, not native benchmarks).
- LLM (brain): frontier model (Claude/GPT) with Arabic-first prompting. Generates fully diacritized text internally; display per level, feed diacritized text to TTS always.
- TTS: Arabic-specialized (SILMA TTS / Arabic-F5-TTS). Slow-rate option with full iʿrāb endings.
- Qur'an & hadith: retrieval only, never generated from model weights. Verified corpus (Tanzil, graded hadith DBs), rendered exactly. Verses played as real recitation audio — never synthetic TTS.
- Memory: per-user store (profile facts + mistake bank) injected into context each session.
- Platform: web app first; mobile-native deferred.

## Content system

Per-lesson tables for Madinah Books 1–3: allowed vocabulary, allowed grammar structures, scenario list. Align to lesson numbers only — do not reproduce book text verbatim (IP care; ABY is commercial — pursue partnership if adding it later).

## Key risks

- ASR normalizes learner errors — transcripts come back "fixed," hiding mistakes. Mitigate: show learner their transcript for confirmation; treat voice correction as approximate; dedicated pronunciation assessment deferred.
- LLM leaks above-lesson Arabic — the model will drift fancier than Lesson N allows. Needs a hard eval suite per lesson before launch.
- One fabricated hadith kills the product. Retrieval-only policy is non-negotiable; add a citation display for every quote.
- Self-study churn — no external accountability. Memory + streaks + religious milestones ("understand a khutbah without translation") carry retention.

## Metrics

Activation: placement completed + first voice session. Engagement: sessions/week, learner speaking turns per session. Retention: D7/D30. Revenue: trial→paid conversion. Cost: voice-minutes per DAU.

## Distribution

Creator partnerships with Madinah-book YouTube teachers; r/learn_arabic, Telegram/Discord study groups, Islamic education podcasts. Plan launch and re-engagement pushes around Ramadan.

## Explicitly deferred to v2+

Realtime duplex voice · Beginner tier (hifz-activation curriculum) · Advanced/paid tier content (iʿrāb, tafsir discussion, khutbah register) · ABY spine · Teacher/institute dashboard · Pronunciation scoring · Community/cohorts · Mobile-native apps.
