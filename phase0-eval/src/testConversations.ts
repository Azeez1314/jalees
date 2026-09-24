import type { ScenarioSeed } from "./types.js";

/**
 * Adversarial-ish scenario goals per lesson: situations that tempt the buddy
 * to reach for vocabulary/grammar it hasn't taught yet (family, time, food,
 * feelings, past events) even though the learner's own turn stays within
 * their current lesson's scope. This is where leakage is most likely to
 * show up, since the buddy has to answer *something* to stay in character.
 */
const scenarioGoals: Record<number, string[]> = {
  1: [
    "learner is naming objects around the house",
    "learner is greeting the buddy for the first time",
    "learner is pointing at things in a classroom",
    "learner asks the buddy to identify an object",
  ],
  2: [
    "learner is describing which house/book is whose (this vs. that)",
    "learner is asking about the size or age of an object",
    "learner is comparing two objects across the room",
    "learner is at a shop pointing at items",
  ],
  3: [
    "learner is introducing themselves and asking who someone is",
    "learner is asking whose book/key something is (idafa)",
    "learner is asking a yes/no question about a person's job",
    "learner is meeting a new classmate",
  ],
  4: [
    "learner is asking where something is in the house",
    "learner is giving directions to the mosque or school",
    "learner is describing what's on top of / under the table",
    "learner is looking for a lost object",
  ],
  5: [
    "learner is asking to borrow someone else's pen/book",
    "learner is counting objects on the table",
    "learner is asking whose pen this is versus that one",
    "learner is talking about their own vs. a friend's belongings",
  ],
};

/** Learner probe turns per lesson: realistic for that exact lesson, but chosen to invite an ambitious buddy reply. */
const learnerProbes: Record<number, string[]> = {
  1: [
    "السَّلَامُ عَلَيْكُمْ",
    "مَا هَذَا؟",
    "هَذَا بَيْتٌ. وَمَا هَذِهِ؟",
    "يَا وَلَدُ، مَا هَذَا؟",
    "هَلْ هَذَا كِتَابٌ؟",
  ],
  2: [
    "مَا هَذَا الْبَيْتُ؟ هَلْ هُوَ كَبِيرٌ؟",
    "ذَلِكَ الْكِتَابُ جَمِيلٌ. وَهَذَا؟",
    "أَيْنَ الْبَيْتُ الْجَدِيدُ؟",
    "هَلْ تِلْكَ السَّيَّارَةُ صَغِيرَةٌ؟",
    "هَذَا الْقَلَمُ قَدِيمٌ.",
  ],
  3: [
    "مَنْ أَنْتَ؟ أَنَا طَالِبٌ.",
    "هَلْ أَنْتَ مُدَرِّسٌ؟",
    "مَا هَذَا؟ هَلْ هُوَ بَابُ الْبَيْتِ؟",
    "هِيَ طَالِبَةٌ. وَهُوَ؟",
    "هَلْ هَذَا مِفْتَاحُ السَّيَّارَةِ؟",
  ],
  4: [
    "أَيْنَ الْكِتَابُ؟",
    "هَلِ الْقَلَمُ عَلَى الْمَكْتَبِ أَمْ تَحْتَهُ؟",
    "الْمَدْرَسَةُ أَمَامَ الْمَسْجِدِ.",
    "مِنْ أَيْنَ أَنْتَ؟",
    "أَيْنَ السُّوقُ مِنْ هُنَا؟",
  ],
  5: [
    "أَيْنَ كِتَابِي؟",
    "هَلْ هَذَا قَلَمُكَ أَمْ قَلَمُهُ؟",
    "عِنْدِي ثَلَاثَةُ أَقْلَامٍ.",
    "كِتَابُهَا عَلَى الطَّاوِلَةِ.",
    "كَمْ كِتَابًا عِنْدَكَ؟ عِنْدِي اثْنَانِ.",
  ],
};

/** Builds ~20 test conversations for a given lesson by pairing probes with scenario goals. */
export function buildTestConversations(lessonNo: number): ScenarioSeed[] {
  const probes = learnerProbes[lessonNo] ?? [];
  const goals = scenarioGoals[lessonNo] ?? [];
  const seeds: ScenarioSeed[] = [];
  for (const goal of goals) {
    for (const probe of probes) {
      seeds.push({ title: goal, learnerTurn: probe });
    }
  }
  return seeds;
}
