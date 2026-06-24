"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { SILENCE_MP3_DATA_URI } from "@/lib/audio/silenceUri";
import {
  attachSilentAudioGuard,
  bindSilentAudioToMediaSession,
} from "@/lib/media/silentAudioSession";

/**
 * Audio silencioso en bucle — mantiene el hilo de audio nativo activo
 * y sincronizado con MediaSession mientras YouTube reproduce en react-player.
 */
export function useSilentAudioKeepalive() {
  const keepaliveRef = useRef<HTMLAudioElement | null>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackSource = usePlayerStore((s) => s.playbackSource);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
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

    bindSilentAudioToMediaSession(
      audio,
      currentTrack,
      true,
      currentTime,
      duration,
    );

    const startKeepalive = () => {
      bindSilentAudioToMediaSession(
        audio,
        currentTrack,
        true,
        currentTime,
        duration,
      );
      void audio.play().catch(() => {});
    };

    startKeepalive();

    const detachGuard = attachSilentAudioGuard(audio, () => {
      const state = usePlayerStore.getState();
      return (
        state.playbackSource === "youtube" &&
        Boolean(state.currentTrack?.youtubeId) &&
        state.isPlaying
      );
    });

    const onVisibility = () => {
      const state = usePlayerStore.getState();
      if (
        document.visibilityState === "hidden" &&
        state.isPlaying &&
        state.playbackSource === "youtube"
      ) {
        bindSilentAudioToMediaSession(
          audio,
          state.currentTrack,
          true,
          state.currentTime,
          state.duration,
        );
        void audio.play().catch(() => {});
      } else if (document.visibilityState === "visible" && state.isPlaying) {
        startKeepalive();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      detachGuard();
    };
  }, [
    youtubeActive,
    isPlaying,
    pageVisible,
    currentTrack,
    currentTime,
    duration,
  ]);

  return keepaliveRef;
}
