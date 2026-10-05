import { lessons } from "@/content/lessons";
import { scenarios } from "@/content/scenarios";
import { getUser } from "@/lib/auth/server";
import { listFacts } from "@/lib/memory";
import { countDueMistakes } from "@/lib/mistake-bank";
import { getLatestNextStep, getOrCreateProfile, getPracticeDays, listRecentSessions } from "@/lib/queries";
import { computeStreak } from "@/lib/streak";
import { startSession, updateLevel } from "./actions";
import { SignOutButton } from "./SignOutButton";
import { StatCards } from "./StatCards";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");

  const profile = await getOrCreateProfile(user.id, user.name ?? null);
  const [recent, dueCount, facts, practiceDays, nextStep] = await Promise.all([
    listRecentSessions(user.id),
    countDueMistakes(user.id),
    listFacts(user.id),
    getPracticeDays(user.id),
    getLatestNextStep(user.id),
  ]);
  const streak = computeStreak(practiceDays);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="arabic w-fit text-3xl font-bold text-accent">جَلِيسٌ</p>
          <p className="text-muted">Signed in as {user.email}</p>
        </div>
        <SignOutButton />
      </header>

      {nextStep && (
        <p className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-accent">
          <span className="font-medium">Last time:</span> {nextStep}
        </p>
      )}

      <StatCards streak={streak} dueCount={dueCount} factCount={facts.length} />

      <form action={updateLevel} className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card p-4">
        <label htmlFor="lesson" className="font-medium">
          I&apos;ve studied Madinah Book 1 up to lesson
        </label>
        <select
          id="lesson"
          name="lesson"
          defaultValue={profile.levelLesson}
          className="rounded-lg border border-line bg-paper px-2 py-1.5"
        >
          {lessons.map((l) => (
            <option key={l.lessonNo} value={l.lessonNo}>
              {l.lessonNo}
            </option>
          ))}
        </select>
        <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-accent-soft">Save</button>
      </form>

      {recent.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Pick up where you left off</h2>
          <ul className="flex flex-col gap-2">
            {recent.map((s) => {
              const sc = scenarios.find((x) => x.id === s.scenarioId);
              return (
                <li key={s.id} className="flex items-stretch gap-2">
                  <Link
                    href={`/learn/session/${s.id}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3 hover:bg-accent-soft"
                  >
                    <span className="truncate">{sc?.title ?? s.scenarioId}</span>
                    <span className="shrink-0 text-sm text-muted">
                      {s.learnerTurns} {s.learnerTurns === 1 ? "reply" : "replies"} ·{" "}
                      {new Date(s.startedAt).toLocaleDateString()}
                    </span>
                  </Link>
                  {(s.hasRecap || s.learnerTurns > 0) && (
                    <Link
                      href={`/learn/session/${s.id}/recap`}
                      className="flex shrink-0 items-center rounded-lg border border-line bg-card px-3 text-sm hover:bg-accent-soft"
                    >
                      {s.hasRecap ? "Recap" : "Finish & recap"}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-8">
        {lessons.map((l) => {
          const ahead = l.lessonNo > profile.levelLesson;
          return (
            <div key={l.lessonNo}>
              <h2 className="mb-2 flex items-baseline gap-2 font-semibold">
                Lesson {l.lessonNo}: {l.title}
                {ahead && <span className="text-xs font-normal text-muted">(ahead of you)</span>}
              </h2>
              <ul className="flex flex-col gap-2">
                {scenarios
                  .filter((s) => s.lessonNo === l.lessonNo)
                  .map((s) => (
                    <li key={s.id}>
                      <form action={startSession}>
                        <input type="hidden" name="scenarioId" value={s.id} />
                        <button
                          className={`w-full rounded-lg border border-line bg-card px-4 py-3 text-left hover:bg-accent-soft ${
                            ahead ? "opacity-60" : ""
                          }`}
                        >
                          <span className="block font-medium">{s.title}</span>
                          <span className="block text-sm text-muted">{s.goal}</span>
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            </div>
          );
        })}
      </section>
    </main>
  );
}
