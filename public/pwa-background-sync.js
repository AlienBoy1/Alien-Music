/**
 * PWA helpers: Background Sync, descargas offline y activación manual de SW.
 */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === "DOWNLOAD_TRACK") {
    event.waitUntil(handleDownloadTrack(event.data.payload?.track));
    return;
  }

  if (event.data?.type === "REMOVE_DOWNLOAD") {
    event.waitUntil(handleRemoveDownload(event.data.trackId));
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "alien-music-playback-sync") return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "FLUSH_PLAYER_STATE" });
        }
      })
      .catch(() => {}),
  );
});

const COVER_CACHE = "alien-music-covers-v1";
const AUDIO_CACHE = "alien-music-audio-v1";

async function cacheUrl(cacheName, url, key) {
  if (!url) return false;
  try {
    const cache = await caches.open(cacheName);
    const response = await fetch(url);
    if (!response.ok) return false;
    await cache.put(key, response.clone());
    return true;
  } catch {
    return false;
  }
}

async function handleDownloadTrack(track) {
  if (!track?.id) return;

  const coverKey = `cover:${track.id}`;
  const audioKey = `audio:${track.id}`;

  await cacheUrl(COVER_CACHE, track.coverUrl, coverKey);

  if (track.audioUrl) {
    await cacheUrl(AUDIO_CACHE, track.audioUrl, audioKey);
  }

  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "OFFLINE_DOWNLOAD_SYNCED", trackId: track.id });
  }
}

async function handleRemoveDownload(trackId) {
  if (!trackId) return;

  try {
    const coverCache = await caches.open(COVER_CACHE);
    const audioCache = await caches.open(AUDIO_CACHE);
    await coverCache.delete(`cover:${trackId}`);
    await audioCache.delete(`audio:${trackId}`);
  } catch {
    /* ignore */
  }
}
