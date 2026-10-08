import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { getOrCreateProfile } from "@/lib/queries";
import { PlacementFlow } from "./PlacementFlow";

export const dynamic = "force-dynamic";

export default async function PlacementPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  const profile = await getOrCreateProfile(user.id, user.name ?? null);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/learn" className="text-sm text-muted underline">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Find your starting point</h1>
      <PlacementFlow previousLesson={profile.placedAt ? profile.levelLesson : null} />
    </main>
  );
}
