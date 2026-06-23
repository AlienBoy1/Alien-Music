"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";

/**
 * Integra la Media Session API con el estado del reproductor.
 * Permite controles nativos del SO (lock screen, PWA, etc.)
 */
export function useMediaSession() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artistName,
      album: currentTrack.albumTitle,
      artwork: [
        { src: currentTrack.coverUrl, sizes: "512x512", type: "image/jpeg" },
        { src: currentTrack.coverUrl, sizes: "256x256", type: "image/jpeg" },
        { src: currentTrack.coverUrl, sizes: "128x128", type: "image/jpeg" },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      usePlayerStore.getState().play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      usePlayerStore.getState().pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => previous());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [currentTrack, previous, next]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const onSeek = (details: MediaSessionActionDetails) => {
      if (details.seekTime != null) {
        usePlayerStore.getState().seek(details.seekTime);
      }
    };

    try {
      navigator.mediaSession.setActionHandler("seekto", onSeek);
    } catch {
      // seekto no soportado en todos los navegadores
    }
  }, []);
}
