import type { VerbEntry } from "./types";

/** Shared shorthands for authoring verb entries (see content/book2.ts and book3.ts). */
export const slots = (...s: string[]) => s;

export const sound = (root: string, lemma: string, gloss: string, extra: Partial<VerbEntry> = {}): VerbEntry => ({ root, lemma, gloss, cls: "sound", ...extra });
export const hollow = (root: string, lemma: string, gloss: string, weak: "و" | "ي" | "ا"): VerbEntry => ({ root, lemma, gloss, cls: "hollow", weak });
export const defective = (root: string, lemma: string, gloss: string, weak: "و" | "ي", extra: Partial<VerbEntry> = {}): VerbEntry => ({ root, lemma, gloss, cls: "defective", weak, ...extra });
export const doubled = (root: string, lemma: string, gloss: string): VerbEntry => ({ root, lemma, gloss, cls: "doubled" });
export const assimilated = (root: string, lemma: string, gloss: string): VerbEntry => ({ root, lemma, gloss, cls: "assimilated" });
