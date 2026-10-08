import Link from "next/link";
import { LEGAL_DRAFT, SITE } from "@/lib/site";

export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <Link href="/" className="arabic w-fit text-3xl font-bold text-accent">
        جَلِيسٌ
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">Last updated {SITE.lastUpdated}</p>
      {LEGAL_DRAFT && (
        <p role="note" className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          <span className="font-medium">Draft.</span> This page describes how Jalees works today but has not yet been reviewed by a lawyer.
        </p>
      )}
      <div className="mt-6 flex flex-col gap-6 leading-relaxed [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
      <p className="mt-10 border-t border-line pt-4 text-sm text-muted">
        <Link href="/" className="underline">Home</Link> · <Link href="/privacy" className="underline">Privacy</Link> ·{" "}
        <Link href="/terms" className="underline">Terms</Link>
      </p>
    </main>
  );
}
