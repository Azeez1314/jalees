"use client";

import { useSyncExternalStore } from "react";

/** Standard Arabic layout, left to right as on a physical Arabic keyboard (ض sits where Q does). */
const ROWS: string[][] = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
  ["ئ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "د", "ذ"],
];
const LAST_ROW = ["أ", "إ", "آ", "لا", "،", "؟"];

const STORAGE_KEY = "jalees.arabicKeyboard";
const CHANGE_EVENT = "jalees:keyboard-pref";

function subscribe(cb: () => void) {
  const coarse = window.matchMedia("(pointer: coarse)");
  coarse.addEventListener("change", cb);
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    coarse.removeEventListener("change", cb);
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

/** "1" / "0" = the learner's explicit choice, "auto" = no choice yet (open on touch screens, closed otherwise). */
function snapshot(): string {
  let pref: string | null = null;
  try {
    pref = localStorage.getItem(STORAGE_KEY);
  } catch {
    // storage blocked (private mode etc.): fall through to auto
  }
  if (pref === "1" || pref === "0") return `${pref}`;
  return window.matchMedia("(pointer: coarse)").matches ? "auto-open" : "auto-closed";
}

/** Whether the on-screen keyboard is shown. Defaults to open on touch devices, where there's often no Arabic keyboard installed. */
export function useArabicKeyboard(): { open: boolean; toggle: () => void } {
  const state = useSyncExternalStore(subscribe, snapshot, () => "auto-closed");
  const open = state === "1" || state === "auto-open";
  return {
    open,
    toggle: () => {
      try {
        localStorage.setItem(STORAGE_KEY, open ? "0" : "1");
      } catch {
        // can't persist; the toggle still works for this page view via the event below
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
  };
}

const keyClass =
  "flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-line bg-card text-xl leading-none select-none hover:bg-accent-soft active:bg-accent-soft disabled:opacity-50";
const arabicFont = { fontFamily: 'var(--font-arabic), "Noto Naskh Arabic", serif' };

export function ArabicKeyboard(props: {
  onInsert: (chunk: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  // mousedown would move focus off the textarea (and drop its cursor position); keep it there.
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div role="group" aria-label="Arabic keyboard" dir="ltr" className="flex flex-col gap-1.5" onMouseDown={keepFocus}>
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((ch) => (
            <button
              key={ch}
              type="button"
              disabled={props.disabled}
              onClick={() => props.onInsert(ch)}
              className={keyClass}
              style={arabicFont}
            >
              {ch}
            </button>
          ))}
        </div>
      ))}
      <div className="flex gap-1">
        {LAST_ROW.map((ch) => (
          <button
            key={ch}
            type="button"
            disabled={props.disabled}
            onClick={() => props.onInsert(ch)}
            className={keyClass}
            style={arabicFont}
          >
            {ch}
          </button>
        ))}
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => props.onInsert(" ")}
          aria-label="Space"
          className={`${keyClass} flex-[3] text-sm text-muted`}
        >
          space
        </button>
        <button
          type="button"
          disabled={props.disabled}
          onClick={props.onBackspace}
          aria-label="Backspace"
          className={`${keyClass} flex-[2] text-base`}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
