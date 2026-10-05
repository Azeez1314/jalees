import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { MAX_FACTS } from "@/lib/facts";
import { listFacts } from "@/lib/memory";
import { forgetFact } from "../actions";
import { AddNoteForm, ForgetAllButton } from "./MemoryControls";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  const facts = await listFacts(user.id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/learn" className="text-sm text-muted underline">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">What I remember about you</h1>
      <p className="mt-1 text-muted">
        Your buddy keeps these notes to make your recaps and next steps personal. Only you can see them, and you can remove any of
        them at any time. For now they&apos;re used in the English parts of the app — the buddy will start using them in conversation
        once it can do so without going beyond the Arabic you&apos;ve learned.
      </p>

      <section className="mt-6 rounded-xl border border-line bg-card p-4">
        <h2 className="mb-2 font-medium">Tell your buddy about yourself</h2>
        <AddNoteForm />
        <p className="mt-2 text-sm text-muted">
          Why you&apos;re learning, family, work, interests — short notes in English are fine. Please don&apos;t add contact details.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Remembered ({facts.length}/{MAX_FACTS})
        </h2>
        {facts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-muted">
            Nothing yet. Add a note above, or the buddy may pick up details you mention during a session.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {facts.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3">
                <div className="min-w-0">
                  <p>{f.fact}</p>
                  <p className="text-xs text-muted">
                    {f.source === "learner" ? "You wrote this" : "From a conversation"} · {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <form action={forgetFact}>
                  <input type="hidden" name="factId" value={f.id} />
                  <button className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-warn-soft hover:text-warn">
                    Forget
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {facts.length > 0 && <ForgetAllButton />}
      </section>
    </main>
  );
}
