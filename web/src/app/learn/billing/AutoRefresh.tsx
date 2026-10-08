"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** After returning from Stripe the webhook may land a moment later than the redirect, so re-read the page for ~30 s. */
export function AutoRefresh({ everyMs = 3000, times = 10 }: { everyMs?: number; times?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const timer = window.setInterval(() => {
      router.refresh();
      if (++n >= times) window.clearInterval(timer);
    }, everyMs);
    return () => window.clearInterval(timer);
  }, [router, everyMs, times]);
  return null;
}
