"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { usePlayerStore } from "@/lib/stores/playerStore";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateVolume = usePlayerStore((s) => s.hydrateVolume);
  const hydrateQuality = usePlayerStore((s) => s.hydrateQuality);
  const hydrateAutoplay = usePlayerStore((s) => s.hydrateAutoplay);

  useEffect(() => {
    hydrateSettings();
    hydrateVolume();
    hydrateQuality();
    hydrateAutoplay();
  }, [hydrateSettings, hydrateVolume, hydrateQuality, hydrateAutoplay]);

  return <>{children}</>;
}
