"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export const MAX_RECORD_SECONDS = 30;
const MIN_RECORD_SECONDS = 0.6;

/** In preference order: the API reads webm and mp4 (Safari records mp4); ogg is a last resort for older Firefox. */
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

const noopSubscribe = () => () => {};
const canRecord = () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

function describeError(err: unknown): string {
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "The microphone is blocked. Allow it for this site in your browser's settings, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No microphone was found.";
  if (name === "NotReadableError") return "The microphone is in use by another app.";
  return "Couldn't start the microphone.";
}

/** Push-to-talk capture. Tap `start`, then `stop` (or wait for the 30 s limit); `onFinish` receives the recording. */
export function useRecorder(handlers: {
  onFinish: (rec: { blob: Blob; seconds: number }) => void;
  onError: (message: string) => void;
}) {
  // SSR-safe feature detection without a setState-in-effect.
  const supported = useSyncExternalStore(noopSubscribe, canRecord, () => false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const discardRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const release = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    discardRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      handlersRef.current.onError(describeError(err));
      return;
    }
    const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];
    discardRef.current = false;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const seconds = (performance.now() - startedAtRef.current) / 1000;
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      const discard = discardRef.current;
      release();
      if (discard) return;
      if (seconds < MIN_RECORD_SECONDS || blob.size === 0) {
        handlersRef.current.onError("That was too short — hold the thought, then tap the mic and speak.");
        return;
      }
      handlersRef.current.onFinish({ blob, seconds: Math.min(seconds, MAX_RECORD_SECONDS) });
    };

    startedAtRef.current = performance.now();
    setElapsed(0);
    setRecording(true);
    recorder.start();
    timerRef.current = window.setInterval(() => {
      const s = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(s);
      if (s >= MAX_RECORD_SECONDS) stop();
    }, 200);
  }, [release, stop]);

  // Leaving the page must never leave the mic open.
  useEffect(
    () => () => {
      discardRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      release();
    },
    [release]
  );

  return { supported, recording, elapsed, start, stop, cancel };
}
