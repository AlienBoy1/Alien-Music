import { usePlayerStore } from "@/lib/stores/playerStore";
import type { PlayerTrack } from "@/types/music";
import {
  buildCoverArtwork,
  buildYoutubeArtwork,
} from "@/lib/media/youtubeArtwork";

const APP_ALBUM = "Alien Music";

let handlersRegistered = false;

export function resolveMediaSessionAlbum(track: PlayerTrack): string {
  if (track.albumTitle && track.albumTitle !== track.title) {
    return track.albumTitle;
  }
  return track.isEphemeral || track.youtubeId ? track.artistName : APP_ALBUM;
}

export function buildMediaSessionMetadata(track: PlayerTrack): MediaMetadata {
  const artwork = track.youtubeId
    ? buildYoutubeArtwork(track.youtubeId)
    : buildCoverArtwork(track.coverUrl);

  return new MediaMetadata({
    title: track.title,
    artist: track.artistName,
    album: resolveMediaSessionAlbum(track),
    artwork,
  });
}

export function updateMediaSessionMetadata(track: PlayerTrack | null): void {
  if (!("mediaSession" in navigator)) return;

  if (!track) {
    navigator.mediaSession.metadata = null;
    return;
  }

  try {
    navigator.mediaSession.metadata = buildMediaSessionMetadata(track);
  } catch {
    // MediaMetadata no soportado en algunos contextos
  }
}

export function updateMediaSessionPosition(
  position: number,
  duration: number,
  playbackRate = 1,
): void {
  if (!("mediaSession" in navigator)) return;
  if (!navigator.mediaSession.setPositionState) return;
  if (!Number.isFinite(duration) || duration <= 0) return;
  if (!Number.isFinite(position) || position < 0) return;

  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate,
      position: Math.min(position, duration),
    });
  } catch {
    // ignore
  }
}

export function setMediaSessionPlaybackState(isPlaying: boolean): void {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

const SEEK_STEP_SECONDS = 10;

function safeSetHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
): void {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // Acción no soportada en este navegador/OS
  }
}

/** Registra handlers globales una sola vez — usan getState() para evitar closures obsoletos */
export function registerMediaSessionActionHandlers(): void {
  if (!("mediaSession" in navigator) || handlersRegistered) return;
  handlersRegistered = true;

  safeSetHandler("play", () => {
    usePlayerStore.getState().play();
  });

  safeSetHandler("pause", () => {
    usePlayerStore.getState().pause();
  });

  safeSetHandler("previoustrack", () => {
    usePlayerStore.getState().previous();
  });

  safeSetHandler("nexttrack", () => {
    usePlayerStore.getState().next();
  });

  safeSetHandler("seekto", (details) => {
    if (details.seekTime == null) return;
    usePlayerStore.getState().seek(details.seekTime);
  });

  safeSetHandler("seekbackward", (details) => {
    const step = details.seekOffset ?? SEEK_STEP_SECONDS;
    const { currentTime } = usePlayerStore.getState();
    usePlayerStore.getState().seek(Math.max(0, currentTime - step));
  });

  safeSetHandler("seekforward", (details) => {
    const step = details.seekOffset ?? SEEK_STEP_SECONDS;
    const { currentTime, duration } = usePlayerStore.getState();
    const max = duration > 0 ? duration : currentTime + step;
    usePlayerStore.getState().seek(Math.min(max, currentTime + step));
  });

  safeSetHandler("stop", () => {
    const store = usePlayerStore.getState();
    store.pause();
    store.seek(0);
  });
}

export function clearMediaSessionActionHandlers(): void {
  if (!("mediaSession" in navigator) || !handlersRegistered) return;
  handlersRegistered = false;

  const actions: MediaSessionAction[] = [
    "play",
    "pause",
    "previoustrack",
    "nexttrack",
    "seekto",
    "seekbackward",
    "seekforward",
    "stop",
  ];

  for (const action of actions) {
    safeSetHandler(action, null);
  }
}
