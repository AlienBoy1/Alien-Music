"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { debouncedLocalStorage } from "@/lib/storage/debouncedStorage";

function flushPlayerState() {
  debouncedLocalStorage.flush();
}

/**
 * Rehidrata el player desde localStorage y fuerza flush al cerrar/recargar.
 */
export function PlayerPersistProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (usePlayerStore.persist.hasHydrated()) {
      return;
    }
    void usePlayerStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        flushPlayerState();
      }
    };

    window.addEventListener("beforeunload", flushPlayerState);
    window.addEventListener("pagehide", flushPlayerState);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.removeEventListener("beforeunload", flushPlayerState);
      window.removeEventListener("pagehide", flushPlayerState);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  /** Background Sync del SW → flush inmediato del estado */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "FLUSH_PLAYER_STATE") {
        flushPlayerState();
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return <>{children}</>;
}
