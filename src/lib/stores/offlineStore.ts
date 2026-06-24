"use client";

import { create } from "zustand";
import type { OfflineDownloadRecord } from "@/lib/offline/types";
import {
  downloadTrack,
  listDownloads,
  removeDownload,
} from "@/lib/offline/downloads";
import type { PlayerTrack } from "@/types/music";

interface OfflineState {
  isOnline: boolean;
  downloads: OfflineDownloadRecord[];
  downloadingIds: Set<string>;
  hydrated: boolean;
  setOnline: (online: boolean) => void;
  hydrate: () => Promise<void>;
  download: (track: PlayerTrack) => Promise<void>;
  remove: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;
  isDownloading: (trackId: string) => boolean;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  downloads: [],
  downloadingIds: new Set(),
  hydrated: false,

  setOnline: (online) => set({ isOnline: online }),

  hydrate: async () => {
    const downloads = await listDownloads();
    set({ downloads, hydrated: true, isOnline: navigator.onLine });
  },

  download: async (track) => {
    const { downloadingIds } = get();
    if (downloadingIds.has(track.id)) return;

    const next = new Set(downloadingIds);
    next.add(track.id);
    set({ downloadingIds: next });

    try {
      const record = await downloadTrack(track);
      set((state) => ({
        downloads: [
          record,
          ...state.downloads.filter((d) => d.id !== record.id),
        ],
      }));
    } finally {
      const ids = new Set(get().downloadingIds);
      ids.delete(track.id);
      set({ downloadingIds: ids });
    }
  },

  remove: async (trackId) => {
    await removeDownload(trackId);
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== trackId),
    }));
  },

  isDownloaded: (trackId) => get().downloads.some((d) => d.id === trackId),

  isDownloading: (trackId) => get().downloadingIds.has(trackId),
}));
