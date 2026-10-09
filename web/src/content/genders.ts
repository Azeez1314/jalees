/**
 * Grammatical gender of the nouns each lesson introduces. Injected into the prompt so the model judges agreement
 * (هذا/هذه, adjectives, pronouns) from facts instead of guessing — gpt-4o-mini gets this wrong otherwise.
 * It also drives the app's own demonstrative–noun agreement check (lib/agreement.ts): a noun missing here is simply never
 * judged. Keep in step with `newVocab` in lessons.ts. Left out on purpose: plurals (plural agreement isn't judged yet), country
 * and person names, and any word whose gender is disputed or that shares its spelling with a word of the other gender
 * (سوق, سكين, and رِجْل "leg", which collides with رَجُل "man" once tashkeel is dropped).
 */
export const nounGenders: Record<number, { masculine: string[]; feminine: string[] }> = {
  1: {
    masculine: [
      "بَابٌ", "مَسْجِدٌ", "بَيْتٌ", "مِفْتَاحٌ", "قَلَمٌ", "كِتَابٌ", "كُرْسِيٌّ", "سَرِيرٌ", "مَكْتَبٌ", "قَمِيصٌ", "نَجْمٌ", "مِنْدِيلٌ",
      "وَلَدٌ", "رَجُلٌ", "طَبِيبٌ", "طَالِبٌ", "تَاجِرٌ", "مُدَرِّسٌ", "كَلْبٌ", "قِطٌّ", "حِمَارٌ", "حِصَانٌ", "جَمَلٌ", "دِيكٌ",
    ],
    feminine: [],
  },
  2: { masculine: ["إِمَامٌ", "حَجَرٌ", "سُكَّرٌ", "لَبَنٌ"], feminine: [] },
  3: { masculine: ["قَمَرٌ", "مَاءٌ", "وَرَقٌ", "دَفْتَرٌ", "دُكَّانٌ", "تُفَّاحٌ"], feminine: [] },
  4: {
    masculine: ["فَصْلٌ", "حَمَّامٌ", "مِرْحَاضٌ", "مَطْبَخٌ", "مُدِيرٌ"],
    feminine: ["مَدْرَسَةٌ", "غُرْفَةٌ", "جَامِعَةٌ", "سَاعَةٌ", "سَمَاءٌ", "شَمْسٌ"],
  },
  5: {
    masculine: ["اِسْمٌ", "اِبْنٌ", "رَسُولٌ", "عَمٌّ", "خَالٌ", "شَارِعٌ", "مُهَنْدِسٌ", "أُسْتَاذٌ", "شَيْخٌ", "دُكْتُورٌ", "وَزِيرٌ"],
    feminine: ["بِنْتٌ", "كَعْبَةٌ", "حَقِيبَةٌ", "سَيَّارَةٌ", "مَدِينَةٌ"],
  },
  6: {
    masculine: ["فَلَّاحٌ", "أَنْفٌ", "فَمٌ", "شَايٌ", "أَبٌ", "مُسْلِمٌ"],
    feminine: [
      "مِكْوَاةٌ", "دَرَّاجَةٌ", "مِلْعَقَةٌ", "قِدْرٌ", "بَقَرَةٌ", "ثَلَّاجَةٌ", "قَهْوَةٌ", "نَافِذَةٌ", "دَجَاجَةٌ",
      "أُذُنٌ", "يَدٌ", "عَيْنٌ", "أُمٌّ", "أُخْتٌ", "طَبِيبَةٌ", "مُهَنْدِسَةٌ", "طَالِبَةٌ",
    ],
  },
  7: { masculine: ["مُؤَذِّنٌ"], feminine: ["مُمَرِّضَةٌ", "نَاقَةٌ", "بَيْضَةٌ", "حَدِيقَةٌ", "بَطَّةٌ"] },
  8: { masculine: ["مِحْرَابٌ"], feminine: ["سَبُّورَةٌ"] },
  9: {
    masculine: ["طَائِرٌ", "عُصْفُورٌ", "مُسْتَوْصَفٌ", "كُوبٌ"],
    feminine: ["لُغَةٌ", "مَكْتَبَةٌ", "مِرْوَحَةٌ", "فَاكِهَةٌ"],
  },
  10: { masculine: ["أَخٌ", "زَمِيلٌ", "زَوْجٌ", "فَتًى", "طِفْلٌ"], feminine: [] },
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
