"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { lessons } from "@/content/lessons";
import { ArabicKeyboard, useArabicKeyboard } from "../session/[id]/ArabicKeyboard";
import { MAX_RECORD_SECONDS, useRecorder } from "../session/[id]/useRecorder";

const MAX_CHARS = 300;

interface Result {
  lesson: number;
  beyondContent: boolean;
}

export function PlacementFlow({ previousLesson }: { previousLesson: number | null }) {
  const [phase, setPhase] = useState<"intro" | "asking" | "result">("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(1);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const keyboard = useArabicKeyboard();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useRecorder({ onFinish: handleRecording, onError: setError });

  function apply(data: { index: number; prompt: string | null; done: boolean; placement: Result | null; attemptId?: string }) {
    if (data.attemptId) setAttemptId(data.attemptId);
    if (data.done && data.placement) {
      setResult(data.placement);
      setPhase("result");
      return;
    }
    setIndex(data.index);
    setPrompt(data.prompt);
    setText("");
    setPhase("asking");
  }

  async function call(url: string, body?: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
  }

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      apply(await call("/api/placement/start"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const answer = text.trim();
    if (!answer || busy || transcribing || recorder.recording || !attemptId) return;
    setBusy(true);
    setError(null);
    try {
      // `index` says which question this answers, so a double-click can never be scored against the next one.
      apply(await call("/api/placement/answer", { attemptId, text: answer, index }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRecording({ blob, seconds }: { blob: Blob; seconds: number }) {
    setTranscribing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "recording");
      form.append("seconds", String(seconds));
      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't transcribe that.");
      setText(String(data.text).slice(0, MAX_CHARS)); // lands in the box for the learner to check, like in conversations
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't transcribe that.");
    } finally {
      setTranscribing(false);
    }
  }

  const insert = (c: string) => setText((t) => (t + c).slice(0, MAX_CHARS));
  const backspace = () => setText((t) => t.slice(0, -1));

  if (phase === "intro") {
    return (
      <div className="mt-4">
        <p className="text-muted">
          A few quick sentences to work out which Madinah Book 1 lesson to start from. You&apos;ll see an English sentence and say or type it in
          Arabic. There are no marks shown and no pressure — it stops as soon as it knows where to begin, usually after just a few questions.
        </p>
        {previousLesson && <p className="mt-2 text-sm text-muted">You last placed at lesson {previousLesson}. Taking it again replaces that.</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>}
        <button onClick={begin} disabled={busy} className="mt-5 rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50">
          {busy ? "Starting…" : "Start"}
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    const lesson = lessons.find((l) => l.lessonNo === result.lesson);
    return (
      <div className="mt-4 rounded-xl border border-line bg-card p-5" role="status">
        <p className="text-sm text-muted">Your starting point</p>
        <p className="mt-1 text-2xl font-semibold">Madinah Book 1, Lesson {result.lesson}</p>
        {lesson && <p className="text-muted">{lesson.title}</p>}
        <p className="mt-3">
          {result.beyondContent
            ? "You answered everything we can test today — well done. More lessons are on the way; until then, Lesson 5 scenarios are the most advanced practice available."
            : result.lesson === 1
              ? "Lesson 1 is the perfect place to begin. You'll build from the very first sentences."
              : `You're comfortable up to lesson ${result.lesson - 1}, so lesson ${result.lesson} is where practice will help most.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/learn" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90">
            Start practising
          </Link>
          <button
            onClick={() => {
              setPhase("intro");
              setResult(null);
              setAttemptId(null);
            }}
            className="rounded-lg border border-line px-5 py-2.5 hover:bg-accent-soft"
          >
            Take it again
          </button>
        </div>
      </div>
    );
  }

  const busyAny = busy || transcribing;
  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
      <p className="text-sm text-muted">Question {index}</p>
      <div className="rounded-xl border border-line bg-card p-5">
        <p className="text-sm text-muted">Say this in Arabic:</p>
        <p className="mt-1 text-2xl font-medium">&ldquo;{prompt}&rdquo;</p>
      </div>

      {recorder.recording && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-warn-soft px-3 py-1.5 text-sm text-warn" role="status">
          <span>Recording {Math.floor(recorder.elapsed)}s / {MAX_RECORD_SECONDS}s — tap the mic to stop</span>
          <button type="button" onClick={recorder.cancel} className="underline">Cancel</button>
        </div>
      )}
      {transcribing && <p className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm text-accent" role="status">Listening…</p>}
      {error && <p role="alert" className="rounded-lg bg-warn-soft px-3 py-1.5 text-sm text-warn">{error}</p>}

      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          dir="rtl"
          lang="ar"
          rows={2}
          maxLength={MAX_CHARS}
          inputMode={keyboard.open ? "none" : "text"}
          disabled={busyAny}
          placeholder="Type or speak your answer"
          aria-label="Your answer in Arabic"
          className="arabic min-h-12 flex-1 resize-none rounded-lg border border-line bg-card px-3 text-xl outline-none placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-accent"
        />
        {recorder.supported && (
          <button
            type="button"
            onClick={() => (recorder.recording ? recorder.stop() : !busyAny && recorder.start())}
            disabled={busyAny}
            aria-pressed={recorder.recording}
            aria-label={recorder.recording ? "Stop recording" : "Record your answer"}
            className={`self-end rounded-lg border border-line px-3 py-2.5 hover:bg-accent-soft disabled:opacity-50 ${recorder.recording ? "bg-warn-soft text-warn motion-safe:animate-pulse" : ""}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={keyboard.toggle}
          aria-pressed={keyboard.open}
          aria-label="Arabic keyboard"
          className={`self-end rounded-lg border border-line px-3 py-2.5 hover:bg-accent-soft ${keyboard.open ? "bg-accent-soft" : ""}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={busyAny || recorder.recording || !text.trim()}
          className="self-end rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "Next"}
        </button>
      </div>
      {keyboard.open && <ArabicKeyboard onInsert={insert} onBackspace={backspace} disabled={busyAny} />}
    </form>
  );
}
