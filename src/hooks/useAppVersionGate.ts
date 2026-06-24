"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { APP_VERSION, isVersionOutdated } from "@/lib/app/version";

interface AppConfigResponse {
  minRequiredVersion: string;
  currentVersion: string;
}

/**
 * Compara la versión empaquetada con min_required_version de Supabase.
 * Se re-ejecuta al iniciar sesión y en cada recarga.
 */
export function useAppVersionGate() {
  const { status } = useSession();
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [minRequiredVersion, setMinRequiredVersion] = useState(APP_VERSION);

  const verify = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/app/config", { cache: "no-store" });
      if (!res.ok) {
        setBlocked(false);
        return;
      }

      const data = (await res.json()) as AppConfigResponse;
      const min = data.minRequiredVersion ?? APP_VERSION;
      setMinRequiredVersion(min);
      setBlocked(isVersionOutdated(APP_VERSION, min));
    } catch {
      setBlocked(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void verify();
  }, [verify, status]);

  useEffect(() => {
    const onFocus = () => void verify();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [verify]);

  return { checking, blocked, minRequiredVersion, recheck: verify };
}
