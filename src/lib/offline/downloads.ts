import type { PlayerTrack } from "@/types/music";
import {
  OFFLINE_AUDIO_CACHE,
  OFFLINE_COVER_CACHE,
  type OfflineDownloadRecord,
} from "@/lib/offline/types";
import {
  idbGetAllDownloads,
  idbPutDownload,
  idbRemoveDownload,
} from "@/lib/offline/idb";

async function cacheResource(
  cacheName: string,
  url: string,
  key: string,
): Promise<boolean> {
  try {
    const cache = await caches.open(cacheName);
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) return false;
    await cache.put(key, response.clone());
    return true;
  } catch {
    return false;
  }
}

async function getCachedUrl(
  cacheName: string,
  key: string,
): Promise<string | undefined> {
  try {
    const cache = await caches.open(cacheName);
    const match = await cache.match(key);
    if (!match) return undefined;
    const blob = await match.blob();
    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}

async function removeCachedKeys(cacheName: string, key: string): Promise<void> {
  try {
    const cache = await caches.open(cacheName);
    await cache.delete(key);
  } catch {
    /* ignore */
  }
}

export async function downloadTrack(track: PlayerTrack): Promise<OfflineDownloadRecord> {
  const coverKey = `cover:${track.id}`;
  const audioKey = `audio:${track.id}`;

  const coverCached = await cacheResource(
    OFFLINE_COVER_CACHE,
    track.coverUrl,
    coverKey,
  );

  let hasCachedAudio = false;
  let cachedAudioUrl: string | undefined;

  if (track.audioUrl) {
    hasCachedAudio = await cacheResource(
      OFFLINE_AUDIO_CACHE,
      track.audioUrl,
      audioKey,
    );
    if (hasCachedAudio) {
      cachedAudioUrl = await getCachedUrl(OFFLINE_AUDIO_CACHE, audioKey);
    }
  }

  const record: OfflineDownloadRecord = {
    id: track.id,
    track: {
      ...track,
      audioUrl: cachedAudioUrl ?? track.audioUrl,
    },
    downloadedAt: new Date().toISOString(),
    hasCachedAudio,
    cachedAudioUrl,
    coverCached,
  };

  await idbPutDownload(record);

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "DOWNLOAD_TRACK",
      payload: { track: record.track },
    });
  }

  return record;
}

export async function removeDownload(trackId: string): Promise<void> {
  await idbRemoveDownload(trackId);
  await removeCachedKeys(OFFLINE_COVER_CACHE, `cover:${trackId}`);
  await removeCachedKeys(OFFLINE_AUDIO_CACHE, `audio:${trackId}`);

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "REMOVE_DOWNLOAD",
      trackId,
    });
  }
}

export async function listDownloads(): Promise<OfflineDownloadRecord[]> {
  return idbGetAllDownloads();
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const all = await idbGetAllDownloads();
  return all.some((d) => d.id === trackId);
}

export function toOfflinePlayerTrack(record: OfflineDownloadRecord): PlayerTrack {
  if (record.hasCachedAudio && record.cachedAudioUrl) {
    return {
      ...record.track,
      audioUrl: record.cachedAudioUrl,
      youtubeId: "",
    };
  }
  return record.track;
}
