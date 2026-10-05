import Link from "next/link";
import { redirect } from "next/navigation";
import { tips } from "@/content/tips";
import { getUser } from "@/lib/auth/server";
import { countDueMistakes, getDueMistakes, getNextDueAt } from "@/lib/mistake-bank";
import { ERROR_TYPES, type ErrorType } from "@/lib/prompt";
import { ReviewQuiz } from "./ReviewQuiz";

export const dynamic = "force-dynamic";

const ROUND_SIZE = 5;

function describeWait(iso: string): string {
  const hours = Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));
  return hours < 36 ? "within a day" : `in ${Math.round(hours / 24)} days`;
}

export default async function ReviewPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");

  const [items, dueTotal, nextDue] = await Promise.all([
    getDueMistakes(user.id, ROUND_SIZE),
    countDueMistakes(user.id),
    getNextDueAt(user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/learn" className="text-sm text-muted underline">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Review your mistakes</h1>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <p className="text-lg font-medium">Nothing to review right now.</p>
          <p className="mt-1 text-muted">
            {nextDue
              ? `Your next review is due ${describeWait(nextDue)}.`
              : "When the buddy corrects you in a conversation, the mistake lands here and comes back after 1, 3, 7 and 21 days."}
          </p>
          <Link href="/learn" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink">
            Practise a scenario
          </Link>
        </div>
      ) : (
        <ReviewQuiz
          dueTotal={dueTotal}
          items={items.map((m) => {
            const type: ErrorType = ERROR_TYPES.includes(m.errorType as ErrorType) ? (m.errorType as ErrorType) : "other";
            // The verified answer stays on the server until the learner has answered.
            return { id: m.id, original: m.original, topic: tips[type].title };
          })}
        />
      )}
    </main>
  );
}
