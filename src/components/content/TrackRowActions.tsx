"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Heart,
  ListMusic,
  ListPlus,
  Loader2,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useOfflineStore } from "@/lib/stores/offlineStore";
import { useLikesContext } from "@/components/providers/LikesProvider";
import { toggleLikeSong } from "@/app/actions/likes";
import { indexSong } from "@/app/actions/indexSong";
import { addSongToPlaylist } from "@/app/actions/playlists";
import { ShareWithFriendModal } from "@/components/share/ShareWithFriendModal";
import { EphemeralLikeButton } from "@/components/search/EphemeralLikeButton";
import { LikeButton } from "@/components/content/LikeButton";
import type { PlayerTrack, Playlist } from "@/types/music";
import { isEphemeralTrackId } from "@/types/music";

interface TrackRowActionsProps {
  track: PlayerTrack;
  playlists?: Playlist[];
  isAuthenticated?: boolean;
  /** Si la fila proviene de Song indexada, pasar songId explícito */
  songId?: string;
}

export function TrackRowActions({
  track,
  playlists = [],
  isAuthenticated = false,
  songId,
}: TrackRowActionsProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [playlistExpanded, setPlaylistExpanded] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const addToQueueNext = usePlayerStore((s) => s.addToQueueNext);
  const promoteEphemeralTrack = usePlayerStore((s) => s.promoteEphemeralTrack);

  const isOnline = useOfflineStore((s) => s.isOnline);
  const isDownloaded = useOfflineStore((s) => s.isDownloaded(track.id));
  const isDownloading = useOfflineStore((s) => s.isDownloading(track.id));
  const download = useOfflineStore((s) => s.download);
  const removeDownload = useOfflineStore((s) => s.remove);

  const isEphemeral =
    track.isEphemeral || isEphemeralTrackId(track.id);
  const resolvedSongId = songId ?? (isEphemeral ? undefined : track.id);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPlaylistExpanded(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const resolveSongId = useCallback(async (): Promise<string | null> => {
    if (resolvedSongId) return resolvedSongId;
    if (!isEphemeral) return track.id;
    const indexed = await indexSong(track);
    if (indexed.error || !indexed.data?.songId) return null;
    promoteEphemeralTrack(track.youtubeId, indexed.data.songId);
    return indexed.data.songId;
  }, [resolvedSongId, isEphemeral, track, promoteEphemeralTrack]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloaded) {
      await removeDownload(track.id);
    } else {
      await download(track);
    }
  };

  const handleLikeFromMenu = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const id = await resolveSongId();
    if (!id) return;
    await toggleLikeSong(id);
    router.refresh();
    setMenuOpen(false);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setLoadingPlaylist(playlistId);
    const id = await resolveSongId();
    if (id) await addSongToPlaylist(playlistId, id);
    setLoadingPlaylist(null);
    setMenuOpen(false);
    setPlaylistExpanded(false);
  };

  return (
    <>
      <div
        className="flex shrink-0 items-center gap-0.5 md:gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {isEphemeral ? (
          <EphemeralLikeButton track={track} size={18} className="opacity-100 md:opacity-0 md:group-hover:opacity-100" />
        ) : (
          <LikeButton songId={track.id} size={18} className="opacity-100 md:opacity-0 md:group-hover:opacity-100" />
        )}

        {(isOnline || isDownloaded) && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={`rounded-full p-1.5 transition-all hover:bg-surface-highlight disabled:opacity-60 ${
              isDownloaded
                ? "text-accent opacity-100"
                : "text-text-muted opacity-100 md:opacity-0 md:group-hover:opacity-100"
            }`}
            aria-label={isDownloaded ? "Eliminar descarga" : "Descargar"}
          >
            {isDownloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isDownloaded ? (
              <Trash2 size={16} />
            ) : (
              <Download size={16} />
            )}
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-1.5 text-text-muted opacity-100 transition-all hover:bg-surface-highlight hover:text-white md:opacity-0 md:group-hover:opacity-100"
            aria-label="Más opciones"
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div
                  className="fixed inset-0 z-[60] bg-black/40 md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setMenuOpen(false);
                    setPlaylistExpanded(false);
                  }}
                />
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-[61] rounded-t-2xl border-t border-border bg-surface-elevated p-2 pb-6 shadow-2xl md:absolute md:inset-auto md:bottom-auto md:right-0 md:top-full md:mt-1 md:min-w-[240px] md:rounded-lg md:border md:p-0 md:pb-0 md:shadow-xl"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                >
                  {isAuthenticated ? (
                    <>
                      <MenuItem
                        icon={<Heart size={16} />}
                        label="Marcar como me gusta"
                        onClick={() => void handleLikeFromMenu()}
                      />
                      <MenuItem
                        icon={
                          isDownloading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )
                        }
                        label={
                          isDownloaded
                            ? "Eliminar descarga"
                            : "Descargar canción"
                        }
                        onClick={() => void handleDownload({ stopPropagation: () => {} } as React.MouseEvent)}
                        disabled={isDownloading || (!isOnline && !isDownloaded)}
                      />
                      <MenuItem
                        icon={<ListPlus size={16} />}
                        label="Añadir a la fila de reproducción"
                        onClick={() => {
                          addToQueueNext(track);
                          setMenuOpen(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setPlaylistExpanded((v) => !v)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-highlight md:px-3 md:py-2"
                      >
                        <ListMusic size={16} />
                        <span className="flex-1">Agregar a playlist</span>
                        <span className="text-xs text-text-muted">
                          {playlistExpanded ? "▲" : "▼"}
                        </span>
                      </button>
                      {playlistExpanded && (
                        <div className="max-h-40 overflow-y-auto border-t border-border md:border-0">
                          {playlists.length === 0 ? (
                            <p className="px-4 py-2 text-xs text-text-muted">
                              No tienes playlists
                            </p>
                          ) : (
                            playlists.map((pl) => (
                              <button
                                key={pl.id}
                                type="button"
                                disabled={loadingPlaylist === pl.id}
                                onClick={() => void handleAddToPlaylist(pl.id)}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-highlight disabled:opacity-50 md:px-3 md:py-2"
                              >
                                <ListMusic size={14} className="shrink-0 text-accent" />
                                <span className="truncate">{pl.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      <MenuItem
                        icon={<Share2 size={16} />}
                        label="Compartir"
                        onClick={() => {
                          setShareOpen(true);
                          setMenuOpen(false);
                        }}
                      />
                    </>
                  ) : (
                    <MenuItem
                      icon={<Heart size={16} />}
                      label="Iniciar sesión para más opciones"
                      onClick={() => router.push("/login")}
                    />
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ShareWithFriendModal
        track={track}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-highlight disabled:opacity-50 md:px-3 md:py-2"
    >
      {icon}
      {label}
    </button>
  );
}
