import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { DeleteForm } from "./DeleteForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/learn" className="text-sm text-muted underline">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your account & data</h1>
      <p className="text-muted">Signed in as {user.email}</p>

      <section className="mt-6 rounded-xl border border-line bg-card p-5">
        <h2 className="font-medium">Download my data</h2>
        <p className="mt-1 text-sm text-muted">
          Everything Jalees stores about you — profile, conversations, mistakes, notes, progress and plan — as a JSON file. Voice recordings are never
          stored, only the text that was recognised.
        </p>
        <a href="/api/account/export" className="mt-3 inline-block rounded-lg border border-line px-4 py-2 hover:bg-accent-soft">
          Download JSON
        </a>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-card p-5">
        <h2 className="font-medium">Your plan</h2>
        <p className="mt-1 text-sm text-muted">Subscribe, cancel or update your card.</p>
        <Link href="/learn/billing" className="mt-3 inline-block rounded-lg border border-line px-4 py-2 hover:bg-accent-soft">
          Billing
        </Link>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-card p-5">
        <h2 className="font-medium">Delete my data</h2>
        <p className="mt-1 mb-3 text-sm text-muted">Permanently remove your data and close your account. Any subscription is cancelled first.</p>
        <DeleteForm />
      </section>

      <p className="mt-6 text-sm text-muted">
        <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link>
      </p>
    </main>
  );
}
