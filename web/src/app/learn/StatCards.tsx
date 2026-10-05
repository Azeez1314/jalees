import Link from "next/link";

/** The dashboard's three cards. Consistency framing: celebrate the run, never scold a gap. */
export function StatCards({ streak, dueCount, factCount }: { streak: number; dueCount: number; factCount: number }) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-3 text-center">
      <div className="rounded-xl border border-line bg-card px-2 py-3">
        <p className="text-2xl font-semibold">{streak}</p>
        <p className="text-xs text-muted">{streak === 1 ? "day in a row" : streak > 1 ? "days in a row" : "Practise today to start a streak"}</p>
      </div>
      <Link
        href="/learn/review"
        className={`rounded-xl border px-2 py-3 hover:bg-accent-soft ${dueCount > 0 ? "border-accent bg-accent-soft" : "border-line bg-card"}`}
      >
        <p className="text-2xl font-semibold">{dueCount}</p>
        <p className="text-xs text-muted">{dueCount === 1 ? "mistake to review" : "mistakes to review"}</p>
      </Link>
      <Link href="/learn/memory" className="rounded-xl border border-line bg-card px-2 py-3 hover:bg-accent-soft">
        <p className="text-2xl font-semibold">{factCount}</p>
        <p className="text-xs text-muted">{factCount === 1 ? "thing I remember" : "things I remember"}</p>
      </Link>
    </div>
  );
}
