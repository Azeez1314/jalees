/** Removes tashkeel (harakat, tanwin, shadda, sukun, superscript alef, Quranic marks). Leaves letters and tatweel untouched. */
export function stripTashkeel(text: string): string {
  return text.replace(/[ً-ٰٟۖ-ۭ]/g, "");
}

/** Strip tashkeel, normalize alef/hamza/ta-marbuta variants, remove tatweel. The form in which Arabic words are compared. */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ٰٟۖ-ۭ]/g, "") // tashkeel + small marks
    .replace(/ـ/g, "") // tatweel
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}
