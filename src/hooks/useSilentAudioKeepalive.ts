"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { SILENCE_MP3_DATA_URI } from "@/lib/audio/silenceUri";
import {
  setMediaSessionPlaybackState,
  updateMediaSessionMetadata,
} from "@/lib/media/mediaSession";

/**
 * Audio silencioso en bucle — engaña al SO móvil para mantener la PWA despierta
 * mientras YouTube reproduce en react-player.
 */
export function useSilentAudioKeepalive() {
  const keepaliveRef = useRef<HTMLAudioElement | null>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackSource = usePlayerStore((s) => s.playbackSource);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const pageVisible = usePageVisibility();

  const youtubeActive =
    playbackSource === "youtube" && Boolean(currentTrack?.youtubeId);

  useEffect(() => {
    const audio = keepaliveRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.001;
    audio.muted = false;
    audio.setAttribute("playsinline", "true");
    audio.preload = "auto";

    if (!youtubeActive || !isPlaying) {
      audio.pause();
      return;
    }

    if (!audio.src || !audio.src.startsWith("data:audio")) {
      audio.src = SILENCE_MP3_DATA_URI;
      audio.load();
    }

    const startKeepalive = () => {
      void audio.play().catch(() => {
        /* requiere gesto del usuario — se reintenta al volver visible */
      });
    };

    startKeepalive();

    if (!pageVisible) {
      updateMediaSessionMetadata(currentTrack);
      setMediaSessionPlaybackState(true);
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible" && isPlaying && youtubeActive) {
        startKeepalive();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [youtubeActive, isPlaying, pageVisible, currentTrack]);

  return keepaliveRef;
}
