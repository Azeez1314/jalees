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
  11: { masculine: ["نَبِيٌّ"], feminine: [] },
  12: {
    masculine: ["مُوَجِّهٌ", "دَرْسٌ"],
    feminine: ["فَتَاةٌ", "عَمَّةٌ", "خَالَةٌ", "زَمِيلَةٌ", "شَجَرَةٌ"],
  },
  13: {
    masculine: ["صَدِيقٌ", "حَاجٌّ", "ضَيْفٌ", "حَقْلٌ", "عَالِمٌ", "مَطْعَمٌ", "مَلْعَبٌ"],
    feminine: ["قَرْيَةٌ", "امْرَأَةٌ", "مَمْلَكَةٌ"],
  },
  14: {
    masculine: ["حَفِيدٌ", "بَلَدٌ", "دِينٌ", "مَطَارٌ", "يَوْمٌ"],
    feminine: ["كُلِّيَّةٌ", "شَرِيعَةٌ", "تِجَارَةٌ", "مَحْكَمَةٌ", "زِيَارَةٌ"],
  },
  15: { masculine: ["أُسْبُوعٌ", "شَهْرٌ", "أَذَانٌ", "اخْتِبَارٌ"], feminine: ["صَلَاةٌ", "أُسْتَاذَةٌ"] },
  // Lesson 16: a plural of THINGS is feminine singular for هذه / تلك (human plurals take هؤلاء and are not judged).
  16: {
    masculine: ["نَهْرٌ", "جَبَلٌ", "بَحْرٌ", "فُنْدُقٌ"],
    feminine: [
      "طَائِرَةٌ", "نُجُومٌ", "دُرُوسٌ", "أَقْلَامٌ", "أَبْوَابٌ", "أَنْهَارٌ", "جِبَالٌ", "كِلَابٌ", "بِحَارٌ", "كُتُبٌ", "حُمُرٌ", "سُرُرٌ",
      "دَفَاتِرُ", "مَكَاتِبُ", "فَنَادِقُ", "بُيُوتٌ",
    ],
  },
  17: { masculine: [], feminine: ["شَرِكَةٌ", "قُمْصَانٌ", "حَمِيرٌ", "لُغَاتٌ"] },
  18: {
    masculine: ["عِيدٌ", "حَيٌّ", "رِيَالٌ", "مَتْجَرٌ", "فَجْرٌ"],
    feminine: ["عَجَلَةٌ", "رَكْعَةٌ", "مِسْطَرَةٌ", "سَنَةٌ", "أَعْيَادٌ", "أَحْيَاءٌ", "مَسَاطِرُ"],
  },
  19: {
    masculine: ["ثَمَنٌ", "قِرْشٌ", "جَيْبٌ", "سُؤَالٌ", "نِصْفٌ"],
    feminine: ["حَافِلَةٌ", "قُرُوشٌ", "أَسْئِلَةٌ", "جُيُوبٌ", "أَيَّامٌ"],
  },
  20: { masculine: ["حَرْفٌ"], feminine: ["مَجَلَّةٌ", "كَلِمَةٌ", "حُرُوفٌ", "غُرَفٌ"] },
  21: { masculine: ["لَوْنٌ"], feminine: ["قِبْلَةٌ", "أَلْوَانٌ", "فُصُولٌ", "كَرَاسِيُّ"] },
  22: {
    masculine: ["فِنْجَانٌ"],
    feminine: ["دَقِيقَةٌ", "فَنَاجِينُ", "مَنَادِيلُ", "مَفَاتِيحُ", "مَسَاجِدُ", "مَدَارِسُ", "دَقَائِقُ"],
  },
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
