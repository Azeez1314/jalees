"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MAX_FACT_CHARS } from "@/lib/facts";
import { addNote, forgetAllFacts } from "../actions";

export function AddNoteForm() {
  const [state, formAction, pending] = useActionState(addNote, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box after a successful save.
  useEffect(() => {
    if (state?.saved) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="note"
          required
          maxLength={MAX_FACT_CHARS}
          placeholder="e.g. I'm learning Arabic to read the Qur'an"
          aria-label="A note about yourself"
          className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
        />
        <button
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-warn-soft px-3 py-1.5 text-sm text-warn">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function ForgetAllButton() {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="mt-4 text-sm text-muted underline hover:text-warn">
        Forget everything
      </button>
    );
  }
  return (
    <form action={forgetAllFacts} className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
      <span>Remove everything your buddy remembers about you?</span>
      <button className="rounded-lg border border-warn px-3 py-1.5 font-medium">Yes, forget it all</button>
      <button type="button" onClick={() => setConfirming(false)} className="underline">
        Cancel
      </button>
    </form>
  );
}
