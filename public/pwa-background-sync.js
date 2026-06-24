/**
 * PWA helpers: Background Sync + activación manual de SW (banner de actualización).
 */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
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
