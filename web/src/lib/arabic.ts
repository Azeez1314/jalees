/** Removes tashkeel (harakat, tanwin, shadda, sukun, superscript alef, Quranic marks). Leaves letters and tatweel untouched. */
export function stripTashkeel(text: string): string {
  return text.replace(/[ً-ٰٟۖ-ۭ]/g, "");
}
