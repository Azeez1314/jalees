import Link from "next/link";
import { redirect } from "next/navigation";
import { lessons } from "@/content/lessons";
import { getUser } from "@/lib/auth/server";
import { PRICE_LABEL, TRIAL_DAYS } from "@/lib/plans";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", title: "Find your starting point", body: "A few quick sentences place you in the Madinah books — no marks shown, no pressure." },
  { n: "2", title: "Talk it out", body: "Short everyday conversations, by voice or typing. The buddy only uses Arabic you've already studied." },
  { n: "3", title: "Recap and review", body: "See what to work on, then fix your mistakes on a schedule so they actually stick." },
];

const FEATURES = [
  { title: "Only the Arabic you've studied", body: "Every reply is held to the vocabulary and grammar of your current lesson. If it can't say something at your level, it keeps it simple." },
  { title: "Gentle corrections", body: "When you slip, the buddy says your sentence back correctly — then you say it again. No lectures, no red ink." },
  { title: "Fully voweled Arabic", body: "Replies come with full tashkeel, spoken aloud at a patient pace, so you hear and see the endings together." },
  { title: "It remembers", body: "A mistake list that comes back after 1, 3, 7 and 21 days, a daily streak, and notes about you that you control." },
];

const lastLesson = Math.max(...lessons.map((l) => l.lessonNo));

const FAQ = [
  { q: "Who is it for?", a: "Learners following the Madinah books on their own who can read and follow along but freeze when they have to speak — and have nobody to practise with." },
  { q: "Which lessons does it cover?", a: `Madinah Book 1, lessons 1–${lastLesson}, today (the book has 23). We add lessons over time. The placement test tells you where you fit, and says so honestly if you're ahead of what's available.` },
  { q: "Does it teach Qur'an?", a: "No. It practises everyday Fus'ha conversation within your lesson. The buddy never quotes the Qur'an or hadith and doesn't give religious rulings." },
  { q: "Is my voice recorded?", a: "Not by us. Your audio is turned into text for the conversation and we keep only that text. See the privacy page for who processes it." },
  { q: "Can the buddy be wrong?", a: "Yes — it's an AI. It's a practice partner, not a certified teacher, so trust your books and teachers first. If something looks off, that's worth noting rather than memorising." },
  { q: "What happens after the free trial?", a: `Talking with the buddy needs the ${PRICE_LABEL} plan. Reviewing your mistakes, your notes and your data stay open either way. Cancel any time.` },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  if (await getUser()) redirect("/learn");
  const params = await searchParams;
  const deleted = params.deleted;

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-3xl px-5">
        <header className="flex items-center justify-between py-5">
          <span className="arabic text-3xl font-bold text-accent">جَلِيسٌ</span>
          <Link href="/auth/sign-in" className="text-sm underline">
            Sign in
          </Link>
        </header>

        {deleted && (
          <p role="status" className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-accent">
            {deleted === "all"
              ? "Your data and account have been deleted."
              : "Your data has been deleted. Your sign-in account itself couldn't be closed automatically — write to us and we'll remove it."}
          </p>
        )}

        <section className="flex flex-col gap-5 py-12 sm:py-20">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">The missing half of the Madinah books.</h1>
          <p className="max-w-xl text-lg text-muted">
            You can read and follow along. Jalees is the patient buddy that gets you <em>speaking</em> — in Fus&apos;ha, using only the Arabic you&apos;ve
            already studied, lesson by lesson. Practise any time, with nobody watching.
          </p>
          <div className="flex flex-col items-start gap-2">
            <Link href="/auth/sign-in" className="rounded-lg bg-accent px-6 py-3 text-lg font-medium text-accent-ink hover:opacity-90">
              Start free for {TRIAL_DAYS} days
            </Link>
            <p className="text-sm text-muted">No card needed. Then {PRICE_LABEL}, cancel any time.</p>
          </div>
        </section>

        <section aria-labelledby="how" className="py-8">
          <h2 id="how" className="mb-4 text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-xl border border-line bg-card p-4">
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink">{s.n}</span>
                <p className="font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="why" className="py-8">
          <h2 id="why" className="mb-4 text-2xl font-semibold tracking-tight">Built for self-study</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-line bg-card p-4">
                <p className="font-medium">{f.title}</p>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="coverage" className="py-8">
          <h2 id="coverage" className="mb-3 text-2xl font-semibold tracking-tight">What&apos;s here today</h2>
          <p className="rounded-xl bg-accent-soft px-4 py-3 text-accent">
            <span className="font-medium">Madinah Book 1, lessons 1–{lastLesson}.</span> We&apos;re starting small and growing lesson by lesson. If you&apos;re
            further along, the placement test will say so — and you&apos;re welcome to try it free first.
          </p>
        </section>

        <section aria-labelledby="price" className="py-8">
          <h2 id="price" className="mb-3 text-2xl font-semibold tracking-tight">One simple plan</h2>
          <div className="rounded-xl border border-line bg-card p-6">
            <p className="text-4xl font-semibold">
              $9 <span className="text-lg font-normal text-muted">/ month</span>
            </p>
            <ul className="mt-3 flex flex-col gap-1 text-muted">
              <li>✓ {TRIAL_DAYS}-day free trial, no card needed</li>
              <li>✓ Voice and text conversations, up to 10 minutes of voice a day</li>
              <li>✓ Corrections, recaps, mistake review, streaks</li>
              <li>✓ Costs less than one hour with a tutor — and it&apos;s there whenever you are</li>
            </ul>
            <Link href="/auth/sign-in" className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90">
              Start free
            </Link>
          </div>
        </section>

        <section aria-labelledby="faq" className="py-8">
          <h2 id="faq" className="mb-3 text-2xl font-semibold tracking-tight">Questions</h2>
          <div className="flex flex-col gap-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border border-line bg-card px-4 py-3">
                <summary className="cursor-pointer font-medium marker:text-accent">{f.q}</summary>
                <p className="mt-2 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-sm text-muted">
          <span className="arabic text-xl text-accent">جَلِيسٌ</span>
          <nav className="flex gap-4" aria-label="Footer">
            <Link href="/privacy" className="underline">Privacy</Link>
            <Link href="/terms" className="underline">Terms</Link>
            <Link href="/auth/sign-in" className="underline">Sign in</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
