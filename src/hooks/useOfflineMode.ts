"use client";

import { useEffect } from "react";
import { useOfflineStore } from "@/lib/stores/offlineStore";

/** Detecta conectividad y rehidrata descargas offline */
export function useOfflineMode() {
  const setOnline = useOfflineStore((s) => s.setOnline);
  const hydrate = useOfflineStore((s) => s.hydrate);
  const hydrated = useOfflineStore((s) => s.hydrated);
  const isOnline = useOfflineStore((s) => s.isOnline);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOnline]);

  return { isOnline, hydrated };
}
