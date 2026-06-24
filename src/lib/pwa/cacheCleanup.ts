import {
  OFFLINE_AUDIO_CACHE,
  OFFLINE_COVER_CACHE,
} from "@/lib/offline/types";

/** Cachés que nunca deben borrarse al actualizar la PWA */
export const PRESERVED_OFFLINE_CACHE_NAMES = new Set([
  OFFLINE_AUDIO_CACHE,
  OFFLINE_COVER_CACHE,
]);

/**
 * Elimina cachés de la app (Workbox, API, assets) pero conserva descargas offline.
 * No toca IndexedDB (`alien-music-offline`).
 */
export async function purgeAppCachesPreservingDownloads(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => !PRESERVED_OFFLINE_CACHE_NAMES.has(key))
      .map((key) => caches.delete(key)),
  );
}

/** Pide al SW activo que purgue cachés no offline (si está disponible). */
export async function requestServiceWorkerCachePurge(): Promise<void> {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({ type: "PURGE_APP_CACHES" });

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 800);
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "APP_CACHES_PURGED") {
        navigator.serviceWorker.removeEventListener("message", onMessage);
        window.clearTimeout(timeout);
        resolve();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
  });
}

/**
 * Limpieza completa al actualizar: SW + cachés de app, preservando descargas.
 */
export async function purgeForAppUpdate(): Promise<void> {
  await requestServiceWorkerCachePurge();
  await purgeAppCachesPreservingDownloads();
}
