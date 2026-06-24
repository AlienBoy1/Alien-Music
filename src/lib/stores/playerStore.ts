import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlayerTrack, RepeatMode } from "@/types/music";
import { youtubeItemToPlayerTrack } from "@/types/music";
import { tracksMatch } from "@/lib/player/queueUtils";
import { debouncedLocalStorage } from "@/lib/storage/debouncedStorage";
import {
  buildShuffledQueue,
  getActiveQueue,
  getNextTrack,
  getPreviousTrack,
  insertAfterCurrent,
  reorderQueueArray,
} from "@/lib/player/queueUtils";

const VOLUME_STORAGE_KEY = "alien-music-volume";
const QUALITY_STORAGE_KEY = "alien-music-quality";
const AUTOPLAY_STORAGE_KEY = "alien-music-autoplay";
const PLAYER_PERSIST_KEY = "alien-music-player-v1";

export type VideoQuality = "low" | "normal" | "high" | "extreme";

function loadQuality(): VideoQuality {
  if (typeof window === "undefined") return "normal";
  const v = localStorage.getItem(QUALITY_STORAGE_KEY);
  if (v === "low" || v === "high" || v === "normal" || v === "extreme") return v;
  return "normal";
}

function loadAutoplay(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
  if (v === "false") return false;
  if (v === "true") return true;
  return true;
}

function saveAutoplay(enabled: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTOPLAY_STORAGE_KEY, String(enabled));
  }
}

function saveQuality(q: VideoQuality) {
  if (typeof window !== "undefined") {
    localStorage.setItem(QUALITY_STORAGE_KEY, q);
  }
}

function loadVolume(): number {
  if (typeof window === "undefined") return 0.75;
  const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
  if (stored) {
    const parsed = parseFloat(stored);
    if (!Number.isNaN(parsed)) return Math.min(1, Math.max(0, parsed));
  }
  return 0.75;
}

function saveVolume(volume: number) {
  if (typeof window !== "undefined") {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  }
}

/** Fuente de reproducción activa */
export type PlaybackSource = "youtube" | "native";
export type VideoPanelMode = "hidden" | "pip" | "maximized";

function resolvePlaybackSource(track: PlayerTrack): PlaybackSource {
  if (track.youtubeId) return "youtube";
  if (track.audioUrl) return "native";
  return "youtube";
}

export interface PlayerState {
  currentTrack: PlayerTrack | null;
  playbackSource: PlaybackSource;
  /** Cola principal de reproducción */
  queue: PlayerTrack[];
  originalQueue: PlayerTrack[];
  shuffledQueue: PlayerTrack[];
  isPlaying: boolean;
  isLoading: boolean;
  /** IFrame / react-player listo para recibir comandos */
  isPlayerReady: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  isExpandedMode: boolean;
  /** Incrementa en cada seek para que el motor de YouTube aplique el salto */
  seekRevision: number;
  /** Modo del panel de video flotante */
  videoPanelMode: VideoPanelMode;
  /** Smart Autoplay cuando la cola termina */
  autoplayEnabled: boolean;
  isAutoplayFetching: boolean;
  videoQuality: VideoQuality;

  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  playCollection: (tracks: PlayerTrack[], startIndex?: number) => void;
  playNext: (track: PlayerTrack) => void;
  addToQueueNext: (track: PlayerTrack) => void;
  addToQueue: (track: PlayerTrack) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setQueue: (queue: PlayerTrack[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setLoading: (loading: boolean) => void;
  setPlayerReady: (ready: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  toggleQueuePanel: () => void;
  setQueueOpen: (open: boolean) => void;
  toggleLyricsPanel: () => void;
  setLyricsOpen: (open: boolean) => void;
  setExpandedMode: (expanded: boolean) => void;
  toggleExpandedMode: () => void;
  hydrateVolume: () => void;
  setVideoPanelMode: (mode: VideoPanelMode) => void;
  hideVideo: () => void;
  toggleVideoMaximize: () => void;
  promoteEphemeralTrack: (youtubeId: string, dbSongId: string) => void;
  setAutoplayEnabled: (enabled: boolean) => void;
  setVideoQuality: (quality: VideoQuality) => void;
  hydrateQuality: () => void;
  hydrateAutoplay: () => void;
  tryAutoplayRelated: () => Promise<void>;
}

type PersistedPlayerSlice = Pick<
  PlayerState,
  | "currentTrack"
  | "queue"
  | "originalQueue"
  | "shuffledQueue"
  | "currentTime"
  | "duration"
  | "repeatMode"
  | "isShuffle"
  | "playbackSource"
>;

function applyQueueUpdate(
  state: PlayerState,
  newQueue: PlayerTrack[],
  currentTrack?: PlayerTrack | null,
): Partial<PlayerState> {
  const track = currentTrack ?? state.currentTrack;
  return {
    queue: newQueue,
    originalQueue: newQueue,
    shuffledQueue: state.isShuffle
      ? buildShuffledQueue(newQueue, track)
      : newQueue,
  };
}

function isSameMediaSource(a: PlayerTrack, b: PlayerTrack): boolean {
  if (a.youtubeId && b.youtubeId) return a.youtubeId === b.youtubeId;
  return a.id === b.id;
}

function trackChangePatch(
  track: PlayerTrack,
  prev?: Pick<
    PlayerState,
    "currentTrack" | "currentTime" | "isPlayerReady" | "seekRevision" | "duration"
  >,
): Partial<PlayerState> {
  const sameSource =
    prev?.currentTrack && isSameMediaSource(prev.currentTrack, track);

  return {
    currentTrack: track,
    playbackSource: resolvePlaybackSource(track),
    currentTime: sameSource ? prev.currentTime : 0,
    duration: track.duration || (sameSource ? prev.duration : 0),
    isPlaying: true,
    isLoading: sameSource ? false : true,
    isPlayerReady: sameSource ? prev.isPlayerReady : false,
    seekRevision: sameSource ? prev.seekRevision + 1 : 0,
    videoPanelMode: track.type === "video" ? "pip" : "hidden",
  };
}

function patchTrackInState(
  state: PlayerState,
  updater: (track: PlayerTrack) => PlayerTrack,
): Partial<PlayerState> {
  const patch = (t: PlayerTrack) =>
    state.currentTrack && tracksMatch(t, state.currentTrack) ? updater(t) : t;
  return {
    currentTrack: state.currentTrack ? updater(state.currentTrack) : null,
    queue: state.queue.map(patch),
    originalQueue: state.originalQueue.map(patch),
    shuffledQueue: state.shuffledQueue.map(patch),
  };
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
  currentTrack: null,
  playbackSource: "youtube",
  queue: [],
  originalQueue: [],
  shuffledQueue: [],
  isPlaying: false,
  isLoading: false,
  isPlayerReady: false,
  isShuffle: false,
  repeatMode: "off",
  currentTime: 0,
  duration: 0,
  volume: 0.75,
  isMuted: false,
  isQueueOpen: false,
  isLyricsOpen: false,
  isExpandedMode: false,
  seekRevision: 0,
  videoPanelMode: "hidden",
  autoplayEnabled: true,
  isAutoplayFetching: false,
  videoQuality: "normal",

  playTrack: (track, queue) =>
    set((state) => {
      const isSame =
        state.currentTrack &&
        tracksMatch(state.currentTrack, track);
      if (isSame) {
        return { isPlaying: !state.isPlaying };
      }
      const newQueue = queue ?? (state.queue.length > 0 ? state.queue : [track]);
      return {
        ...trackChangePatch(track, state),
        ...applyQueueUpdate(state, newQueue, track),
      };
    }),

  playCollection: (tracks, startIndex = 0) => {
    if (tracks.length === 0) return;
    const index = Math.min(Math.max(0, startIndex), tracks.length - 1);
    const track = tracks[index];
    set((state) => ({
      ...trackChangePatch(track, state),
      ...applyQueueUpdate(state, tracks, track),
    }));
  },

  playNext: (track) =>
    set((state) => {
      const newQueue = insertAfterCurrent(
        state.queue,
        state.currentTrack,
        track,
      );
      return applyQueueUpdate(state, newQueue);
    }),

  addToQueueNext: (track) =>
    set((state) => {
      const withoutDup = state.queue.filter((t) => !tracksMatch(t, track));
      const newQueue = insertAfterCurrent(
        withoutDup,
        state.currentTrack,
        track,
      );
      return applyQueueUpdate(state, newQueue);
    }),

  addToQueue: (track) =>
    set((state) => {
      if (state.queue.some((t) => tracksMatch(t, track))) return state;
      const newQueue = [...state.queue, track];
      return applyQueueUpdate(state, newQueue);
    }),

  removeFromQueue: (trackId) =>
    set((state) => {
      const newQueue = state.queue.filter((t) => t.id !== trackId);
      return applyQueueUpdate(state, newQueue);
    }),

  reorderQueue: (fromIndex, toIndex) =>
    set((state) => {
      if (state.isShuffle) return state;
      const newQueue = reorderQueueArray(state.queue, fromIndex, toIndex);
      return applyQueueUpdate(state, newQueue);
    }),

  setQueue: (queue) => set((state) => applyQueueUpdate(state, queue)),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  next: () => {
    const state = get();
    if (!state.currentTrack) return;
    const activeQueue = getActiveQueue(
      state.queue,
      state.shuffledQueue,
      state.isShuffle,
    );
    const nextTrack = getNextTrack(
      state.currentTrack,
      activeQueue,
      state.repeatMode,
    );
    if (nextTrack) {
      set(trackChangePatch(nextTrack, state));
    } else {
      void get().tryAutoplayRelated();
      set({ isPlaying: false, currentTime: 0 });
    }
  },

  previous: () => {
    const state = get();
    if (!state.currentTrack) return;

    if (state.currentTime > 3) {
      set((s) => ({
        currentTime: 0,
        seekRevision: s.seekRevision + 1,
      }));
      return;
    }

    const activeQueue = getActiveQueue(
      state.queue,
      state.shuffledQueue,
      state.isShuffle,
    );
    const prevTrack = getPreviousTrack(state.currentTrack, activeQueue);
    if (prevTrack) {
      set(trackChangePatch(prevTrack, state));
    }
  },

  toggleShuffle: () =>
    set((state) => {
      const newShuffle = !state.isShuffle;
      if (!newShuffle) {
        return {
          isShuffle: false,
          queue: state.originalQueue.length ? state.originalQueue : state.queue,
          shuffledQueue: state.originalQueue.length
            ? state.originalQueue
            : state.queue,
        };
      }
      const base = state.originalQueue.length ? state.originalQueue : state.queue;
      return {
        isShuffle: true,
        originalQueue: base,
        shuffledQueue: buildShuffledQueue(base, state.currentTrack),
      };
    }),

  cycleRepeat: () =>
    set((state) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const idx = modes.indexOf(state.repeatMode);
      return { repeatMode: modes[(idx + 1) % modes.length] };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setPlayerReady: (ready) => set({ isPlayerReady: ready }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => {
    saveVolume(volume);
    set({ volume, isMuted: volume === 0 });
  },
  toggleMute: () =>
    set((state) => {
      const newMuted = !state.isMuted;
      if (!newMuted && state.volume === 0) {
        const vol = loadVolume() || 0.75;
        saveVolume(vol);
        return { isMuted: false, volume: vol };
      }
      return { isMuted: newMuted };
    }),
  seek: (time) =>
    set((state) => ({
      currentTime: Math.max(0, time),
      seekRevision: state.seekRevision + 1,
    })),
  seekRelative: (delta) =>
    set((state) => ({
      currentTime: Math.max(
        0,
        Math.min(state.duration || Infinity, state.currentTime + delta),
      ),
      seekRevision: state.seekRevision + 1,
    })),
  toggleQueuePanel: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),
  setQueueOpen: (open) => set({ isQueueOpen: open }),
  toggleLyricsPanel: () =>
    set((s) => ({
      isLyricsOpen: !s.isLyricsOpen,
      isQueueOpen: s.isLyricsOpen ? s.isQueueOpen : false,
    })),
  setLyricsOpen: (open) => set({ isLyricsOpen: open }),
  setExpandedMode: (expanded) =>
    set((s) => ({
      isExpandedMode: expanded,
      isQueueOpen: expanded ? false : s.isQueueOpen,
      isLyricsOpen: expanded ? false : s.isLyricsOpen,
      videoPanelMode: expanded
        ? s.currentTrack?.type === "video"
          ? "maximized"
          : "hidden"
        : s.currentTrack?.type === "video"
          ? "pip"
          : "hidden",
    })),
  toggleExpandedMode: () => {
    const state = get();
    get().setExpandedMode(!state.isExpandedMode);
  },
  hydrateVolume: () => set({ volume: loadVolume() }),

  setVideoPanelMode: (mode) => set({ videoPanelMode: mode }),

  hideVideo: () =>
    set((state) => ({
      ...patchTrackInState(state, (t) => ({ ...t, type: "audio" })),
      videoPanelMode: "hidden",
    })),

  toggleVideoMaximize: () =>
    set((state) => ({
      videoPanelMode:
        state.videoPanelMode === "maximized" ? "pip" : "maximized",
    })),

  promoteEphemeralTrack: (youtubeId, dbSongId) =>
    set((state) => {
      const ephemeralId = `yt:${youtubeId}`;
      const promote = (t: PlayerTrack) =>
        t.youtubeId === youtubeId || t.id === ephemeralId
          ? { ...t, id: dbSongId, isEphemeral: false }
          : t;
      return {
        currentTrack: state.currentTrack ? promote(state.currentTrack) : null,
        queue: state.queue.map(promote),
        originalQueue: state.originalQueue.map(promote),
        shuffledQueue: state.shuffledQueue.map(promote),
      };
    }),

  setAutoplayEnabled: (enabled) => {
    saveAutoplay(enabled);
    set({ autoplayEnabled: enabled });
  },

  setVideoQuality: (quality) => {
    saveQuality(quality);
    set({ videoQuality: quality, isPlayerReady: false });
  },

  hydrateQuality: () => set({ videoQuality: loadQuality() }),

  hydrateAutoplay: () => set({ autoplayEnabled: loadAutoplay() }),

  tryAutoplayRelated: async () => {
    const state = get();
    if (!state.autoplayEnabled || !state.currentTrack?.youtubeId) return;
    if (state.isAutoplayFetching || state.repeatMode !== "off") return;

    set({ isAutoplayFetching: true });
    try {
      const res = await fetch(
        `/api/youtube/related?videoId=${encodeURIComponent(state.currentTrack.youtubeId)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: import("@/lib/youtube/types").YouTubeSearchItem[];
      };
      const first = data.items?.[0];
      if (!first) return;

      const track = youtubeItemToPlayerTrack(
        first,
        first.kind === "video" ? "video" : "audio",
      );
      const newQueue = [...state.queue, track];
      set({
        ...trackChangePatch(track, state),
        ...applyQueueUpdate(state, newQueue, track),
      });
    } finally {
      set({ isAutoplayFetching: false });
    }
  },
}),
    {
      name: PLAYER_PERSIST_KEY,
      storage: createJSONStorage(() => debouncedLocalStorage),
      partialize: (state): PersistedPlayerSlice => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        originalQueue: state.originalQueue,
        shuffledQueue: state.shuffledQueue,
        currentTime: state.currentTime,
        duration: state.duration,
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
        playbackSource: state.playbackSource,
      }),
      merge: (persistedState, currentState) => {
        const saved = persistedState as PersistedPlayerSlice | undefined;
        if (!saved?.currentTrack) {
          return currentState;
        }
        return {
          ...currentState,
          ...saved,
          playbackSource: resolvePlaybackSource(saved.currentTrack),
          isPlaying: false,
          isLoading: true,
          isPlayerReady: false,
          seekRevision: 1,
          isQueueOpen: false,
          isLyricsOpen: false,
          isExpandedMode: false,
          isAutoplayFetching: false,
          videoPanelMode: "hidden",
        };
      },
    },
  ),
);

export function useIsTrackPlaying(trackId: string): boolean {
  return usePlayerStore(
    (s) => s.currentTrack?.id === trackId && s.isPlaying,
  );
}

export function useIsTrackCurrent(trackId: string): boolean {
  return usePlayerStore((s) => s.currentTrack?.id === trackId);
}

/** Compara por youtubeId o id de DB */
export function useIsYoutubeTrackCurrent(youtubeId: string): boolean {
  return usePlayerStore(
    (s) =>
      s.currentTrack?.youtubeId === youtubeId ||
      s.currentTrack?.id === `yt:${youtubeId}`,
  );
}
