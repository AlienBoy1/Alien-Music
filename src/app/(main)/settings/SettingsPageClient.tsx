"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Database,
  HardDrive,
  LogOut,
  Monitor,
  Music2,
  Palette,
  Play,
  Trash2,
  User,
} from "lucide-react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { usePlayerStore, type VideoQuality } from "@/lib/stores/playerStore";
import { clearLocalAppCache, type SpaceTheme } from "@/lib/settings/storage";
import { UsernameSettings } from "@/components/settings/UsernameSettings";

const THEMES: { id: SpaceTheme; label: string; description: string }[] = [
  {
    id: "deep-dark",
    label: "Oscuro Profundo",
    description: "Negro OLED puro, mínimo brillo",
  },
  {
    id: "alien-green",
    label: "Alien Green",
    description: "Negro con acentos verdes neón",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "Morados y magenta eléctricos",
  },
];

const QUALITIES: { id: VideoQuality; label: string }[] = [
  { id: "low", label: "Baja" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "Alta" },
  { id: "extreme", label: "Extrema / Source" },
];

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="alien-card rounded-xl p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold tracking-wide">
        <Icon size={20} className="text-accent" />
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsPageClient({
  initialUsername = null,
}: {
  initialUsername?: string | null;
}) {
  const { data: session } = useSession();
  const theme = useSettingsStore((s) => s.theme);
  const compactMode = useSettingsStore((s) => s.compactMode);
  const mobileDataSaver = useSettingsStore((s) => s.mobileDataSaver);
  const crossfadeSeconds = useSettingsStore((s) => s.crossfadeSeconds);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setCompactMode = useSettingsStore((s) => s.setCompactMode);
  const setMobileDataSaver = useSettingsStore((s) => s.setMobileDataSaver);
  const setCrossfadeSeconds = useSettingsStore((s) => s.setCrossfadeSeconds);

  const videoQuality = usePlayerStore((s) => s.videoQuality);
  const setVideoQuality = usePlayerStore((s) => s.setVideoQuality);
  const autoplayEnabled = usePlayerStore((s) => s.autoplayEnabled);
  const setAutoplayEnabled = usePlayerStore((s) => s.setAutoplayEnabled);

  const [cacheCleared, setCacheCleared] = useState<string | null>(null);

  useEffect(() => {
    if (!cacheCleared) return;
    const t = setTimeout(() => setCacheCleared(null), 4000);
    return () => clearTimeout(t);
  }, [cacheCleared]);

  const handleClearCache = () => {
    const removed = clearLocalAppCache();
    setCacheCleared(
      removed.length > 0
        ? `Se limpiaron ${removed.length} entradas locales.`
        : "No había caché local que limpiar.",
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Ajustes"
        subtitle="Personaliza tu experiencia en Alien Music"
        showFeedback={false}
      />

      <SettingsSection title="Identidad" icon={User}>
        <UsernameSettings initialUsername={initialUsername} />
      </SettingsSection>

      <SettingsSection title="Apariencia" icon={Palette}>
        <p className="mb-3 text-sm text-text-muted">Temas del espacio</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`rounded-lg border p-3 text-left transition-all ${
                theme === t.id
                  ? "border-accent bg-accent/10 shadow-[0_0_16px_rgba(0,255,159,0.12)]"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <p className="text-sm font-semibold">{t.label}</p>
              <p className="mt-1 text-xs text-text-muted">{t.description}</p>
            </button>
          ))}
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Modo compacto</p>
            <p className="text-xs text-text-muted">
              Filas y fuentes más pequeñas en listas
            </p>
          </div>
          <input
            type="checkbox"
            checked={compactMode}
            onChange={(e) => setCompactMode(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>
      </SettingsSection>

      <SettingsSection title="Calidad y streaming" icon={Monitor}>
        <label className="mb-4 block">
          <span className="mb-2 block text-sm text-text-muted">
            Calidad de audio por defecto
          </span>
          <select
            value={videoQuality}
            onChange={(e) => setVideoQuality(e.target.value as VideoQuality)}
            className="w-full rounded-lg border border-border bg-surface-highlight px-3 py-2 text-sm focus:border-accent/40 focus:outline-none"
          >
            {QUALITIES.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Ahorro de datos en móvil</p>
            <p className="text-xs text-text-muted">
              En conexión celular, reproduce videos solo como audio (0×0)
            </p>
          </div>
          <input
            type="checkbox"
            checked={mobileDataSaver}
            onChange={(e) => setMobileDataSaver(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>
      </SettingsSection>

      <SettingsSection title="Almacenamiento y caché" icon={HardDrive}>
        <p className="mb-3 text-sm text-text-muted">
          Limpia progresos de podcasts, volumen guardado y preferencias locales.
        </p>
        <button
          type="button"
          onClick={handleClearCache}
          className="flex items-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2 size={16} />
          Borrar caché local
        </button>
        {cacheCleared && (
          <p className="mt-2 text-xs text-accent">{cacheCleared}</p>
        )}
      </SettingsSection>

      <SettingsSection title="Reproducción" icon={Play}>
        <label className="mb-4 block">
          <span className="mb-2 flex items-center justify-between text-sm">
            <span>Crossfade (transición)</span>
            <span className="text-accent">{crossfadeSeconds}s</span>
          </span>
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={crossfadeSeconds}
            onChange={(e) => setCrossfadeSeconds(Number(e.target.value))}
            className="progress-range w-full"
            style={
              {
                "--progress": `${(crossfadeSeconds / 12) * 100}%`,
              } as React.CSSProperties
            }
          />
          <p className="mt-1 text-xs text-text-muted">
            Modo simulación — la mezcla entre pistas llegará en una actualización futura.
          </p>
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Smart Autoplay</p>
            <p className="text-xs text-text-muted">
              Sugiere pistas relacionadas al terminar la cola
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoplayEnabled}
            onChange={(e) => setAutoplayEnabled(e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>
      </SettingsSection>

      <SettingsSection title="Cuenta" icon={User}>
        {session?.user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg border border-border bg-surface-highlight/50 p-4">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "Usuario"}
                  width={56}
                  height={56}
                  className="rounded-full ring-2 ring-accent/30"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-alien-cyan text-xl font-bold text-black">
                  {(session.user.name?.[0] ?? "U").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {session.user.name ?? "Usuario"}
                </p>
                <p className="truncate text-sm text-text-muted">
                  {session.user.email ?? "Sin correo"}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  <Database size={10} />
                  Alien Premium Free
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/user/${session.user.id}`}
                className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-accent/40 hover:text-accent"
              >
                Ver perfil público
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent/40"
              >
                Cambiar contraseña
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-6 text-center">
            <Music2 size={32} className="mx-auto mb-3 text-accent" />
            <p className="mb-4 text-sm text-text-muted">
              Inicia sesión para sincronizar tu biblioteca y catálogo comunitario.
            </p>
            <Link
              href="/login"
              className="alien-btn-primary inline-flex rounded-full px-6 py-2 text-sm"
            >
              Iniciar sesión
            </Link>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
