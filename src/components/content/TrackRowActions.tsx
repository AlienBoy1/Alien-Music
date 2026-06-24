"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  layout?: "default" | "spotify";
  kindLabel?: string;
}

interface MenuAnchor {
  top?: number;
  bottom?: number;
  left: number;
}

function useIsDesktopMenu() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function TrackRowActions({
  track,
  playlists = [],
  isAuthenticated = false,
  songId,
  layout = "default",
}: TrackRowActionsProps) {
  const router = useRouter();
  const isDesktopMenu = useIsDesktopMenu();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [playlistExpanded, setPlaylistExpanded] = useState(false);
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => setMounted(true), []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setPlaylistExpanded(false);
    setMenuAnchor(null);
  }, []);

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger && isDesktopMenu) {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 260;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < 280 && rect.top > 280 ? "above" : "below";
      const left = Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      );
      if (placement === "below") {
        setMenuAnchor({ top: rect.bottom + 6, left });
      } else {
        setMenuAnchor({
          bottom: window.innerHeight - rect.top + 6,
          left,
        });
      }
    } else {
      setMenuAnchor(null);
    }
    setMenuOpen(true);
  }, [isDesktopMenu]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen || isDesktopMenu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, isDesktopMenu]);

  useEffect(() => {
    if (!menuOpen || !isDesktopMenu) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuPanelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen, isDesktopMenu, closeMenu]);

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
    closeMenu();
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setLoadingPlaylist(playlistId);
    const id = await resolveSongId();
    if (id) await addSongToPlaylist(playlistId, id);
    setLoadingPlaylist(null);
    closeMenu();
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

  const menuContent = (
    <AnimatePresence>
      {menuOpen && (
        <>
          <motion.button
            type="button"
            className={`fixed inset-0 z-[200] bg-black/60 ${isDesktopMenu ? "md:bg-transparent" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Cerrar menú"
            onClick={closeMenu}
          />
          <motion.div
            ref={menuPanelRef}
            role="menu"
            className={
              isDesktopMenu
                ? "fixed z-[201] max-h-[min(70vh,420px)] min-w-[260px] overflow-y-auto rounded-lg border border-border bg-surface-elevated py-1 shadow-2xl"
                : "fixed inset-x-0 bottom-0 z-[201] max-h-[85vh] overflow-y-auto rounded-t-xl bg-[#282828] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl"
            }
            style={
              isDesktopMenu && menuAnchor
                ? {
                    top: menuAnchor.top,
                    bottom: menuAnchor.bottom,
                    left: menuAnchor.left,
                  }
                : undefined
            }
            initial={isDesktopMenu ? { opacity: 0, scale: 0.96 } : { y: "100%" }}
            animate={isDesktopMenu ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isDesktopMenu ? { opacity: 0, scale: 0.96 } : { y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
          >
            {!isDesktopMenu && (
              <>
                <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-white/30" />
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
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
              </>
            )}

            {isAuthenticated ? (
              <div className="py-1">
                <SheetItem
                  icon={<Share2 size={22} />}
                  label="Compartir"
                  isDesktop={isDesktopMenu}
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
                  isDesktop={isDesktopMenu}
                  onClick={() => {
                    handleToggleLike();
                    closeMenu();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPlaylistExpanded((v) => !v)}
                  className={`flex w-full items-center gap-4 text-left hover:bg-white/10 ${
                    isDesktopMenu
                      ? "px-3 py-2 text-sm text-white"
                      : "px-4 py-3.5 text-base text-white"
                  }`}
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
                  isDesktop={isDesktopMenu}
                  onClick={() => {
                    addToQueueNext(track);
                    closeMenu();
                  }}
                />
                <SheetItem
                  icon={<ListMusic size={22} />}
                  label="Ir a fila"
                  href="/queue"
                  isDesktop={isDesktopMenu}
                  onClick={closeMenu}
                />
                {track.albumTitle ? (
                  <SheetItem
                    icon={<Disc3 size={22} />}
                    label="Ir al álbum"
                    isDesktop={isDesktopMenu}
                    onClick={goToAlbum}
                  />
                ) : null}
                <SheetItem
                  icon={<UserRound size={22} />}
                  label="Ir al artista"
                  isDesktop={isDesktopMenu}
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
                      isDownloaded ? "Eliminar descarga" : "Descargar canción"
                    }
                    isDesktop={isDesktopMenu}
                    onClick={() => void handleDownload()}
                    disabled={isDownloading || (!isOnline && !isDownloaded)}
                  />
                )}
              </div>
            ) : (
              <SheetItem
                icon={<Heart size={22} />}
                label="Iniciar sesión para más opciones"
                isDesktop={isDesktopMenu}
                onClick={() => router.push("/login")}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        className="flex shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
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
          ref={triggerRef}
          type="button"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:text-white"
          aria-label="Más opciones"
          aria-expanded={menuOpen}
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
              optimisticLiked ? "En tus Me gusta" : "Agregar a tus Me gusta"
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
      </div>

      {mounted && createPortal(menuContent, document.body)}

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
  isDesktop,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  isDesktop?: boolean;
}) {
  const className = `flex w-full items-center gap-4 text-left hover:bg-white/10 disabled:opacity-50 ${
    isDesktop ? "px-3 py-2 text-sm text-white" : "px-4 py-3.5 text-base text-white"
  }`;

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
