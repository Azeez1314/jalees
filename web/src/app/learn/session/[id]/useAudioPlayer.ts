"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A 0.1 s silent WAV. Playing it from a tap "unlocks" the audio element so iOS lets later (non-gesture) playback through. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
export const SLOW_RATE = 0.75;

export type PlaybackKey = string;

/**
 * One shared <audio> element: playing a new clip stops the previous one. Fetched clips are cached as blob URLs by key,
 * so replaying a buddy turn costs nothing. Slow playback is `playbackRate` (free) rather than a second TTS render.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef(new Map<PlaybackKey, string>());
  const playTokenRef = useRef(0);
  const [playingKey, setPlayingKey] = useState<PlaybackKey | null>(null);
  const [loadingKey, setLoadingKey] = useState<PlaybackKey | null>(null);
  const [slow, setSlowState] = useState(false);
  // Keys whose audio is already in the cache: replaying those costs nothing, even when the voice cap is used up.
  const [cached, setCached] = useState<ReadonlySet<PlaybackKey>>(new Set());
  const slowRef = useRef(false);

  const element = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.addEventListener("ended", () => setPlayingKey(null));
      a.addEventListener("pause", () => setPlayingKey(null));
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  /** Call from a tap handler (e.g. the mic button) so replies can autoplay later. Safe to call repeatedly. */
  const unlock = useCallback(() => {
    const a = element();
    if (a.dataset.unlocked) return;
    a.dataset.unlocked = "1";
    a.src = SILENT_WAV;
    a.play().catch(() => {});
  }, [element]);

  const stop = useCallback(() => {
    playTokenRef.current++;
    audioRef.current?.pause();
    setLoadingKey(null);
  }, []);

  /**
   * Plays the clip for `key`, resolving its URL with `getUrl` the first time. Resolves to null on success, or a short
   * message for the UI (autoplay blocked, fetch failed...). A newer play() call cancels an older one still loading.
   */
  const play = useCallback(
    async (key: PlaybackKey, getUrl: () => Promise<string>): Promise<string | null> => {
      const token = ++playTokenRef.current;
      const a = element();
      a.pause();
      try {
        let url = cacheRef.current.get(key);
        if (!url) {
          setLoadingKey(key);
          url = await getUrl();
          cacheRef.current.set(key, url);
          setCached((prev) => new Set(prev).add(key));
        }
        if (token !== playTokenRef.current) return null; // superseded while loading
        a.src = url;
        a.playbackRate = slowRef.current ? SLOW_RATE : 1;
        a.preservesPitch = true;
        setPlayingKey(key);
        await a.play();
        return null;
      } catch (err) {
        setPlayingKey(null);
        if ((err as { name?: string })?.name === "NotAllowedError") return "Tap the speaker to hear the reply.";
        return err instanceof Error ? err.message : "Couldn't play the audio.";
      } finally {
        if (token === playTokenRef.current) setLoadingKey(null);
      }
    },
    [element]
  );

  const setSlow = useCallback((on: boolean) => {
    slowRef.current = on;
    setSlowState(on);
    if (audioRef.current) audioRef.current.playbackRate = on ? SLOW_RATE : 1;
  }, []);

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      audioRef.current?.pause();
      for (const url of cache.values()) if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      cache.clear();
    };
  }, []);

  return { play, stop, unlock, slow, setSlow, playingKey, loadingKey, cached };
}
