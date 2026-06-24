/**
 * Limpia Service Worker + cachés de app y recarga para forzar el bundle nuevo.
 * Preserva IndexedDB de descargas y cachés offline (audio/portadas).
 */
import { purgeForAppUpdate } from "@/lib/pwa/cacheCleanup";

export async function forceAppUpdate(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await purgeForAppUpdate();

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch {
    // Continuar con reload aunque falle la limpieza parcial
  }

  window.location.reload();
}
