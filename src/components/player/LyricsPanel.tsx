"use client";

import { useEffect, useState } from "react";
import { Loader2, Mic2, X } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { isEphemeralTrackId } from "@/types/music";

export function LyricsPanel() {
  const isOpen = usePlayerStore((s) => s.isLyricsOpen);
  const setLyricsOpen = usePlayerStore((s) => s.setLyricsOpen);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setLyrics(null);

    const params = new URLSearchParams();
    if (!currentTrack.isEphemeral && !isEphemeralTrackId(currentTrack.id)) {
      params.set("songId", currentTrack.id);
    } else {
      params.set("artist", currentTrack.artistName);
      params.set("title", currentTrack.title);
    }

    void fetch(`/api/lyrics?${params.toString()}`)
      .then(async (res) => {
        const data = (await res.json()) as { lyrics?: string; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Letras no disponibles");
          return;
        }
        setLyrics(data.lyrics ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Error de red al cargar letras");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentTrack]);

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-[60] flex md:inset-auto md:bottom-[var(--player-height)] md:left-auto md:right-0 md:top-[var(--topbar-height)] md:w-[min(100%,28rem)]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm md:hidden"
        onClick={() => setLyricsOpen(false)}
        aria-label="Cerrar letras"
      />
      <aside className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-border bg-surface-elevated/98 shadow-2xl backdrop-blur-xl animate-fade-in-up md:max-w-none">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Mic2 size={18} className="text-accent" />
            <div>
              <h2 className="font-display text-sm font-bold text-alien-gradient">
                Letras
              </h2>
              <p className="truncate text-xs text-text-muted">
                {currentTrack.title} · {currentTrack.artistName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLyricsOpen(false)}
            className="text-text-muted transition-colors hover:text-accent"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-text-muted">
              <Loader2 size={20} className="animate-spin text-accent" />
              Buscando letras...
            </div>
          )}

          {!loading && error && (
            <p className="py-8 text-center text-sm text-text-muted">{error}</p>
          )}

          {!loading && lyrics && (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/90">
              {lyrics}
            </pre>
          )}
        </div>
      </aside>
    </div>
  );
}
