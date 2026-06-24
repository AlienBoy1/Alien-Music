"use client";

import { useState, useRef, useEffect } from "react";
import { ListMusic, ListPlus, MoreHorizontal, Share2 } from "lucide-react";
import { addSongToPlaylist } from "@/app/actions/playlists";
import { indexSong } from "@/app/actions/indexSong";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { ShareWithFriendModal } from "@/components/share/ShareWithFriendModal";
import type { PlayerTrack, Playlist } from "@/types/music";
import { isEphemeralTrackId } from "@/types/music";

interface EphemeralPlaylistMenuProps {
  track: PlayerTrack;
  playlists: Playlist[];
  isAuthenticated: boolean;
  currentUserId?: string;
}

export function EphemeralPlaylistMenu({
  track,
  playlists,
  isAuthenticated,
  currentUserId,
}: EphemeralPlaylistMenuProps) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const promoteEphemeralTrack = usePlayerStore((s) => s.promoteEphemeralTrack);
  const addToQueueNext = usePlayerStore((s) => s.addToQueueNext);

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

  const resolveSongId = async (): Promise<string | null> => {
    if (!track.isEphemeral && !isEphemeralTrackId(track.id)) {
      return track.id;
    }
    const result = await indexSong(track);
    if (result.error || !result.data?.songId) return null;
    promoteEphemeralTrack(track.youtubeId, result.data.songId);
    return result.data.songId;
  };

  const handleAdd = async (playlistId: string) => {
    setLoading(playlistId);
    const songId = await resolveSongId();
    if (songId) {
      await addSongToPlaylist(playlistId, songId);
    }
    setLoading(null);
    setOpen(false);
  };

  return (
    <>
      <div className="relative opacity-0 transition-opacity group-hover:opacity-100" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          className="rounded-full p-1.5 text-text-muted transition-all hover:bg-surface-highlight hover:text-white"
          aria-label="Más opciones"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-border bg-surface-elevated py-1 shadow-xl backdrop-blur-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToQueueNext(track);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-highlight"
            >
              <ListPlus size={14} />
              Agregar a la fila
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-highlight"
            >
              <Share2 size={14} />
              Compartir con un amigo
            </button>
            <div className="my-1 h-px bg-border" />
            <p className="px-3 py-2 text-xs font-semibold text-text-muted">
              Añadir a playlist
            </p>
            {playlists.length === 0 ? (
              <p className="px-3 py-2 text-xs text-text-muted">No tienes playlists</p>
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
                  <span className="truncate">
                    {pl.name}
                    {pl.isCollaborative &&
                      currentUserId &&
                      pl.userId !== currentUserId && (
                        <span className="ml-1 text-alien-cyan">(colab)</span>
                      )}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <ShareWithFriendModal
        track={track}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
