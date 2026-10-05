"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MixedText } from "../MixedText";
import { ArabicKeyboard, useArabicKeyboard } from "../session/[id]/ArabicKeyboard";

interface Item {
  id: string;
  original: string;
  topic: string;
}

interface Result {
  correct: boolean;
  corrected: string;
  tip: string;
  mastered: boolean;
  nextInDays: number | null;
}

const MAX_CHARS = 300;

export function ReviewQuiz({ items, dueTotal }: { items: Item[]; dueTotal: number }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const keyboard = useArabicKeyboard();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const item = items[index];
  const finished = index >= items.length;

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    const text = answer.trim();
    if (!text || checking || result) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mistakeId: item.id, answer: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't check that.");
      setResult(data);
      if (data.correct) setScore((s) => s + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check that.");
    } finally {
      setChecking(false);
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setAnswer("");
    setResult(null);
    setError(null);
  }

  if (finished) {
    const left = Math.max(0, dueTotal - items.length);
    return (
      <div className="mt-6 rounded-xl border border-line bg-card p-6 text-center">
        <p className="text-xl font-semibold">
          You fixed {score} of {items.length}.
        </p>
        <p className="mt-1 text-muted">
          Ones you got right come back later (3, 7, then 21 days); ones you missed come back tomorrow.
          {left > 0 ? ` ${left} more ${left === 1 ? "is" : "are"} due — do another round when you're ready.` : ""}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {left > 0 && (
            <a href="/learn/review" className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink">
              Another round
            </a>
          )}
          <Link href="/learn" className="rounded-lg border border-line px-4 py-2 hover:bg-accent-soft">
            Back to scenarios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={check} className="mt-6 flex flex-col gap-4">
      <p className="text-sm text-muted">
        {index + 1} of {items.length} · {item.topic}
      </p>

      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm text-muted">You wrote this earlier — fix it:</p>
        <p className="arabic mt-1 text-3xl">{item.original}</p>
      </div>

      <textarea
        ref={inputRef}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) check(e);
        }}
        dir="rtl"
        lang="ar"
        rows={2}
        maxLength={MAX_CHARS}
        inputMode={keyboard.open ? "none" : "text"}
        disabled={checking || result !== null}
        placeholder="Type the corrected sentence"
        aria-label="Your corrected sentence"
        className="arabic min-h-12 resize-none rounded-lg border border-line bg-card px-3 text-2xl outline-none placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-accent"
      />

      {result && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 ${result.correct ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn"}`}
        >
          <p className="font-semibold">{result.correct ? "Correct!" : "Not quite."}</p>
          <p className="mt-1 text-sm">{result.correct ? "The corrected sentence:" : "It should be:"}</p>
          <p className="arabic text-2xl font-bold">{result.corrected}</p>
          {!result.correct && (
            <p className="mt-1 text-sm">
              <MixedText>{result.tip}</MixedText>
            </p>
          )}
          <p className="mt-2 text-sm">
            {result.correct
              ? result.mastered
                ? "Mastered — this one is out of your review list."
                : `You'll see it again in ${result.nextInDays} days.`
              : "You'll see it again tomorrow."}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-warn-soft px-3 py-1.5 text-sm text-warn">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {result ? (
          <button type="button" onClick={next} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90">
            {index + 1 < items.length ? "Next" : "Finish"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={checking || !answer.trim()}
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
          >
            {checking ? "Checking…" : "Check"}
          </button>
        )}
        <button
          type="button"
          onClick={keyboard.toggle}
          aria-pressed={keyboard.open}
          className={`rounded-lg border border-line px-3 py-2.5 text-sm hover:bg-accent-soft ${keyboard.open ? "bg-accent-soft" : ""}`}
        >
          Arabic keyboard
        </button>
      </div>

      {keyboard.open && !result && (
        <ArabicKeyboard
          disabled={checking}
          onInsert={(c) => setAnswer((a) => (a + c).slice(0, MAX_CHARS))}
          onBackspace={() => setAnswer((a) => a.slice(0, -1))}
        />
      )}
    </form>
  );
}
