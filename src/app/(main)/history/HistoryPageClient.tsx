"use client";

import { useState } from "react";
import Link from "next/link";
import { ContentHeader } from "@/components/content/ContentHeader";
import { SongRow } from "@/components/content/SongRow";
import type { HistoryEntry, HistoryFilter } from "@/lib/db/history";
import type { Playlist } from "@/types/music";

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "older", label: "Más antiguos" },
];

interface HistoryPageClientProps {
  initialEntries: HistoryEntry[];
  initialFilter: HistoryFilter;
  playlists: Playlist[];
  isAuthenticated: boolean;
}

export function HistoryPageClient({
  initialEntries,
  initialFilter,
  playlists,
  isAuthenticated,
}: HistoryPageClientProps) {
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [entries, setEntries] = useState(initialEntries);
  const [loading, setLoading] = useState(false);

  const loadFilter = async (f: HistoryFilter) => {
    setFilter(f);
    setLoading(true);
    const res = await fetch(`/api/history?filter=${f}`);
    setLoading(false);
    if (res.ok) {
      const data = (await res.json()) as { entries: HistoryEntry[] };
      setEntries(data.entries);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Historial de reproducción"
        subtitle="Todo lo que has escuchado en Alien Music"
        showFeedback={false}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => void loadFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f.id
                ? "bg-accent text-black"
                : "border border-border text-text-muted hover:border-accent/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text-muted">Cargando historial...</p>
      ) : entries.length === 0 ? (
        <p className="rounded-lg bg-surface-highlight p-8 text-center text-text-muted">
          No hay reproducciones en este período.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((entry, i) => (
            <div key={`${entry.song.id}-${entry.playedAt}`}>
              <p className="mb-1 px-3 text-[10px] uppercase tracking-wider text-text-muted">
                {new Date(entry.playedAt).toLocaleString("es")}
              </p>
              <SongRow
                song={entry.song}
                index={i}
                queue={entries.map((e) => e.song)}
                playlists={playlists}
                isAuthenticated={isAuthenticated}
              />
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-center">
        <Link href="/" className="text-sm text-accent hover:underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
