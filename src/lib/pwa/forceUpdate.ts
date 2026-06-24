/**
 * Limpia Service Worker + caches y recarga para forzar descarga del bundle nuevo.
 */
export async function forceAppUpdate(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Continuar con reload aunque falle la limpieza parcial
  }

  window.location.reload();
}
