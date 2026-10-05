"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none focus:border-accent";
const buttonClass =
  "rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90 disabled:opacity-50";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
    setPending(false);
    if (error) return setError(error.message ?? "Couldn't send the code. Please try again.");
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.emailOtp({ email: email.trim(), otp: code.trim() });
    if (error) {
      setPending(false);
      return setError(error.message ?? "That code didn't work. Please try again.");
    }
    router.replace("/learn");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-5 py-16">
      <div>
        <Link href="/" className="arabic text-3xl font-bold text-accent">
          جَلِيسٌ
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-muted">
          {step === "email"
            ? "We'll email you a one-time code. No password needed."
            : `Enter the code we sent to ${email.trim()}.`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <label htmlFor="code" className="text-sm font-medium">
            One-time code
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputClass} tracking-widest`}
          />
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-sm text-muted underline"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          {error}
        </p>
      )}
    </main>
  );
}
