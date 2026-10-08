import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 py-16">
      <p className="arabic w-fit text-4xl font-bold text-accent">جَلِيسٌ</p>
      <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that page.</h1>
      <p className="text-muted">The link may be old, or the page may have moved.</p>
      <Link href="/" className="w-fit rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90">
        Back to Jalees
      </Link>
    </main>
  );
}
