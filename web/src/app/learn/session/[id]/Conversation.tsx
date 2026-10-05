"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { stripTashkeel } from "@/lib/arabic";
import type { Recast } from "@/lib/turn";
import { setTashkeelPref } from "../../actions";
import { ArabicKeyboard, useArabicKeyboard } from "./ArabicKeyboard";

const MAX_CHARS = 300;

export interface ClientTurn {
  id: string;
  role: "learner" | "buddy";
  textDisplay: string;
  textDiacritized: string;
  recast: Recast | null;
  promptRepeat: boolean;
}

export function Conversation(props: {
  sessionId: string;
  title: string;
  goal: string;
  initialTurns: ClientTurn[];
  initialTashkeel: boolean;
}) {
  const [turns, setTurns] = useState<ClientTurn[]>(props.initialTurns);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tashkeel, setTashkeel] = useState(props.initialTashkeel);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const keyboard = useArabicKeyboard();

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

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const message = text.trim();
    if (!message || sending) return;

    const optimisticId = `pending-${Date.now()}`;
    setTurns((prev) => [
      ...prev,
      { id: optimisticId, role: "learner", textDisplay: message, textDiacritized: message, recast: null, promptRepeat: false },
    ]);
    setText("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: props.sessionId, text: message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setTurns((prev) => [
        ...prev,
        {
          id: `buddy-${Date.now()}`,
          role: "buddy",
          textDisplay: data.buddy.textDisplay,
          textDiacritized: data.buddy.textDiacritized,
          recast: data.buddy.recast,
          promptRepeat: data.buddy.promptRepeat,
        },
      ]);
    } catch (err) {
      // Nothing was saved server-side, so undo the optimistic message and give the text back.
      setTurns((prev) => prev.filter((t) => t.id !== optimisticId));
      setText(message);
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

      <p className="py-3 text-sm text-muted">Goal: {props.goal}</p>

      <div className="flex flex-1 flex-col gap-4 pb-4" aria-live="polite">
        {turns.map((t) => (
          <div key={t.id} className={`flex flex-col gap-2 ${t.role === "learner" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-1 text-2xl ${
                t.role === "learner" ? "bg-accent text-accent-ink" : "border border-line bg-card"
              }`}
            >
              <p className="arabic">{t.role === "learner" ? t.textDisplay : show(t)}</p>
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
        {awaitingRepeat && (
          <p className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm text-accent">
            Now say it again — type the corrected sentence in your own words.
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
            onChange={(e) => setText(e.target.value)}
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
            disabled={sending}
            placeholder="Type your reply in Arabic — no need for tashkeel"
            aria-label="Your reply"
            className="arabic min-h-12 flex-1 resize-none rounded-lg border border-line bg-card px-3 text-xl outline-none placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-accent"
          />
          <button
            type="button"
            onClick={keyboard.toggle}
            aria-pressed={keyboard.open}
            aria-label="Arabic keyboard"
            title="Arabic keyboard"
            className={`self-end rounded-lg border border-line px-3 py-2.5 hover:bg-accent-soft ${keyboard.open ? "bg-accent-soft" : ""}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="self-end rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {keyboard.open && <ArabicKeyboard onInsert={insert} onBackspace={backspace} disabled={sending} />}
      </form>
    </div>
  );
}
