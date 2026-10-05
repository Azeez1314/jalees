import Link from "next/link";
import type { Recap } from "@/lib/recap";
import { forgetFact } from "../../../actions";
import { MixedText } from "../../../MixedText";

/** The recap screen, as a plain component so it can be previewed with mock data. */
export function RecapView(props: {
  sessionId: string;
  scenarioTitle: string;
  recap: Recap;
  /** New facts that still exist (the learner may already have removed some). */
  newFacts: { id: string; fact: string }[];
  dueCount: number;
}) {
  const { sessionId: id, scenarioTitle, recap, newFacts, dueCount: due } = props;
  const { learnerTurns, voiceTurns } = recap.stats;
  const header = (
    <>
      <Link href={`/learn/session/${id}`} className="text-sm text-muted underline">
        ← Back to the conversation
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Session recap</h1>
      <p className="text-muted">{scenarioTitle}</p>
    </>
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      {header}
      <p className="mt-1 text-sm text-muted">
        {learnerTurns} {learnerTurns === 1 ? "reply" : "replies"}
        {voiceTurns > 0 ? ` · ${voiceTurns} spoken` : ""}
      </p>

      <section className="mt-5 rounded-xl border border-line bg-card p-4">
        <p>
          <MixedText>{recap.summary}</MixedText>
        </p>
        {recap.wentWell && (
          <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
            <span className="font-medium">Went well: </span>
            <MixedText>{recap.wentWell}</MixedText>
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Patterns to watch</h2>
        {recap.patterns.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-5 text-muted">
            No corrections this time — nice work.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recap.patterns.map((p) => (
              <li key={p.errorType} className="rounded-xl border border-line bg-card p-4">
                <p className="font-medium">
                  {p.title} <span className="text-sm font-normal text-muted">× {p.count}</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  <MixedText>{p.tip}</MixedText>
                </p>
                {p.examples.map((ex) => (
                  <p key={ex.right} className="mt-2 flex flex-wrap items-baseline gap-x-3">
                    <span className="arabic text-xl text-muted line-through">{ex.wrong}</span>
                    <span aria-hidden="true">→</span>
                    <span className="arabic text-xl font-bold">{ex.right}</span>
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      {newFacts.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Things I&apos;ll remember</h2>
          <ul className="flex flex-col gap-2">
            {newFacts.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-2.5">
                <span>{f.fact}</span>
                <form action={forgetFact}>
                  <input type="hidden" name="factId" value={f.id} />
                  <button className="shrink-0 rounded-lg border border-line px-3 py-1 text-sm hover:bg-warn-soft hover:text-warn">
                    Forget
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">
            You can see and remove everything in{" "}
            <Link href="/learn/memory" className="underline">
              What I remember about you
            </Link>
            .
          </p>
        </section>
      )}

      <section className="mt-6 rounded-xl bg-accent-soft p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Next</p>
        <p className="mt-1">
          <MixedText>{recap.nextStep}</MixedText>
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {due > 0 && (
            <Link href="/learn/review" className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink hover:opacity-90">
              Review {due} {due === 1 ? "mistake" : "mistakes"}
            </Link>
          )}
          <Link
            href="/learn"
            className={due > 0 ? "rounded-lg border border-line bg-card px-4 py-2 hover:bg-paper" : "rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink hover:opacity-90"}
          >
            Practise another scenario
          </Link>
        </div>
      </section>
    </main>
  );
}
