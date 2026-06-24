"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { SILENCE_MP3_DATA_URI } from "@/lib/audio/silenceUri";
import {
  attachSilentAudioGuard,
  bindSilentAudioToMediaSession,
} from "@/lib/media/silentAudioSession";

/**
 * Audio silencioso en bucle — mantiene el hilo nativo activo en segundo plano.
 * No depende de currentTime para evitar re-ejecutar el effect cada tick.
 */
export function useSilentAudioKeepalive() {
  const keepaliveRef = useRef<HTMLAudioElement | null>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackSource = usePlayerStore((s) => s.playbackSource);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

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

    const syncAndPlay = () => {
      const state = usePlayerStore.getState();
      if (!state.currentTrack) return;
      bindSilentAudioToMediaSession(
        audio,
        state.currentTrack,
        true,
        state.currentTime,
        state.duration,
      );
      void audio.play().catch(() => {});
    };

    syncAndPlay();

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
      if (!state.isPlaying || state.playbackSource !== "youtube") return;

      if (document.visibilityState === "hidden") {
        syncAndPlay();
      } else if (document.visibilityState === "visible") {
        syncAndPlay();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      detachGuard();
    };
  }, [youtubeActive, isPlaying, currentTrack?.youtubeId]);

  return keepaliveRef;
}
