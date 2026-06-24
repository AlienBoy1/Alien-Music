import { toggleLikeSong } from "@/app/actions/likes";
import { indexSong } from "@/app/actions/indexSong";
import { usePlayerStore } from "@/lib/stores/playerStore";
import type { PlayerTrack, RepeatMode } from "@/types/music";
import { isEphemeralTrackId } from "@/types/music";
import {
  buildCoverArtwork,
  buildYoutubeArtwork,
} from "@/lib/media/youtubeArtwork";

const APP_ALBUM = "Alien Music";

/** Acciones extendidas soportadas en Chrome/Android (no estándar W3C). */
const EXTENDED_ACTIONS = [
  "toggleshuffle",
  "shuffle",
  "toggleRepeat",
  "togglerepeat",
  "repeat",
  "like",
  "unlike",
  "togglelike",
  "togglefavorite",
] as const;

type ExtendedAction = (typeof EXTENDED_ACTIONS)[number];

let handlersRegistered = false;

export interface MediaSessionLikeState {
  track: PlayerTrack | null;
  isLiked: boolean;
  isAuthenticated: boolean;
}

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
    /* MediaMetadata no soportado */
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
    /* ignore */
  }
}

export function setMediaSessionPlaybackState(isPlaying: boolean): void {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

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

async function toggleLikeFromMediaSession(track: PlayerTrack): Promise<void> {
  let songId = track.id;

  if (track.isEphemeral || isEphemeralTrackId(songId)) {
    const indexed = await indexSong(track);
    if (indexed.error || !indexed.data?.songId) return;
    songId = indexed.data.songId;
    usePlayerStore.getState().promoteEphemeralTrack(track.youtubeId, songId);
  }

  await toggleLikeSong(songId);
  window.dispatchEvent(new CustomEvent("alien:likes-changed"));
}

/** Me gusta en controles nativos (Chrome Android 110+). */
export function syncMediaSessionLike({
  track,
  isLiked,
  isAuthenticated,
}: MediaSessionLikeState): void {
  if (!("mediaSession" in navigator)) return;

  const clearLikeHandlers = () => {
    for (const action of ["like", "unlike", "togglelike", "togglefavorite"] as const) {
      safeSetHandler(action, null);
    }
  };

  if (!track || !isAuthenticated) {
    clearLikeHandlers();
    return;
  }

  const toggle = () => {
    void toggleLikeFromMediaSession(track);
  };

  clearLikeHandlers();

  if (isLiked) {
    safeSetHandler("unlike", toggle);
    safeSetHandler("togglelike", toggle);
    safeSetHandler("togglefavorite", toggle);
  } else {
    safeSetHandler("like", toggle);
    safeSetHandler("togglelike", toggle);
    safeSetHandler("togglefavorite", toggle);
  }
}

/**
 * Android/Chrome ocultan anterior/siguiente si el handler es null.
 * Siempre los registramos mientras haya pista activa.
 */
export function syncMediaSessionQueueNavigation(
  currentTrack: PlayerTrack | null,
): void {
  if (!("mediaSession" in navigator)) return;

  if (!currentTrack) {
    safeSetHandler("previoustrack", null);
    safeSetHandler("nexttrack", null);
    return;
  }

  safeSetHandler("previoustrack", () => {
    usePlayerStore.getState().previous();
  });

  safeSetHandler("nexttrack", () => {
    usePlayerStore.getState().next();
  });
}

const SEEK_STEP_SECONDS = 10;

function safeSetHandler(
  action: MediaSessionAction | ExtendedAction,
  handler: MediaSessionActionHandler | null,
): void {
  try {
    navigator.mediaSession.setActionHandler(
      action as MediaSessionAction,
      handler,
    );
  } catch {
    /* Acción no soportada en este navegador/OS */
  }
}

function refreshShuffleRepeatHandlers(): void {
  const state = usePlayerStore.getState();
  syncMediaSessionModes(state.isShuffle, state.repeatMode);
}

function registerShuffleRepeatHandlers(): void {
  const onShuffle = () => {
    usePlayerStore.getState().toggleShuffle();
    refreshShuffleRepeatHandlers();
  };

  const onRepeat = () => {
    usePlayerStore.getState().cycleRepeat();
    refreshShuffleRepeatHandlers();
  };

  for (const action of ["toggleshuffle", "shuffle"] as const) {
    safeSetHandler(action, onShuffle);
  }

  for (const action of ["toggleRepeat", "togglerepeat", "repeat"] as const) {
    safeSetHandler(action, onRepeat);
  }
}

/** Registra handlers globales de MediaSession (idempotente). */
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

  registerShuffleRepeatHandlers();

  const state = usePlayerStore.getState();
  syncMediaSessionQueueNavigation(state.currentTrack);
  refreshShuffleRepeatHandlers();
}

/** Sincroniza todos los controles nativos (lock screen / notificación). */
export function syncAllMediaSessionControls(
  likeState?: MediaSessionLikeState,
): void {
  if (!("mediaSession" in navigator)) return;

  registerMediaSessionActionHandlers();

  const state = usePlayerStore.getState();
  syncMediaSessionQueueNavigation(state.currentTrack);
  refreshShuffleRepeatHandlers();

  if (likeState) {
    syncMediaSessionLike(likeState);
  }
}

export function clearMediaSessionActionHandlers(): void {
  if (!("mediaSession" in navigator) || !handlersRegistered) return;
  handlersRegistered = false;

  const actions: (MediaSessionAction | ExtendedAction)[] = [
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
