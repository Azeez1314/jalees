"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { stripTashkeel } from "@/lib/arabic";
import type { Recast } from "@/lib/turn";
import { setTashkeelPref } from "../../actions";
import { ArabicKeyboard, useArabicKeyboard } from "./ArabicKeyboard";
import { useAudioPlayer } from "./useAudioPlayer";
import { MAX_RECORD_SECONDS, useRecorder } from "./useRecorder";

const MAX_CHARS = 300;
const VOICE_USED_UP = "You've used today's voice time. Text practice still works — voice resets tomorrow.";

export interface ClientTurn {
  id: string;
  role: "learner" | "buddy";
  textDisplay: string;
  textDiacritized: string;
  recast: Recast | null;
  promptRepeat: boolean;
}

/** What the speech-to-text heard, kept so it can be stored next to what the learner actually confirmed sending. */
interface VoiceMeta {
  asrText: string;
  seconds: number;
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function Conversation(props: {
  sessionId: string;
  scenarioId: string;
  title: string;
  goal: string;
  initialTurns: ClientTurn[];
  initialTashkeel: boolean;
  initialRemainingSeconds: number;
}) {
  const [turns, setTurns] = useState<ClientTurn[]>(props.initialTurns);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tashkeel, setTashkeel] = useState(props.initialTashkeel);
  const [remaining, setRemaining] = useState(props.initialRemainingSeconds);
  const [voiceMeta, setVoiceMeta] = useState<VoiceMeta | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const keyboard = useArabicKeyboard();
  const player = useAudioPlayer();
  const recorder = useRecorder({ onFinish: handleRecording, onError: setError });

  // The session's first turn is the scenario opener, which has pre-rendered audio (free, not charged to the voice cap).
  const openerId = props.initialTurns[0]?.role === "buddy" ? props.initialTurns[0].id : null;
  const voiceUsedUp = remaining <= 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, sending]);

  const last = turns[turns.length - 1];
  const awaitingRepeat = last?.role === "buddy" && last.promptRepeat;
  const show = (t: ClientTurn) => (tashkeel ? t.textDiacritized : t.textDisplay);

  // React resets the caret to the end when a controlled value changes, so restore it after the new value commits.
  useLayoutEffect(() => {
    const caret = pendingCaret.current;
    if (caret === null) return;
    pendingCaret.current = null;
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(caret, caret);
  }, [text]);

  /** Replaces the textarea's selection (or inserts at the caret) and puts the caret after the change. */
  function edit(transform: (before: string, after: string, selected: boolean) => { value: string; caret: number } | null) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const result = transform(text.slice(0, start), text.slice(end), start !== end);
    if (!result || result.value.length > MAX_CHARS) return;
    pendingCaret.current = result.caret;
    setText(result.value);
  }

  const insert = (chunk: string) => edit((before, after) => ({ value: before + chunk + after, caret: before.length + chunk.length }));
  const backspace = () =>
    edit((before, after, selected) => {
      if (selected) return { value: before + after, caret: before.length };
      if (!before) return null;
      return { value: before.slice(0, -1) + after, caret: before.length - 1 };
    });

  // ---- voice in -------------------------------------------------------------------------------------------------

  async function handleRecording({ blob, seconds }: { blob: Blob; seconds: number }) {
    setTranscribing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "recording");
      form.append("seconds", String(seconds));
      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = await res.json();
      if (typeof data.remainingSeconds === "number") setRemaining(data.remainingSeconds);
      if (!res.ok) throw new Error(data.error ?? "Couldn't transcribe that.");
      // The transcript lands in the normal text box: the learner checks it ("did I hear you right?"), can fix it
      // (including with the Arabic keyboard), and sends it down the same path as typed text.
      const heard = String(data.text).slice(0, MAX_CHARS);
      pendingCaret.current = heard.length;
      setText(heard);
      setVoiceMeta({ asrText: heard, seconds });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't transcribe that.");
    } finally {
      setTranscribing(false);
    }
  }

  function toggleMic() {
    if (recorder.recording) return recorder.stop();
    if (sending || transcribing || voiceUsedUp) return;
    setError(null);
    player.stop(); // never record the buddy's own voice
    player.unlock(); // must happen inside this tap so the reply can autoplay later (iOS)
    void recorder.start();
  }

  // ---- voice out ------------------------------------------------------------------------------------------------

  async function fetchTurnAudio(turnId: string): Promise<string> {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) setRemaining(0);
      throw new Error(res.status === 429 ? VOICE_USED_UP : (data.error ?? "Couldn't generate the audio."));
    }
    const left = Number(res.headers.get("X-Voice-Remaining"));
    if (Number.isFinite(left)) setRemaining(left);
    return URL.createObjectURL(await res.blob());
  }

  async function playTurn(turnId: string) {
    const getUrl = turnId === openerId ? async () => `/audio/openers/${props.scenarioId}.mp3` : () => fetchTurnAudio(turnId);
    const problem = await player.play(turnId, getUrl);
    if (problem) setError(problem);
  }

  // ---- sending --------------------------------------------------------------------------------------------------

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const message = text.trim();
    if (!message || sending || transcribing || recorder.recording) return;

    const viaVoice = voiceMeta;
    const optimisticId = `pending-${Date.now()}`;
    setTurns((prev) => [
      ...prev,
      { id: optimisticId, role: "learner", textDisplay: message, textDiacritized: message, recast: null, promptRepeat: false },
    ]);
    setText("");
    setVoiceMeta(null);
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: props.sessionId, text: message, voice: viaVoice ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      const buddyId = data.buddy.id as string;
      setTurns((prev) => [
        ...prev,
        {
          id: buddyId,
          role: "buddy",
          textDisplay: data.buddy.textDisplay,
          textDiacritized: data.buddy.textDiacritized,
          recast: data.buddy.recast,
          promptRepeat: data.buddy.promptRepeat,
        },
      ]);
      // Voice in, voice out: the text is already on screen; the audio follows when it's ready.
      if (viaVoice && !voiceUsedUp) void playTurn(buddyId);
    } catch (err) {
      // Nothing was saved server-side, so undo the optimistic message and give the text back.
      setTurns((prev) => prev.filter((t) => t.id !== optimisticId));
      setText(message);
      setVoiceMeta(viaVoice);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function toggleTashkeel() {
    const next = !tashkeel;
    setTashkeel(next);
    startTransition(() => {
      void setTashkeelPref(next ? "full" : "none");
    });
  }

  const busy = sending || transcribing;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-paper py-3">
        <div className="min-w-0">
          <Link href="/learn" className="text-sm text-muted underline">
            ← All scenarios
          </Link>
          <h1 className="truncate font-semibold">{props.title}</h1>
        </div>
        <button
          onClick={toggleTashkeel}
          aria-pressed={tashkeel}
          className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-accent-soft"
        >
          Tashkeel: {tashkeel ? "on" : "off"}
        </button>
      </header>

      <p className="pt-3 text-sm text-muted">Goal: {props.goal}</p>
      <div className="flex items-center justify-between gap-3 py-2 text-sm text-muted">
        <span>{voiceUsedUp ? "Voice time used up for today — typing still works" : `Voice time left today: ${clock(remaining)}`}</span>
        <button
          onClick={() => player.setSlow(!player.slow)}
          aria-pressed={player.slow}
          className={`shrink-0 rounded-lg border border-line px-2.5 py-1 hover:bg-accent-soft ${player.slow ? "bg-accent-soft text-accent" : ""}`}
        >
          Slow audio: {player.slow ? "on" : "off"}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 pb-4" aria-live="polite">
        {turns.map((t) => (
          <div key={t.id} className={`flex flex-col gap-2 ${t.role === "learner" ? "items-end" : "items-start"}`}>
            <div className={`flex max-w-[85%] items-center gap-2 ${t.role === "learner" ? "flex-row-reverse" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-1 text-2xl ${
                  t.role === "learner" ? "bg-accent text-accent-ink" : "border border-line bg-card"
                }`}
              >
                <p className="arabic">{t.role === "learner" ? t.textDisplay : show(t)}</p>
              </div>
              {t.role === "buddy" && (
                <button
                  onClick={() => (player.playingKey === t.id ? player.stop() : void playTurn(t.id))}
                  disabled={player.loadingKey === t.id || (voiceUsedUp && t.id !== openerId && !player.cached.has(t.id))}
                  aria-label={player.playingKey === t.id ? "Stop audio" : "Play audio"}
                  title={voiceUsedUp && t.id !== openerId && !player.cached.has(t.id) ? "Voice time used up for today" : "Play audio"}
                  className="shrink-0 rounded-full border border-line p-2 text-muted hover:bg-accent-soft hover:text-accent disabled:opacity-40"
                >
                  {player.loadingKey === t.id ? (
                    <span className="block h-[18px] w-[18px] text-center text-xs leading-[18px]">…</span>
                  ) : player.playingKey === t.id ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <rect x="6" y="6" width="12" height="12" rx="1.5" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 5 6 9H3v6h3l5 4V5z" />
                      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {t.recast && (
              <div className="max-w-[85%] rounded-xl bg-warn-soft px-4 py-2 text-sm text-warn">
                <p>
                  You wrote: <span className="arabic text-lg">{t.recast.original}</span>
                </p>
                <p>
                  Try it like this:{" "}
                  <span className="arabic text-lg font-bold">
                    {tashkeel ? t.recast.corrected : stripTashkeel(t.recast.corrected)}
                  </span>
                </p>
              </div>
            )}
          </div>
        ))}

        {sending && <p className="text-sm text-muted">The buddy is thinking…</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-paper py-3">
        {awaitingRepeat && !recorder.recording && !voiceMeta && (
          <p className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm text-accent">
            Now say it again — tap the mic or type the corrected sentence.
          </p>
        )}
        {recorder.recording && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-warn-soft px-3 py-1.5 text-sm text-warn" role="status">
            <span>
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-warn motion-safe:animate-pulse" />
              Recording {clock(recorder.elapsed)} / {clock(MAX_RECORD_SECONDS)} — tap the mic to stop
            </span>
            <button type="button" onClick={recorder.cancel} className="underline">
              Cancel
            </button>
          </div>
        )}
        {transcribing && (
          <p className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm text-accent" role="status">
            Listening…
          </p>
        )}
        {voiceMeta && text.trim() && !busy && !recorder.recording && (
          <p className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm text-accent">
            Did I hear you right? Fix anything that&apos;s wrong, then Send.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-warn-soft px-3 py-1.5 text-sm text-warn">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!e.target.value) setVoiceMeta(null); // starting over by typing: no longer a dictated message
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send(e);
            }}
            dir="rtl"
            lang="ar"
            rows={2}
            maxLength={MAX_CHARS}
            ref={inputRef}
            // With the on-screen keyboard open, keep the phone's own keyboard from covering it.
            inputMode={keyboard.open ? "none" : "text"}
            disabled={busy}
            placeholder="Type or speak your reply"
            aria-label="Your reply"
            className="arabic min-h-12 flex-1 resize-none rounded-lg border border-line bg-card px-3 text-xl outline-none placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-accent"
          />
          {recorder.supported && (
            <button
              type="button"
              onClick={toggleMic}
              disabled={busy || (voiceUsedUp && !recorder.recording)}
              aria-pressed={recorder.recording}
              aria-label={recorder.recording ? "Stop recording" : voiceUsedUp ? "Voice time used up" : "Record your reply"}
              title={voiceUsedUp ? "Voice time used up for today" : recorder.recording ? "Stop recording" : "Record your reply"}
              className={`self-end rounded-lg border border-line px-3 py-2.5 hover:bg-accent-soft disabled:opacity-50 ${
                recorder.recording ? "bg-warn-soft text-warn motion-safe:animate-pulse" : ""
              }`}
            >
              <Icon>
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </Icon>
            </button>
          )}
          <button
            type="button"
            onClick={keyboard.toggle}
            aria-pressed={keyboard.open}
            aria-label="Arabic keyboard"
            title="Arabic keyboard"
            className={`self-end rounded-lg border border-line px-3 py-2.5 hover:bg-accent-soft ${keyboard.open ? "bg-accent-soft" : ""}`}
          >
            <Icon>
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
            </Icon>
          </button>
          <button
            type="submit"
            disabled={busy || recorder.recording || !text.trim()}
            className="self-end rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {keyboard.open && <ArabicKeyboard onInsert={insert} onBackspace={backspace} disabled={busy} />}
      </form>
    </div>
  );
}
