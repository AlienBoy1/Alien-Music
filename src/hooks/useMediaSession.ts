"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import {
  clearMediaSessionActionHandlers,
  registerMediaSessionActionHandlers,
  setMediaSessionPlaybackState,
  syncMediaSessionModes,
  updateMediaSessionMetadata,
  updateMediaSessionPosition,
} from "@/lib/media/mediaSession";

/**
 * Integra la Media Session API con el reproductor.
 * Controles nativos: pantalla de bloqueo, auriculares, barra de notificaciones.
 */
export function useMediaSession() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);

  useEffect(() => {
    registerMediaSessionActionHandlers();
    return () => clearMediaSessionActionHandlers();
  }, []);

  useEffect(() => {
    updateMediaSessionMetadata(currentTrack);
  }, [currentTrack]);

  useEffect(() => {
    setMediaSessionPlaybackState(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    syncMediaSessionModes(isShuffle, repeatMode);
  }, [isShuffle, repeatMode]);

  useEffect(() => {
    if (duration > 0) {
      updateMediaSessionPosition(currentTime, duration);
    }
  }, [currentTime, duration]);
}
