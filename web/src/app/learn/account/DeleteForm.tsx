"use client";

import { useActionState, useState } from "react";
import { deleteMyData } from "./actions";

export function DeleteForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteMyData, null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg border border-warn px-4 py-2 text-warn hover:bg-warn-soft">
        Delete my data…
      </button>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg bg-warn-soft p-4 text-warn">
      <p className="font-medium">This permanently deletes your conversations, mistakes, notes, progress and plan — and cancels any subscription.</p>
      <p className="text-sm">It can&apos;t be undone. Consider downloading your data first.</p>
      <label htmlFor="confirm" className="text-sm font-medium">
        Type DELETE to confirm
      </label>
      <input id="confirm" name="confirm" autoComplete="off" required className="rounded-lg border border-warn bg-paper px-3 py-2 text-ink outline-none" />
      {state?.error && <p role="alert" className="text-sm font-medium">{state.error}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="rounded-lg bg-warn px-4 py-2 font-medium text-paper hover:opacity-90 disabled:opacity-50">
          {pending ? "Deleting…" : "Delete everything"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
