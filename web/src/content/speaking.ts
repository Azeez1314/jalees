import { positionOf } from "@/content/lessons";
import { scenarios, type Scenario, type ScenarioSeed } from "@/content/scenarios";

/**
 * PROTOTYPE — the speaking track, for learners who understand Arabic (they have finished Madinah Books 1-3 or equivalent)
 * but speak hesitantly in short sentences. Unlike the ladder, these scenarios have no per-lesson whitelist: the buddy is
 * told to speak at an upper-intermediate level and the goal is to get the learner talking more, longer and more accurately.
 *
 * Scenarios are by situation/function (describe, narrate, justify, role-play), not by grammar structure. Openers are fully
 * diacritized and pass the scripture guard (`npm run check:speaking`); their audio is pre-rendered like the ladder's.
 *
 * `lessonNo` is 23 only so that code written for the ladder (recap, placement) has a number to work with; it is not used to
 * constrain the buddy.
 */
const seeds: ScenarioSeed[] = [
  {
    id: "sp-about-me",
    track: "speaking",
    lessonNo: 23,
    title: "Tell me about yourself",
    goal: "Introduce yourself in several sentences: who you are, what you study or do, your family, and why you are learning Arabic.",
    openingLine:
      "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ. تَشَرَّفْنَا بِمَعْرِفَتِكَ. حَدِّثْنِي عَنْ نَفْسِكَ: مَنْ أَنْتَ، وَمَاذَا تَدْرُسُ، وَلِمَاذَا تَتَعَلَّمُ اللُّغَةَ الْعَرَبِيَّةَ؟",
    targetStructures: ["self-description", "reasons (لأن / لكي)", "present tense"],
  },
  {
    id: "sp-my-day",
    track: "speaking",
    lessonNo: 23,
    title: "A normal day",
    goal: "Describe a typical day from morning to night, in order, with times and habits.",
    openingLine: "كَيْفَ تَبْدَأُ يَوْمَكَ عَادَةً؟ حَدِّثْنِي عَنْ يَوْمٍ عَادِيٍّ مِنْ حَيَاتِكَ، مِنَ الصَّبَاحِ إِلَى الْمَسَاءِ.",
    targetStructures: ["present tense", "sequence words (ثم، بعد ذلك)", "times"],
  },
  {
    id: "sp-yesterday",
    track: "speaking",
    lessonNo: 23,
    title: "What happened yesterday?",
    goal: "Tell a story from yesterday or last weekend, from the beginning to the end, in the past tense.",
    openingLine: "مَاذَا فَعَلْتَ يَوْمَ أَمْسِ؟ أُرِيدُ أَنْ أَسْمَعَ الْقِصَّةَ كَامِلَةً، مِنَ الْبِدَايَةِ إِلَى النِّهَايَةِ.",
    targetStructures: ["past tense narration", "sequence words", "follow-up details"],
  },
  {
    id: "sp-opinion",
    track: "speaking",
    lessonNo: 23,
    title: "What do you think?",
    goal: "Give an opinion and justify it with at least two reasons; respond when the buddy disagrees.",
    openingLine: "هَلْ تُفَضِّلُ الْعَيْشَ فِي الْمَدِينَةِ أَمْ فِي الْقَرْيَةِ؟ وَلِمَاذَا؟ أَعْطِنِي سَبَبَيْنِ عَلَى الْأَقَلِّ.",
    targetStructures: ["opinions", "reasons", "comparison"],
  },
  {
    id: "sp-appointment",
    track: "speaking",
    lessonNo: 23,
    title: "Ask your teacher for a meeting",
    goal: "Role-play: you phone your teacher to ask for an appointment, give a reason, agree a day and time, and be polite.",
    openingLine: "السَّلَامُ عَلَيْكُمْ. أَنَا الْأُسْتَاذُ، تَفَضَّلْ. كَيْفَ أَسْتَطِيعُ أَنْ أُسَاعِدَكَ؟",
    targetStructures: ["polite requests", "days and times", "reasons"],
  },
];

/** `lessonNo` 23 is only a placeholder position for code written for the ladder (recap, placement); it does not constrain the buddy. */
export const speakingScenarios: Scenario[] = seeds.map((s) => ({ ...s, position: positionOf(s.book ?? 1, s.lessonNo) }));

const allScenarios: Scenario[] = [...scenarios, ...speakingScenarios];

/** Finds a scenario of either track by id. */
export function findScenario(id: unknown): Scenario | undefined {
  return typeof id === "string" ? allScenarios.find((s) => s.id === id) : undefined;
}

export const isSpeaking = (s: Scenario) => s.track === "speaking";
