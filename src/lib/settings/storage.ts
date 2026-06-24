export const SETTINGS_STORAGE_KEY = "alien-music-settings";

export type SpaceTheme = "deep-dark" | "alien-green" | "cyberpunk";

export interface AppSettings {
  theme: SpaceTheme;
  compactMode: boolean;
  mobileDataSaver: boolean;
  crossfadeSeconds: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "alien-green",
  compactMode: false,
  mobileDataSaver: false,
  crossfadeSeconds: 0,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
      compactMode: parsed.compactMode ?? DEFAULT_SETTINGS.compactMode,
      mobileDataSaver:
        parsed.mobileDataSaver ?? DEFAULT_SETTINGS.mobileDataSaver,
      crossfadeSeconds:
        typeof parsed.crossfadeSeconds === "number"
          ? Math.min(12, Math.max(0, parsed.crossfadeSeconds))
          : DEFAULT_SETTINGS.crossfadeSeconds,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/** Claves locales que se pueden limpiar desde Ajustes */
export const CLEARABLE_CACHE_PREFIXES = [
  "alien-music-volume",
  "alien-music-quality",
  "alien-music-autoplay",
  "alien-music-settings",
  "alien-podcast-progress:",
] as const;

export function clearLocalAppCache(): string[] {
  if (typeof window === "undefined") return [];
  const removed: string[] = [];
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key) continue;
    const shouldRemove = CLEARABLE_CACHE_PREFIXES.some((prefix) =>
      key.startsWith(prefix),
    );
    if (shouldRemove) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }
  return removed;
}

export function isMobileNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (
    navigator as Navigator & {
      connection?: { type?: string; effectiveType?: string };
    }
  ).connection;
  if (!conn) return false;
  const type = conn.type ?? "";
  const effective = conn.effectiveType ?? "";
  return (
    type === "cellular" ||
    effective === "2g" ||
    effective === "3g" ||
    effective === "slow-2g"
  );
}

export function applyThemeToDocument(theme: SpaceTheme, compactMode: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.compact = compactMode ? "true" : "false";
}
