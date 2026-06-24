"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { usePageVisibility } from "@/hooks/usePageVisibility";
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
 * Protección anti-suspensión en segundo plano:
 * - Wake Lock mientras reproduce en primer plano
 * - Registro de Background Sync al ocultar la pestaña (flush de estado)
 * - Preload agresivo en redes lentas
 */
export function useBackgroundPlayback(
  audioRef: React.RefObject<HTMLAudioElement | null>,
) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playbackSource = usePlayerStore((s) => s.playbackSource);
  const pageVisible = usePageVisibility();
  const resumeAttemptRef = useRef(0);

  useWakeLock(isPlaying);

  const isSlowNetwork =
    getNetworkType() === "slow-2g" || getNetworkType() === "2g";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.preload = isSlowNetwork ? "auto" : "metadata";
  }, [audioRef, isSlowNetwork, currentTrack?.id]);

  /** Flush + Background Sync al pasar a segundo plano / bloquear pantalla */
  useEffect(() => {
    if (pageVisible) return;

    debouncedLocalStorage.flush();

    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator
    ) {
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
  }, [pageVisible]);

  /**
   * En iOS/Android el iframe de YouTube puede pausarse al bloquear.
   * Reintenta play() al volver si el usuario no pausó manualmente.
   */
  useEffect(() => {
    if (!pageVisible || !isPlaying) return;

    const id = window.setTimeout(() => {
      const store = usePlayerStore.getState();
      if (!store.isPlaying || store.playbackSource !== "youtube") return;
      resumeAttemptRef.current += 1;
      if (resumeAttemptRef.current > 3) return;
      store.play();
    }, 300);

    return () => window.clearTimeout(id);
  }, [pageVisible, isPlaying]);

  return {
    pageVisible,
    isSlowNetwork,
    forceBackgroundAudioOnly:
      !pageVisible && playbackSource === "youtube",
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
