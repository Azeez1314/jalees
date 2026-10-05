"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { scenarios } from "@/content/scenarios";
import { stripTashkeel } from "@/lib/arabic";
import { getUser } from "@/lib/auth/server";
import { addFact, deleteAllFacts, deleteFact } from "@/lib/memory";
import { createSession, getOrCreateProfile, updateProfile, type TashkeelPref } from "@/lib/queries";

async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}

export async function startSession(formData: FormData) {
  const user = await requireUser();
  const scenario = scenarios.find((s) => s.id === formData.get("scenarioId"));
  if (!scenario) redirect("/learn");

  await getOrCreateProfile(user.id, user.name ?? null);
  const sessionId = await createSession(user.id, scenario.id, {
    textDiacritized: scenario.openingLine,
    textDisplay: stripTashkeel(scenario.openingLine),
  });
  redirect(`/learn/session/${sessionId}`);
}

export async function updateLevel(formData: FormData) {
  const user = await requireUser();
  const lesson = Number(formData.get("lesson"));
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > 5) return;
  await getOrCreateProfile(user.id, user.name ?? null);
  await updateProfile(user.id, { levelLesson: lesson });
  revalidatePath("/learn");
}

export async function setTashkeelPref(pref: TashkeelPref) {
  const user = await requireUser();
  if (pref !== "full" && pref !== "none") return;
  await getOrCreateProfile(user.id, user.name ?? null);
  await updateProfile(user.id, { tashkeelPref: pref });
}

export interface NoteState {
  error?: string;
  saved?: boolean;
}

/** "What I remember about you": a note the learner writes themselves (English is fine). */
export async function addNote(_prev: NoteState | null, formData: FormData): Promise<NoteState> {
  const user = await requireUser();
  const result = await addFact(user.id, String(formData.get("note") ?? ""), "learner");
  if (!result.ok) return { error: result.error };
  revalidatePath("/learn/memory");
  return { saved: true };
}

export async function forgetFact(formData: FormData) {
  const user = await requireUser();
  await deleteFact(user.id, String(formData.get("factId") ?? ""));
  revalidatePath("/learn/memory");
  revalidatePath("/learn", "layout");
}

export async function forgetAllFacts() {
  const user = await requireUser();
  await deleteAllFacts(user.id);
  revalidatePath("/learn/memory");
  revalidatePath("/learn", "layout");
}
