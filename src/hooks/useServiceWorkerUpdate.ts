"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const UPDATE_CHECK_MS = 30 * 60 * 1000;

/**
 * Detecta un Service Worker nuevo (updatefound) y muestra banner de actualización en caliente.
 */
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [applying, setApplying] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const applyingRef = useRef(false);

  const markUpdateReady = useCallback((reg: ServiceWorkerRegistration) => {
    if (reg.waiting && navigator.serviceWorker.controller) {
      setUpdateAvailable(true);
      registrationRef.current = reg;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const onControllerChange = () => {
      if (applyingRef.current) {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const attachUpdateListener = (reg: ServiceWorkerRegistration) => {
      registrationRef.current = reg;

      if (reg.waiting && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setUpdateAvailable(true);
          }
        });
      });
    };

    void navigator.serviceWorker.ready.then((reg) => {
      attachUpdateListener(reg);
      void reg.update().then(() => markUpdateReady(reg));
    });

    const interval = setInterval(() => {
      void navigator.serviceWorker.ready.then((reg) => {
        void reg.update().then(() => markUpdateReady(reg));
      });
    }, UPDATE_CHECK_MS);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void navigator.serviceWorker.ready.then((reg) => {
        void reg.update().then(() => markUpdateReady(reg));
      });
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, [markUpdateReady]);

  const applyUpdate = useCallback(async () => {
    setApplying(true);
    applyingRef.current = true;

    try {
      const { purgeForAppUpdate } = await import("@/lib/pwa/cacheCleanup");
      await purgeForAppUpdate();

      const reg =
        registrationRef.current ?? (await navigator.serviceWorker.ready);
      const waiting = reg.waiting;

      if (waiting) {
        waiting.postMessage({ type: "SKIP_WAITING" });
        await new Promise<void>((resolve) => {
          const timeout = window.setTimeout(resolve, 4000);
          waiting.addEventListener("statechange", () => {
            if (waiting.state === "activated") {
              window.clearTimeout(timeout);
              resolve();
            }
          });
        });
      }

      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, []);

  const dismiss = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applying, applyUpdate, dismiss };
}
