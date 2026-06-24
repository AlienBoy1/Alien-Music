"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import {
  clearMediaSessionActionHandlers,
  registerMediaSessionActionHandlers,
  setMediaSessionPlaybackState,
  updateMediaSessionMetadata,
} from "@/lib/media/mediaSession";

/**
 * Integra la Media Session API con el reproductor.
 * Controles nativos: pantalla de bloqueo, auriculares, barra de notificaciones.
 */
export function useMediaSession() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

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
}
