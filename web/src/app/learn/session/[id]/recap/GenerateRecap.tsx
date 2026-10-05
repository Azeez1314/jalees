"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Generates the recap once (the API is idempotent), then refreshes the server component to show it. */
export function GenerateRecap({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(true);
  const started = useRef(false);

  const run = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't build the recap.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't build the recap.");
      setWorking(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  if (error) {
    return (
      <div className="mt-6 rounded-xl bg-warn-soft px-4 py-4 text-warn" role="alert">
        <p>{error}</p>
        <div className="mt-3 flex gap-3">
          <button onClick={() => void run()} className="rounded-lg border border-warn px-3 py-1.5 text-sm font-medium">
            Try again
          </button>
          <Link href={`/learn/session/${sessionId}`} className="px-1 py-1.5 text-sm underline">
            Back to the conversation
          </Link>
        </div>
      </div>
    );
  }
  return (
    <p className="mt-6 rounded-xl border border-line bg-card px-4 py-6 text-center text-muted" role="status" aria-busy={working}>
      Writing your recap…
    </p>
  );
}
