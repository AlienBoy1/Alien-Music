"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Disc3,
  Download,
  Heart,
  ListMusic,
  ListPlus,
  Loader2,
  MoreVertical,
  Plus,
  Share2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useOfflineStore } from "@/lib/stores/offlineStore";
import { useLikesContext } from "@/components/providers/LikesProvider";
import { toggleLikeSong } from "@/app/actions/likes";
import { indexSong } from "@/app/actions/indexSong";
import { addSongToPlaylist } from "@/app/actions/playlists";
import { ShareWithFriendModal } from "@/components/share/ShareWithFriendModal";
import type { PlayerTrack, Playlist } from "@/types/music";
import { isEphemeralTrackId } from "@/types/music";
import { COVER_SIZES } from "@/lib/images/coverSizes";

interface TrackRowActionsProps {
  track: PlayerTrack;
  playlists?: Playlist[];
  isAuthenticated?: boolean;
  songId?: string;
  /** Spotify: solo ⋮ + círculo añadir/✓ */
  layout?: "default" | "spotify";
  /** Tipo mostrado en filas de búsqueda: Canción, Podcast, etc. */
  kindLabel?: string;
}

export function TrackRowActions({
  track,
  playlists = [],
  isAuthenticated = false,
  songId,
  layout = "default",
  kindLabel = "Canción",
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

  const { likedSongIds } = useLikesContext();
  const isEphemeral = track.isEphemeral || isEphemeralTrackId(track.id);
  const resolvedSongId = songId ?? (isEphemeral ? undefined : track.id);
  const isLiked = resolvedSongId ? likedSongIds.has(resolvedSongId) : false;

  const [optimisticLiked, setOptimisticLiked] = useOptimistic(isLiked);
  const [likePending, startLikeTransition] = useTransition();

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

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    startLikeTransition(async () => {
      setOptimisticLiked(!optimisticLiked);
      const id = await resolveSongId();
      if (!id) {
        setOptimisticLiked(optimisticLiked);
        return;
      }
      const result = await toggleLikeSong(id);
      if (result.error) setOptimisticLiked(optimisticLiked);
      else router.refresh();
    });
  };

  const handleDownload = async () => {
    if (isDownloaded) await removeDownload(track.id);
    else await download(track);
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

  const closeMenu = () => {
    setMenuOpen(false);
    setPlaylistExpanded(false);
  };

  const subtitle =
    track.albumTitle && track.albumTitle !== track.title
      ? `${track.artistName} • ${track.albumTitle}`
      : track.artistName;

  const goToArtist = () => {
    closeMenu();
    router.push(`/search?q=${encodeURIComponent(track.artistName)}&filter=songs`);
  };

  const goToAlbum = () => {
    closeMenu();
    const q = track.albumTitle || track.title;
    router.push(`/search?q=${encodeURIComponent(q)}&filter=songs`);
  };

  return (
    <>
      <div
        className="flex shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
        ref={menuRef}
      >
        {layout === "default" && (
          <>
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={likePending}
              className={`rounded-full p-1.5 transition-all hover:bg-surface-highlight disabled:opacity-60 ${
                optimisticLiked
                  ? "text-accent opacity-100"
                  : "text-text-muted opacity-100 md:opacity-0 md:group-hover:opacity-100"
              }`}
              aria-label={optimisticLiked ? "Quitar de me gusta" : "Me gusta"}
            >
              <Heart size={16} fill={optimisticLiked ? "currentColor" : "none"} />
            </button>
            {(isOnline || isDownloaded) && (
              <button
                type="button"
                onClick={() => void handleDownload()}
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
                ) : (
                  <Download size={16} />
                )}
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:text-white"
          aria-label="Más opciones"
        >
          <MoreVertical size={20} />
        </button>

        {layout === "spotify" && (
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={likePending}
            className="flex h-10 w-10 items-center justify-center disabled:opacity-60"
            aria-label={
              optimisticLiked
                ? "En tus Me gusta"
                : "Agregar a tus Me gusta"
            }
          >
            {optimisticLiked ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                <Check size={16} className="text-black" strokeWidth={3} />
              </span>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-text-muted/60 text-text-muted transition-colors hover:border-white hover:text-white">
                <Plus size={16} strokeWidth={2.5} />
              </span>
            )}
          </button>
        )}

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                type="button"
                className="fixed inset-0 z-[100] bg-black/60 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-label="Cerrar menú"
                onClick={closeMenu}
              />
              <motion.div
                className="fixed inset-x-0 bottom-0 z-[101] max-h-[85vh] overflow-y-auto rounded-t-xl bg-[#282828] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl md:absolute md:inset-auto md:bottom-auto md:right-0 md:top-full md:mt-1 md:max-h-none md:min-w-[260px] md:rounded-lg md:border md:border-border md:bg-surface-elevated md:pb-0 md:shadow-xl"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 340 }}
              >
                <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-white/30 md:hidden" />

                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4 md:hidden">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                    <Image
                      src={track.coverUrl}
                      alt=""
                      fill
                      sizes={COVER_SIZES.thumb}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white">
                      {track.title}
                    </p>
                    <p className="truncate text-sm text-neutral-400">
                      {subtitle}
                    </p>
                  </div>
                </div>

                {isAuthenticated ? (
                  <div className="py-1 md:py-0">
                    <SheetItem
                      icon={<Share2 size={22} />}
                      label="Compartir"
                      onClick={() => {
                        setShareOpen(true);
                        closeMenu();
                      }}
                    />
                    <SheetItem
                      icon={
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-alien-purple to-alien-cyan">
                          <Heart size={14} className="text-white" fill="white" />
                        </span>
                      }
                      label="Agregar a tus Me gusta"
                      onClick={() => {
                        handleToggleLike();
                        closeMenu();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPlaylistExpanded((v) => !v)}
                      className="flex w-full items-center gap-4 px-4 py-3.5 text-left text-base text-white hover:bg-white/10 md:px-3 md:py-2 md:text-sm"
                    >
                      <Plus size={22} className="shrink-0" />
                      <span className="flex-1">Agregar a playlist</span>
                    </button>
                    {playlistExpanded && (
                      <div className="max-h-48 overflow-y-auto border-t border-white/10 bg-black/20">
                        {playlists.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-neutral-400">
                            No tienes playlists
                          </p>
                        ) : (
                          playlists.map((pl) => (
                            <button
                              key={pl.id}
                              type="button"
                              disabled={loadingPlaylist === pl.id}
                              onClick={() => void handleAddToPlaylist(pl.id)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 disabled:opacity-50"
                            >
                              <ListMusic size={18} className="shrink-0 text-accent" />
                              <span className="truncate">{pl.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    <SheetItem
                      icon={<ListPlus size={22} />}
                      label="Agregar a la fila"
                      onClick={() => {
                        addToQueueNext(track);
                        closeMenu();
                      }}
                    />
                    <SheetItem
                      icon={<ListMusic size={22} />}
                      label="Ir a fila"
                      href="/queue"
                      onClick={closeMenu}
                    />
                    {track.albumTitle ? (
                      <SheetItem
                        icon={<Disc3 size={22} />}
                        label="Ir al álbum"
                        onClick={goToAlbum}
                      />
                    ) : null}
                    <SheetItem
                      icon={<UserRound size={22} />}
                      label="Ir al artista"
                      onClick={goToArtist}
                    />
                    {(isOnline || isDownloaded) && (
                      <SheetItem
                        icon={
                          isDownloading ? (
                            <Loader2 size={22} className="animate-spin" />
                          ) : (
                            <Download size={22} />
                          )
                        }
                        label={
                          isDownloaded
                            ? "Eliminar descarga"
                            : "Descargar canción"
                        }
                        onClick={() => void handleDownload()}
                        disabled={isDownloading || (!isOnline && !isDownloaded)}
                      />
                    )}
                  </div>
                ) : (
                  <SheetItem
                    icon={<Heart size={22} />}
                    label="Iniciar sesión para más opciones"
                    onClick={() => router.push("/login")}
                  />
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <ShareWithFriendModal
        track={track}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}

function SheetItem({
  icon,
  label,
  onClick,
  href,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const className =
    "flex w-full items-center gap-4 px-4 py-3.5 text-left text-base text-white hover:bg-white/10 disabled:opacity-50 md:px-3 md:py-2 md:text-sm";

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        <span className="shrink-0">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  );
}
