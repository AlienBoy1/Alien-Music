"use client";

import { useState, useRef, useEffect } from "react";
import { ListMusic, MoreHorizontal } from "lucide-react";
import { addSongToPlaylist } from "@/app/actions/playlists";
import type { Playlist } from "@/types/music";

interface AddToPlaylistMenuProps {
  songId: string;
  playlists: Playlist[];
  isAuthenticated: boolean;
}

export function AddToPlaylistMenu({
  songId,
  playlists,
  isAuthenticated,
}: AddToPlaylistMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const handleAdd = async (playlistId: string) => {
    setLoading(playlistId);
    await addSongToPlaylist(playlistId, songId);
    setLoading(null);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="rounded-full p-1.5 text-text-muted opacity-0 transition-all hover:bg-surface-highlight hover:text-white group-hover:opacity-100"
        aria-label="Más opciones"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-surface-elevated py-1 shadow-xl">
          <p className="px-3 py-2 text-xs font-semibold text-text-muted">
            Añadir a playlist
          </p>
          {playlists.length === 0 ? (
            <p className="px-3 py-2 text-xs text-text-muted">
              No tienes playlists
            </p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleAdd(pl.id);
                }}
                disabled={loading === pl.id}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-highlight disabled:opacity-50"
              >
                <ListMusic size={14} />
                {pl.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
