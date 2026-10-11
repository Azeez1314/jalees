// Paradigm tests for the verb generator (no network). Each class is checked against its full written-out table.
// Run: npm run check:verbs
import { normalizeArabic } from "@/content/lessons";
import type { VerbEntry, VerbSlot } from "@/content/types";
import { ALL_SLOTS, expandSlots, generateForms } from "@/lib/verbs";

let failed = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `  —  ${detail}`}`);
};

/** `table`: slot -> expected forms (space separated alternatives), normalized by this helper like the generator's output. */
function paradigm(name: string, verb: VerbEntry, table: Record<string, string>) {
  let bad = 0;
  for (const [slot, expected] of Object.entries(table)) {
    const want = [...new Set(expected.split(" ").map(normalizeArabic))].sort().join(" ");
    const got = [...generateForms(verb, slot as VerbSlot)].sort().join(" ");
    if (want !== got) {
      bad++;
      console.log(`✗ ${name} ${slot}: expected [${want}] got [${got}]`);
    }
  }
  if (bad) failed += bad;
  else console.log(`✓ ${name}: ${Object.keys(table).length} slots`);
}

const P = (t: string, forms: string) => {
  const persons = ["3ms", "3fs", "3md", "3fd", "3mp", "3fp", "2ms", "2fs", "2d", "2mp", "2fp", "1s", "1p"];
  const arr = forms.split(",").map((s) => s.trim());
  const tbl: Record<string, string> = {};
  persons.forEach((p, i) => (tbl[`${t}:${p}`] = arr[i]));
  return tbl;
};

// ---- sound (ذَهَبَ يَذْهَبُ) ---------------------------------------------------------------------------------------------
const dhahaba: VerbEntry = { root: "ذهب", lemma: "ذَهَبَ", cls: "sound", gloss: "go" };
paradigm("sound past", dhahaba, P("past", "ذهب, ذهبت, ذهبا, ذهبتا, ذهبوا, ذهبن, ذهبت, ذهبت, ذهبتما, ذهبتم, ذهبتن, ذهبت, ذهبنا"));
paradigm("sound present", dhahaba, P("pres", "يذهب, تذهب, يذهبان, تذهبان, يذهبون, يذهبن, تذهب, تذهبين, تذهبان, تذهبون, تذهبن, اذهب, نذهب"));
paradigm("sound subjunctive (nun drops)", dhahaba, P("subj", "يذهب, تذهب, يذهبا, تذهبا, يذهبوا, يذهبن, تذهب, تذهبي, تذهبا, تذهبوا, تذهبن, اذهب, نذهب"));
paradigm("sound jussive", dhahaba, P("juss", "يذهب, تذهب, يذهبا, تذهبا, يذهبوا, يذهبن, تذهب, تذهبي, تذهبا, تذهبوا, تذهبن, اذهب, نذهب"));
paradigm("sound imperative", dhahaba, { "imp:2ms": "اذهب", "imp:2fs": "اذهبي", "imp:2d": "اذهبا", "imp:2mp": "اذهبوا", "imp:2fp": "اذهبن" });
check(generateForms(dhahaba, "imp:3ms").length === 0, "no imperative for the 3rd person");

// ---- assimilated (وَصَلَ يَصِلُ) ----------------------------------------------------------------------------------------
const wasala: VerbEntry = { root: "وصل", lemma: "وَصَلَ", cls: "assimilated", gloss: "arrive" };
paradigm("assimilated past", wasala, P("past", "وصل, وصلت, وصلا, وصلتا, وصلوا, وصلن, وصلت, وصلت, وصلتما, وصلتم, وصلتن, وصلت, وصلنا"));
paradigm("assimilated present (waw drops)", wasala, P("pres", "يصل, تصل, يصلان, تصلان, يصلون, يصلن, تصل, تصلين, تصلان, تصلون, تصلن, اصل, نصل"));
paradigm("assimilated imperative (no alef)", wasala, { "imp:2ms": "صل", "imp:2fs": "صلي", "imp:2d": "صلا", "imp:2mp": "صلوا", "imp:2fp": "صلن" });

// ---- hollow (قَالَ يَقُولُ، بَاعَ يَبِيعُ، خَافَ يَخَافُ) -------------------------------------------------------------------
const qala: VerbEntry = { root: "قول", lemma: "قَالَ", cls: "hollow", weak: "و", gloss: "say" };
paradigm("hollow past (قال)", qala, P("past", "قال, قالت, قالا, قالتا, قالوا, قلن, قلت, قلت, قلتما, قلتم, قلتن, قلت, قلنا"));
paradigm("hollow present (يقول)", qala, P("pres", "يقول, تقول, يقولان, تقولان, يقولون, يقلن, تقول, تقولين, تقولان, تقولون, تقلن, اقول, نقول"));
paradigm("hollow subjunctive", qala, P("subj", "يقول, تقول, يقولا, تقولا, يقولوا, يقلن, تقول, تقولي, تقولا, تقولوا, تقلن, اقول, نقول"));
paradigm("hollow jussive (shortens)", qala, P("juss", "يقل, تقل, يقولا, تقولا, يقولوا, يقلن, تقل, تقولي, تقولا, تقولوا, تقلن, اقل, نقل"));
paradigm("hollow imperative", qala, { "imp:2ms": "قل", "imp:2fs": "قولي", "imp:2d": "قولا", "imp:2mp": "قولوا", "imp:2fp": "قلن" });
const baa3a: VerbEntry = { root: "بيع", lemma: "بَاعَ", cls: "hollow", weak: "ي", gloss: "sell" };
paradigm("hollow ي (باع)", baa3a, { "past:3ms": "باع", "past:1s": "بعت", "past:3fs": "باعت", "pres:3ms": "يبيع", "pres:3fp": "يبعن", "juss:3ms": "يبع", "imp:2ms": "بع", "imp:2fs": "بيعي" });
const khaafa: VerbEntry = { root: "خوف", lemma: "خَافَ", cls: "hollow", weak: "ا", gloss: "fear" };
paradigm("hollow ا (خاف)", khaafa, { "past:3ms": "خاف", "past:1s": "خفت", "pres:3ms": "يخاف", "pres:3fp": "يخفن", "juss:3ms": "يخف", "imp:2ms": "خف", "imp:2fs": "خافي" });

// ---- defective (دَعَا، رَمَى، نَسِيَ) --------------------------------------------------------------------------------
const da3a: VerbEntry = { root: "دعو", lemma: "دَعَا", cls: "defective", weak: "و", gloss: "call" };
paradigm("defective waw past (دعا)", da3a, P("past", "دعا, دعت, دعوا, دعتا, دعوا, دعون, دعوت, دعوت, دعوتما, دعوتم, دعوتن, دعوت, دعونا"));
paradigm("defective waw present", da3a, P("pres", "يدعو, تدعو, يدعوان, تدعوان, يدعون, يدعون, تدعو, تدعين, تدعوان, تدعون, تدعون, ادعو, ندعو"));
paradigm("defective waw subjunctive", da3a, P("subj", "يدعو, تدعو, يدعوا, تدعوا, يدعوا, يدعون, تدعو, تدعي, تدعوا, تدعوا, تدعون, ادعو, ندعو"));
paradigm("defective waw jussive (loses the weak letter)", da3a, P("juss", "يدع, تدع, يدعوا, تدعوا, يدعوا, يدعون, تدع, تدعي, تدعوا, تدعوا, تدعون, ادع, ندع"));
paradigm("defective waw imperative", da3a, { "imp:2ms": "ادع", "imp:2fs": "ادعي", "imp:2d": "ادعوا", "imp:2mp": "ادعوا", "imp:2fp": "ادعون" });
const rama: VerbEntry = { root: "رمي", lemma: "رَمَى", cls: "defective", weak: "ي", gloss: "throw" };
paradigm("defective ya past (رمى)", rama, P("past", "رمي, رمت, رميا, رمتا, رموا, رمين, رميت, رميت, رميتما, رميتم, رميتن, رميت, رمينا"));
paradigm("defective ya present", rama, P("pres", "يرمي, ترمي, يرميان, ترميان, يرمون, يرمين, ترمي, ترمين, ترميان, ترمون, ترمين, ارمي, نرمي"));
paradigm("defective ya jussive + imperative", rama, { "juss:3ms": "يرم", "juss:2fs": "ترمي", "juss:3mp": "يرموا", "imp:2ms": "ارم", "imp:2fs": "ارمي", "imp:2d": "ارميا", "imp:2mp": "ارموا", "imp:2fp": "ارمين" });
const nasiya: VerbEntry = { root: "نسي", lemma: "نَسِيَ", cls: "defective", weak: "ي", kasraPast: true, gloss: "forget" };
paradigm("defective kasra past (نسي)", nasiya, P("past", "نسي, نسيت, نسيا, نسيتا, نسوا, نسين, نسيت, نسيت, نسيتما, نسيتم, نسيتن, نسيت, نسينا"));

// ---- doubled (مَدَّ يَمُدُّ) -----------------------------------------------------------------------------------------
const madda: VerbEntry = { root: "مدد", lemma: "مَدَّ", cls: "doubled", gloss: "extend" };
paradigm("doubled past (مد)", madda, P("past", "مد, مدت, مدا, مدتا, مدوا, مددن, مددت, مددت, مددتما, مددتم, مددتن, مددت, مددنا"));
paradigm("doubled present", madda, P("pres", "يمد, تمد, يمدان, تمدان, يمدون, يمددن, تمد, تمدين, تمدان, تمدون, تمددن, امد, نمد"));
paradigm("doubled jussive (merged or split)", madda, { "juss:3ms": "يمد يمدد", "juss:2ms": "تمد تمدد", "juss:3mp": "يمدوا", "juss:3fp": "يمددن", "juss:1s": "امد امدد" });
paradigm("doubled imperative", madda, { "imp:2ms": "مد امدد", "imp:2fs": "مدي", "imp:2d": "مدا", "imp:2mp": "مدوا", "imp:2fp": "امددن" });

// ---- Form IV --------------------------------------------------------------------------------------------------------------
const ahabba: VerbEntry = { root: "حبب", lemma: "أَحَبَّ", cls: "doubled", form: 4, gloss: "love" };
paradigm("Form IV doubled (أحب)", ahabba, { "past:3ms": "احب", "past:3fs": "احبت", "past:3mp": "احبوا", "past:3fp": "احببن", "past:1s": "احببت", "past:1p": "احببنا", "pres:3ms": "يحب", "pres:1s": "احب", "pres:3mp": "يحبون", "pres:3fp": "يحببن", "imp:2ms": "احب احبب" });
const araada: VerbEntry = { root: "رود", lemma: "أَرَادَ", cls: "hollow", form: 4, gloss: "want" };
paradigm("Form IV hollow (أراد)", araada, { "past:3ms": "اراد", "past:3fs": "ارادت", "past:3mp": "ارادوا", "past:3fp": "اردن", "past:1s": "اردت", "past:1p": "اردنا", "pres:3ms": "يريد", "pres:1s": "اريد", "pres:2fs": "تريدين", "pres:3mp": "يريدون", "pres:3fp": "يردن", "juss:3ms": "يرد", "imp:2ms": "ارد" });
const arsala: VerbEntry = { root: "رسل", lemma: "أَرْسَلَ", cls: "sound", form: 4, gloss: "send" };
paradigm("Form IV sound (أرسل)", arsala, { "past:3ms": "ارسل", "past:1s": "ارسلت", "pres:3ms": "يرسل", "pres:1s": "ارسل", "imp:2ms": "ارسل", "imp:2fs": "ارسلي" });

// ---- hamza-initial and irregular ------------------------------------------------------------------------------------
const akala: VerbEntry = { root: "أكل", lemma: "أَكَلَ", cls: "sound", gloss: "eat", overrides: { "imp:2ms": ["كل"], "imp:2fs": ["كلي"], "imp:2mp": ["كلوا"], "imp:2d": ["كلا"], "imp:2fp": ["كلن"] } };
paradigm("hamza-initial (أكل): آكل merges", akala, { "past:3ms": "اكل", "past:1s": "اكلت", "pres:3ms": "ياكل", "pres:1s": "اكل", "pres:1p": "ناكل", "imp:2ms": "كل", "imp:2mp": "كلوا" });
const sa2ala: VerbEntry = { root: "سأل", lemma: "سَأَلَ", cls: "sound", gloss: "ask" };
paradigm("hamza in the middle (سأل)", sa2ala, { "past:3ms": "سال", "pres:3ms": "يسال", "pres:1s": "اسال", "imp:2ms": "اسال" });

// ---- Form VIII defective (اشترى) and hamza-initial defective (أتى) ---------------------------------------------------------
const ishtara: VerbEntry = { root: "شري", lemma: "اِشْتَرَى", gloss: "buy", cls: "defective", weak: "ي", form: 8 };
paradigm("Form VIII defective (اشترى)", ishtara, {
  "past:3ms": "اشتري", "past:3fs": "اشترت", "past:3mp": "اشتروا", "past:3fp": "اشترين", "past:1s": "اشتريت", "past:1p": "اشترينا", "past:2mp": "اشتريتم",
  "pres:3ms": "يشتري", "pres:1s": "اشتري", "pres:3mp": "يشترون", "pres:2fs": "تشترين", "pres:3fp": "يشترين", "juss:3ms": "يشتر", "subj:3mp": "يشتروا",
  "imp:2ms": "اشتر", "imp:2fs": "اشتري", "imp:2mp": "اشتروا",
});
const ishtamala: VerbEntry = { root: "جمع", lemma: "اِجْتَمَعَ", gloss: "meet", cls: "sound", form: 8 };
paradigm("Form VIII sound (اجتمع)", ishtamala, { "past:3ms": "اجتمع", "past:1s": "اجتمعت", "pres:3ms": "يجتمع", "pres:1s": "اجتمع", "pres:3mp": "يجتمعون", "imp:2ms": "اجتمع" });
const ataa: VerbEntry = { root: "أتي", lemma: "أَتَى", gloss: "come", cls: "defective", weak: "ي", overrides: { "imp:2ms": ["ائت"], "imp:2fs": ["ائتي"], "imp:2mp": ["ائتوا"], "imp:2fp": ["ائتين"] } };
paradigm("hamza-initial defective (أتى)", ataa, {
  "past:3ms": "اتي", "past:3fs": "اتت", "past:3mp": "اتوا", "past:1s": "اتيت", "pres:3ms": "ياتي", "pres:1s": "اتي", "pres:3fs": "تاتي", "pres:3mp": "ياتون",
  "pres:2fs": "تاتين", "juss:3ms": "يات", "imp:2ms": "ائت",
});

// ---- doubled ت / ن at the suffix (written with a shadda) ----------------------------------------------------------------------
const kaana: VerbEntry = { root: "كون", lemma: "كَانَ", gloss: "be", cls: "hollow", weak: "و" };
paradigm("kaana: كنّا / كنّ", kaana, { "past:3ms": "كان", "past:3fs": "كانت", "past:1p": "كنا", "past:3fp": "كن", "past:1s": "كنت", "past:2mp": "كنتم", "pres:3ms": "يكون", "pres:3fp": "يكن", "juss:3ms": "يكن", "imp:2ms": "كن" });
const maata: VerbEntry = { root: "موت", lemma: "مَاتَ", gloss: "die", cls: "hollow", weak: "و" };
paradigm("maata: ماتت vs متّ", maata, { "past:3fs": "ماتت", "past:1s": "مت", "past:2mp": "متم", "past:1p": "متنا" });
const sakana: VerbEntry = { root: "سكن", lemma: "سَكَنَ", gloss: "live", cls: "sound" };
paradigm("sakana: سكنّ / سكنّا", sakana, { "past:3fp": "سكن", "past:1p": "سكنا", "pres:3fp": "يسكن", "pres:2fp": "تسكن" });

// ---- slots ------------------------------------------------------------------------------------------------------------------
check(ALL_SLOTS.length === 13 * 4 + 5, "13 persons × 4 tenses + 5 imperatives = 57 slots", String(ALL_SLOTS.length));
check(expandSlots(["past:*"]).length === 13, "past:* expands to 13 slots");
check(expandSlots(["*:3ms"]).length === 4, "*:3ms = past, present, subjunctive, jussive");
check(expandSlots(["imp:*", "past:3ms"]).length === 6, "patterns combine");

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll verb-generator checks pass.");
