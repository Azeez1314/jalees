"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error); // visible in the browser console and (for server errors) identified by the digest in server logs
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 py-16" role="alert">
      <p className="arabic w-fit text-4xl font-bold text-accent">جَلِيسٌ</p>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong on our side.</h1>
      <p className="text-muted">Your progress is safe. Please try again — if it keeps happening, tell us{error.digest ? ` (reference ${error.digest})` : ""}.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90">
          Try again
        </button>
        <Link href="/learn" className="rounded-lg border border-line px-5 py-2.5 hover:bg-accent-soft">
          Back to your lessons
        </Link>
      </div>
    </main>
  );
}
