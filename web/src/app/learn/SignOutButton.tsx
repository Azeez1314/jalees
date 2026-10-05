"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="text-sm text-muted underline hover:text-ink"
    >
      Sign out
    </button>
  );
}
