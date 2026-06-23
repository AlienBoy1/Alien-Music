import { create } from "zustand";
import type { PlayerTrack, RepeatMode } from "@/types/music";
import {
  buildShuffledQueue,
  getActiveQueue,
  getNextTrack,
  getPreviousTrack,
  insertAfterCurrent,
} from "@/lib/player/queueUtils";

const VOLUME_STORAGE_KEY = "alien-music-volume";

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

export interface PlayerState {
  currentTrack: PlayerTrack | null;
  /** Cola principal de reproducción */
  queue: PlayerTrack[];
  /** Copia antes de shuffle (para restaurar) */
  originalQueue: PlayerTrack[];
  shuffledQueue: PlayerTrack[];
  isPlaying: boolean;
  isLoading: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isQueueOpen: boolean;

  /** Reproduce una pista con cola opcional (clic simple) */
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  /** Carga colección completa desde un índice (doble clic) */
  playCollection: (tracks: PlayerTrack[], startIndex?: number) => void;
  /** Añade para sonar justo después de la actual */
  playNext: (track: PlayerTrack) => void;
  /** Añade al final de la cola */
  addToQueue: (track: PlayerTrack) => void;
  removeFromQueue: (trackId: string) => void;
  setQueue: (queue: PlayerTrack[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  toggleQueuePanel: () => void;
  setQueueOpen: (open: boolean) => void;
  hydrateVolume: () => void;
}

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

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  shuffledQueue: [],
  isPlaying: false,
  isLoading: false,
  isShuffle: false,
  repeatMode: "off",
  currentTime: 0,
  duration: 0,
  volume: 0.75,
  isMuted: false,
  isQueueOpen: false,

  playTrack: (track, queue) =>
    set((state) => {
      const isSame = state.currentTrack?.id === track.id;
      if (isSame) {
        return { isPlaying: !state.isPlaying };
      }
      const newQueue = queue ?? (state.queue.length > 0 ? state.queue : [track]);
      return {
        currentTrack: track,
        ...applyQueueUpdate(state, newQueue, track),
        currentTime: 0,
        duration: track.duration,
        isPlaying: true,
        isLoading: true,
      };
    }),

  playCollection: (tracks, startIndex = 0) => {
    if (tracks.length === 0) return;
    const index = Math.min(Math.max(0, startIndex), tracks.length - 1);
    const track = tracks[index];
    set((state) => ({
      currentTrack: track,
      ...applyQueueUpdate(state, tracks, track),
      currentTime: 0,
      duration: track.duration,
      isPlaying: true,
      isLoading: true,
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

  addToQueue: (track) =>
    set((state) => {
      if (state.queue.some((t) => t.id === track.id)) return state;
      const newQueue = [...state.queue, track];
      return applyQueueUpdate(state, newQueue);
    }),

  removeFromQueue: (trackId) =>
    set((state) => {
      const newQueue = state.queue.filter((t) => t.id !== trackId);
      return applyQueueUpdate(state, newQueue);
    }),

  setQueue: (queue) =>
    set((state) => applyQueueUpdate(state, queue)),

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
      set({
        currentTrack: nextTrack,
        currentTime: 0,
        duration: nextTrack.duration,
        isPlaying: true,
        isLoading: true,
      });
    } else {
      set({ isPlaying: false, currentTime: 0 });
    }
  },

  previous: () => {
    const state = get();
    if (!state.currentTrack) return;

    if (state.currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    const activeQueue = getActiveQueue(
      state.queue,
      state.shuffledQueue,
      state.isShuffle,
    );
    const prevTrack = getPreviousTrack(state.currentTrack, activeQueue);
    if (prevTrack) {
      set({
        currentTrack: prevTrack,
        currentTime: 0,
        duration: prevTrack.duration,
        isPlaying: true,
        isLoading: true,
      });
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
  seek: (time) => set({ currentTime: Math.max(0, time) }),
  seekRelative: (delta) =>
    set((state) => ({
      currentTime: Math.max(
        0,
        Math.min(state.duration || Infinity, state.currentTime + delta),
      ),
    })),
  toggleQueuePanel: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),
  setQueueOpen: (open) => set({ isQueueOpen: open }),
  hydrateVolume: () => set({ volume: loadVolume() }),
}));

/** Selector: ¿esta pista está sonando ahora? */
export function useIsTrackPlaying(trackId: string): boolean {
  return usePlayerStore(
    (s) => s.currentTrack?.id === trackId && s.isPlaying,
  );
}

export function useIsTrackCurrent(trackId: string): boolean {
  return usePlayerStore((s) => s.currentTrack?.id === trackId);
}
