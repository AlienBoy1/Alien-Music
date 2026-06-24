"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useLikesContext } from "@/components/providers/LikesProvider";
import {
  clearMediaSessionActionHandlers,
  registerMediaSessionActionHandlers,
  setMediaSessionPlaybackState,
  syncAllMediaSessionControls,
  syncMediaSessionLike,
  syncMediaSessionModes,
  syncMediaSessionQueueNavigation,
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

  const { likedSongIds, isAuthenticated } = useLikesContext();

  const isLiked =
    Boolean(currentTrack) && likedSongIds.has(currentTrack!.id);

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
    syncMediaSessionQueueNavigation(currentTrack);
  }, [currentTrack]);

  useEffect(() => {
    syncMediaSessionLike({
      track: currentTrack,
      isLiked,
      isAuthenticated,
    });
  }, [currentTrack, isLiked, isAuthenticated]);

  useEffect(() => {
    if (duration > 0) {
      updateMediaSessionPosition(currentTime, duration);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (!currentTrack) return;
    syncAllMediaSessionControls({
      track: currentTrack,
      isLiked,
      isAuthenticated,
    });
  }, [currentTrack, isLiked, isAuthenticated, isShuffle, repeatMode, isPlaying]);
}
