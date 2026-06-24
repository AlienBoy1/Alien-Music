import type { PlayerTrack } from "@/types/music";
import {
  setMediaSessionPlaybackState,
  updateMediaSessionMetadata,
  updateMediaSessionPosition,
} from "@/lib/media/mediaSession";

/**
 * Sincroniza el audio silencioso nativo con MediaSession para mantener
 * la PWA activa en segundo plano mientras YouTube reproduce en iframe.
 */
export function bindSilentAudioToMediaSession(
  audio: HTMLAudioElement,
  track: PlayerTrack | null,
  isPlaying: boolean,
  position: number,
  duration: number,
): void {
  if (!track) return;

  updateMediaSessionMetadata(track);
  setMediaSessionPlaybackState(isPlaying);

  if (duration > 0) {
    updateMediaSessionPosition(position, duration);
  }

  if (isPlaying && audio.paused) {
    void audio.play().catch(() => {});
  } else if (!isPlaying && !audio.paused) {
    audio.pause();
  }
}

export function attachSilentAudioGuard(
  audio: HTMLAudioElement,
  shouldPlay: () => boolean,
): () => void {
  const onPause = () => {
    if (shouldPlay()) {
      window.setTimeout(() => {
        if (shouldPlay()) {
          void audio.play().catch(() => {});
        }
      }, 120);
    }
  };

  const onPageHide = () => {
    if (shouldPlay()) {
      void audio.play().catch(() => {});
    }
  };

  audio.addEventListener("pause", onPause);
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("freeze", onPageHide as EventListener);

  return () => {
    audio.removeEventListener("pause", onPause);
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("freeze", onPageHide as EventListener);
  };
}
