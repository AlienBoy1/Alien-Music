import type { PlayerTrack } from "@/types/music";

export const OFFLINE_DB_NAME = "alien-music-offline";
export const OFFLINE_DB_VERSION = 1;
export const OFFLINE_STORE = "downloads";
export const OFFLINE_AUDIO_CACHE = "alien-music-audio-v1";
export const OFFLINE_COVER_CACHE = "alien-music-covers-v1";

export interface OfflineDownloadRecord {
  id: string;
  track: PlayerTrack;
  downloadedAt: string;
  /** true si el audio está en caché y reproducible sin red */
  hasCachedAudio: boolean;
  cachedAudioUrl?: string;
  coverCached: boolean;
}

export interface DownloadTrackPayload {
  track: PlayerTrack;
}

export type SwDownloadMessage =
  | { type: "DOWNLOAD_TRACK"; payload: DownloadTrackPayload }
  | { type: "REMOVE_DOWNLOAD"; trackId: string }
  | { type: "GET_DOWNLOADS" };

export type SwDownloadResponse =
  | { type: "DOWNLOADS_LIST"; downloads: OfflineDownloadRecord[] }
  | { type: "DOWNLOAD_COMPLETE"; record: OfflineDownloadRecord }
  | { type: "DOWNLOAD_ERROR"; trackId: string; error: string }
  | { type: "DOWNLOAD_REMOVED"; trackId: string };
