/** Renders text that mixes English and Arabic, giving each Arabic run the Arabic font (the English font has no Arabic glyphs). */
export function MixedText({ children }: { children: string }) {
  const parts = children.split(/([؀-ۿ]+(?:\s+[؀-ۿ]+)*)/);
  return (
    <>
      {parts.map((part, i) =>
        /[؀-ۿ]/.test(part) ? (
          <span key={i} className="arabic-inline" lang="ar">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
