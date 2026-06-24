import { usePlayerStore } from "@/lib/stores/playerStore";
import type { PlayerTrack, RepeatMode } from "@/types/music";
import {
  getActiveQueue,
  getNextTrack,
  getPreviousTrack,
} from "@/lib/player/queueUtils";
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

/** Sincroniza estado de aleatorio/repetir con handlers nativos extendidos */
export function syncMediaSessionModes(
  isShuffle: boolean,
  repeatMode: RepeatMode,
): void {
  if (!("mediaSession" in navigator)) return;

  const ms = navigator.mediaSession as MediaSession & {
    setShuffleActive?: (active: boolean) => void;
    setRepeatMode?: (mode: "none" | "track" | "playlist") => void;
  };

  try {
    ms.setShuffleActive?.(isShuffle);
  } catch {
    /* no soportado */
  }

  try {
    const repeatMap: Record<RepeatMode, "none" | "track" | "playlist"> = {
      off: "none",
      one: "track",
      all: "playlist",
    };
    ms.setRepeatMode?.(repeatMap[repeatMode]);
  } catch {
    /* no soportado */
  }
}

/**
 * Habilita/deshabilita flechas Anterior/Siguiente en lock screen y notificaciones.
 * El SO muestra los botones solo cuando el handler no es null.
 */
export function syncMediaSessionQueueNavigation(
  currentTrack: PlayerTrack | null,
  queue: PlayerTrack[],
  shuffledQueue: PlayerTrack[],
  isShuffle: boolean,
  repeatMode: RepeatMode,
): void {
  if (!("mediaSession" in navigator)) return;

  if (!currentTrack || queue.length === 0) {
    safeSetHandler("previoustrack", null);
    safeSetHandler("nexttrack", null);
    return;
  }

  const activeQueue = getActiveQueue(queue, shuffledQueue, isShuffle);
  const hasPrevious =
    getPreviousTrack(currentTrack, activeQueue) !== null ||
    activeQueue.length > 1;
  const hasNext =
    getNextTrack(currentTrack, activeQueue, repeatMode) !== null;

  safeSetHandler("previoustrack", hasPrevious
    ? () => {
        usePlayerStore.getState().previous();
      }
    : null);

  safeSetHandler("nexttrack", hasNext
    ? () => {
        usePlayerStore.getState().next();
      }
    : null);
}

const SEEK_STEP_SECONDS = 10;

const EXTENDED_ACTIONS = [
  "toggleshuffle",
  "toggleRepeat",
  "repeat",
] as const;

function safeSetHandler(
  action: MediaSessionAction | (typeof EXTENDED_ACTIONS)[number],
  handler: MediaSessionActionHandler | null,
): void {
  try {
    navigator.mediaSession.setActionHandler(
      action as MediaSessionAction,
      handler,
    );
  } catch {
    // Acción no soportada en este navegador/OS
  }
}

/** Registra handlers globales — previoustrack/nexttrack se sincronizan aparte */
export function registerMediaSessionActionHandlers(): void {
  if (!("mediaSession" in navigator) || handlersRegistered) return;
  handlersRegistered = true;

  safeSetHandler("play", () => {
    usePlayerStore.getState().play();
  });

  safeSetHandler("pause", () => {
    usePlayerStore.getState().pause();
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

  safeSetHandler("toggleshuffle", () => {
    usePlayerStore.getState().toggleShuffle();
    const state = usePlayerStore.getState();
    syncMediaSessionModes(state.isShuffle, state.repeatMode);
    syncMediaSessionQueueNavigation(
      state.currentTrack,
      state.queue,
      state.shuffledQueue,
      state.isShuffle,
      state.repeatMode,
    );
  });

  for (const action of ["toggleRepeat", "repeat"] as const) {
    safeSetHandler(action, () => {
      usePlayerStore.getState().cycleRepeat();
      const state = usePlayerStore.getState();
      syncMediaSessionModes(state.isShuffle, state.repeatMode);
      syncMediaSessionQueueNavigation(
        state.currentTrack,
        state.queue,
        state.shuffledQueue,
        state.isShuffle,
        state.repeatMode,
      );
    });
  }

  const state = usePlayerStore.getState();
  syncMediaSessionQueueNavigation(
    state.currentTrack,
    state.queue,
    state.shuffledQueue,
    state.isShuffle,
    state.repeatMode,
  );
}

export function clearMediaSessionActionHandlers(): void {
  if (!("mediaSession" in navigator) || !handlersRegistered) return;
  handlersRegistered = false;

  const actions: (MediaSessionAction | (typeof EXTENDED_ACTIONS)[number])[] = [
    "play",
    "pause",
    "previoustrack",
    "nexttrack",
    "seekto",
    "seekbackward",
    "seekforward",
    "stop",
    ...EXTENDED_ACTIONS,
  ];

  for (const action of actions) {
    safeSetHandler(action, null);
  }
}
