"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePageVisibility } from "@/hooks/usePageVisibility";

type WakeLockSentinel = Awaited<
  ReturnType<NonNullable<Navigator["wakeLock"]>["request"]>
>;

/**
 * Wake Lock API — evita que el SO suspenda el proceso mientras hay reproducción activa.
 * Se libera al pausar o al pasar a segundo plano (pantalla bloqueada).
 */
export function useWakeLock(isPlaying: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const pageVisible = usePageVisibility();

  const release = useCallback(async () => {
    try {
      await sentinelRef.current?.release();
    } catch {
      // ya liberado
    }
    sentinelRef.current = null;
  }, []);

  const request = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    if (sentinelRef.current) return;

    try {
      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      sentinel.addEventListener("release", () => {
        sentinelRef.current = null;
      });
    } catch {
      // Permiso denegado o pestaña en segundo plano
    }
  }, []);

  useEffect(() => {
    if (isPlaying && pageVisible) {
      void request();
    } else {
      void release();
    }
  }, [isPlaying, pageVisible, request, release]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && isPlaying) {
        void request();
      } else if (document.visibilityState === "hidden") {
        void release();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isPlaying, request, release]);

  useEffect(() => () => void release(), [release]);
}
