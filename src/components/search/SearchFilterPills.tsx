"use client";

import type { SearchContentFilter } from "@/lib/youtube/types";

const FILTERS: { id: SearchContentFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "songs", label: "Canciones" },
  { id: "videos", label: "Videos" },
  { id: "playlists", label: "Playlists Comunitarias" },
  { id: "podcasts", label: "Podcasts" },
];

interface SearchFilterPillsProps {
  value: SearchContentFilter;
  onChange: (filter: SearchContentFilter) => void;
}

export function SearchFilterPills({ value, onChange }: SearchFilterPillsProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
            value === id
              ? "alien-btn-primary shadow-[0_0_16px_rgba(0,255,159,0.2)]"
              : "border border-border bg-surface-highlight/60 text-text-muted hover:border-accent/30 hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
