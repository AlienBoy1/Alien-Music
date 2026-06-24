"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useWakeLock } from "@/hooks/useWakeLock";
import { debouncedLocalStorage } from "@/lib/storage/debouncedStorage";

const PLAYER_PERSIST_KEY = "alien-music-player-v1";

type EffectiveNetworkType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

function getNetworkType(): EffectiveNetworkType {
  if (typeof navigator === "undefined") return "unknown";
  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  const type = conn?.effectiveType;
  if (type === "slow-2g" || type === "2g" || type === "3g" || type === "4g") {
    return type;
  }
  return "unknown";
}

/**
 * Protección anti-suspensión — NO pausa ni resetea al ocultar pestaña.
 * Solo persiste estado en localStorage al ir a segundo plano.
 */
export function useBackgroundPlayback(
  audioRef: React.RefObject<HTMLAudioElement | null>,
) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useWakeLock(isPlaying);

  const isSlowNetwork =
    getNetworkType() === "slow-2g" || getNetworkType() === "2g";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.preload = isSlowNetwork ? "auto" : "metadata";
  }, [audioRef, isSlowNetwork, currentTrack?.id]);

  /** Persistir progreso al ocultar — sin mutar isPlaying ni currentTime */
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      debouncedLocalStorage.flush();
    };

    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return {
    isSlowNetwork,
  };
}

/** Registra el tag de sync desde el cliente (idempotente) */
export function registerPlaybackBackgroundSync(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  void navigator.serviceWorker.ready
    .then((reg) => {
      const sync = (
        reg as ServiceWorkerRegistration & {
          sync?: { register: (tag: string) => Promise<void> };
        }
      ).sync;
      return sync?.register("alien-music-playback-sync");
    })
    .catch(() => {});
}

export { PLAYER_PERSIST_KEY };
