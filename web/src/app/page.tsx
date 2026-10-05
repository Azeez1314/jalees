import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await getUser()) redirect("/learn");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-5 py-16">
      <div className="flex flex-col gap-3">
        <p className="arabic w-fit text-5xl font-bold text-accent">جَلِيسٌ</p>
        <h1 className="text-3xl font-semibold tracking-tight">The missing half of the Madinah books.</h1>
        <p className="text-lg text-muted">
          You can read and listen. Jalees is the patient buddy that gets you speaking — using only the Arabic
          you&apos;ve already studied, lesson by lesson. No teacher needed, no one watching.
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-muted">
        <li>• Short situational chats matched to your Madinah lesson</li>
        <li>• Gentle corrections: the buddy restates your sentence correctly, then you say it again</li>
        <li>• Fully diacritized replies, so you read and learn the endings</li>
      </ul>

      <div className="flex flex-col items-start gap-2">
        <Link
          href="/auth/sign-in"
          className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-ink hover:opacity-90"
        >
          Start practising
        </Link>
        <p className="text-sm text-muted">Text practice for now — voice conversation is coming next.</p>
      </div>
    </main>
  );
}
