"use client";

import { create } from "zustand";
import {
  applyThemeToDocument,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
  type SpaceTheme,
} from "@/lib/settings/storage";

interface SettingsState extends AppSettings {
  hydrated: boolean;
  hydrate: () => void;
  setTheme: (theme: SpaceTheme) => void;
  setCompactMode: (compact: boolean) => void;
  setMobileDataSaver: (enabled: boolean) => void;
  setCrossfadeSeconds: (seconds: number) => void;
  patch: (partial: Partial<AppSettings>) => void;
}

function persist(state: AppSettings) {
  saveSettings(state);
  applyThemeToDocument(state.theme, state.compactMode);
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: () => {
    const loaded = loadSettings();
    applyThemeToDocument(loaded.theme, loaded.compactMode);
    set({ ...loaded, hydrated: true });
  },

  setTheme: (theme) => {
    const next = { ...get(), theme };
    persist(next);
    set({ theme });
  },

  setCompactMode: (compactMode) => {
    const next = { ...get(), compactMode };
    persist(next);
    set({ compactMode });
  },

  setMobileDataSaver: (mobileDataSaver) => {
    const next = { ...get(), mobileDataSaver };
    persist(next);
    set({ mobileDataSaver });
  },

  setCrossfadeSeconds: (crossfadeSeconds) => {
    const clamped = Math.min(12, Math.max(0, crossfadeSeconds));
    const next = { ...get(), crossfadeSeconds: clamped };
    persist(next);
    set({ crossfadeSeconds: clamped });
  },

  patch: (partial) => {
    const next = { ...get(), ...partial };
    persist(next);
    set(partial);
  },
}));
