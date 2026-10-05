/**
 * Grammatical gender of the nouns each lesson introduces. Injected into the prompt so the model judges
 * agreement (هذا/هذه, adjectives, pronouns) from facts instead of guessing — gpt-4o-mini gets this wrong otherwise.
 * It also drives the app's own demonstrative–noun agreement check (lib/agreement.ts): a noun missing here is simply never
 * judged. Keep in step with `newVocab` in lessons.ts. Plurals are intentionally absent: plural agreement isn't judged yet.
 */
export const nounGenders: Record<number, { masculine: string[]; feminine: string[] }> = {
  1: {
    masculine: ["بَيْتٌ", "كِتَابٌ", "قَلَمٌ", "بَابٌ", "مَسْجِدٌ", "مِفْتَاحٌ", "كُرْسِيٌّ", "سَرِيرٌ", "قَمِيصٌ", "وَلَدٌ", "رَجُلٌ", "صَدِيقٌ"],
    feminine: ["بِنْتٌ", "اِمْرَأَةٌ"],
  },
  2: { masculine: [], feminine: ["سَيَّارَةٌ"] },
  3: { masculine: ["طَالِبٌ", "مُدَرِّسٌ"], feminine: ["طَالِبَةٌ", "مُدَرِّسَةٌ"] },
  4: { masculine: ["سُوقٌ", "مَكْتَبٌ"], feminine: ["مَدْرَسَةٌ", "طَاوِلَةٌ"] },
  5: { masculine: [], feminine: [] },
};

export function cumulativeGenders(uptoLesson: number): { masculine: string[]; feminine: string[] } {
  const out = { masculine: [] as string[], feminine: [] as string[] };
  for (const [no, g] of Object.entries(nounGenders)) {
    if (Number(no) <= uptoLesson) {
      out.masculine.push(...g.masculine);
      out.feminine.push(...g.feminine);
    }
  }
  return out;
}
