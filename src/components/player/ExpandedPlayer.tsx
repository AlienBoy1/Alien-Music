"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Loader2,
  ListMusic,
  MoreHorizontal,
  MonitorSpeaker,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatTime } from "@/lib/utils/format";
import { ImmersiveAuroraBackground } from "@/components/player/ImmersiveAuroraBackground";
import { EphemeralLikeButton } from "@/components/search/EphemeralLikeButton";
import { LikeButton } from "@/components/content/LikeButton";
import { ShareWithFriendModal } from "@/components/share/ShareWithFriendModal";
import { isEphemeralTrackId } from "@/types/music";

function ControlWithIndicator({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center p-2 transition-colors ${
        active ? "text-accent" : "text-white/50 hover:text-white"
      }`}
      aria-label={label}
    >
      {children}
      {active && (
        <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
      )}
    </button>
  );
}

export function ExpandedPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isExpandedMode = usePlayerStore((s) => s.isExpandedMode);
  const setExpandedMode = usePlayerStore((s) => s.setExpandedMode);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const queue = usePlayerStore((s) => s.queue);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const seek = usePlayerStore((s) => s.seek);

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpandedMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isExpandedMode]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  if (!isExpandedMode || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const isVideo = currentTrack.type === "video";

  const contextLabel =
    currentTrack.albumTitle && currentTrack.albumTitle !== currentTrack.title
      ? currentTrack.albumTitle
      : queue.length > 1
        ? "Tu cola de reproducción"
        : "Reproducción actual";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTrack.title,
          text: `${currentTrack.title} — ${currentTrack.artistName}`,
          url: window.location.href,
        });
        return;
      } catch {
        /* fallback modal */
      }
    }
    setShareOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor expandido"
    >
      <ImmersiveAuroraBackground
        coverUrl={currentTrack.coverUrl}
        progress={progressRatio}
      />

      {/* Header */}
      <header className="relative z-10 grid grid-cols-[40px_1fr_40px] items-center px-4 py-3">
        <button
          type="button"
          onClick={() => setExpandedMode(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
          aria-label="Minimizar reproductor"
        >
          <ChevronDown size={28} />
        </button>

        <div className="min-w-0 px-2 text-center">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
            Reproduciendo desde
          </p>
          <p className="truncate text-xs font-semibold text-white/90">
            {contextLabel}
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
            aria-label="Más opciones"
          >
            <MoreHorizontal size={22} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-white/10 bg-surface-elevated py-1 shadow-xl backdrop-blur-xl">
              <Link
                href="/queue"
                onClick={() => setExpandedMode(false)}
                className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
              >
                Ver cola completa
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Centro — carátula */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-2">
        {isVideo ? (
          <div
            id="expanded-video-mount"
            className="relative mx-auto aspect-video w-full max-w-lg overflow-hidden rounded-xl shadow-2xl"
          />
        ) : (
          <div className="relative mx-auto aspect-square w-full max-w-[min(92vw,380px)] overflow-hidden rounded-lg shadow-[0_12px_48px_rgba(0,0,0,0.55)]">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.albumTitle}
              fill
              sizes="(max-width:768px) 92vw, 380px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Info track */}
        <div className="mx-auto mt-6 flex w-full max-w-[min(92vw,380px)] items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-white">
              {currentTrack.title}
            </h1>
            <p className="mt-0.5 truncate text-base text-white/55">
              {currentTrack.artistName}
            </p>
          </div>
          <div className="shrink-0 pt-1">
            {currentTrack.isEphemeral || isEphemeralTrackId(currentTrack.id) ? (
              <EphemeralLikeButton track={currentTrack} size={26} className="opacity-100" />
            ) : (
              <LikeButton songId={currentTrack.id} size={26} className="opacity-100" />
            )}
          </div>
        </div>
      </div>

      {/* Controles inferiores */}
      <footer className="relative z-10 px-6 pb-6 pt-2">
        {/* Progreso */}
        <div className="mx-auto max-w-lg">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="progress-range expanded-progress w-full"
            style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}
            aria-label="Progreso"
          />
          <div className="mt-1 flex justify-between text-xs text-white/50">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Fila principal */}
        <div className="mx-auto mt-4 flex max-w-md items-center justify-between">
          <ControlWithIndicator
            active={isShuffle}
            label="Aleatorio"
            onClick={toggleShuffle}
          >
            <Shuffle size={22} />
          </ControlWithIndicator>

          <button
            type="button"
            onClick={previous}
            className="p-2 text-white/80 transition-colors hover:text-white"
            aria-label="Anterior"
          >
            <SkipBack size={28} fill="currentColor" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading && !isPlaying}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105 disabled:opacity-80"
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isLoading && isPlaying ? (
              <Loader2 size={28} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            className="p-2 text-white/80 transition-colors hover:text-white"
            aria-label="Siguiente"
          >
            <SkipForward size={28} fill="currentColor" />
          </button>

          <ControlWithIndicator
            active={repeatMode !== "off"}
            label="Repetir"
            onClick={cycleRepeat}
          >
            {repeatMode === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
          </ControlWithIndicator>
        </div>

        {/* Barra herramientas */}
        <div className="mx-auto mt-6 flex max-w-sm items-center justify-between text-white/55">
          <button
            type="button"
            className="flex flex-col items-center gap-1 p-2 transition-colors hover:text-accent"
            aria-label="Dispositivos conectados"
            title="Dispositivos (próximamente)"
          >
            <MonitorSpeaker size={20} />
            <span className="text-[10px]">Dispositivo</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-1 p-2 transition-colors hover:text-accent"
            aria-label="Compartir"
          >
            <Share2 size={20} />
            <span className="text-[10px]">Compartir</span>
          </button>

          <Link
            href="/queue"
            onClick={() => setExpandedMode(false)}
            className="flex flex-col items-center gap-1 p-2 transition-colors hover:text-accent"
            aria-label="Cola de reproducción"
          >
            <ListMusic size={20} />
            <span className="text-[10px]">Cola</span>
          </Link>
        </div>
      </footer>

      <ShareWithFriendModal
        track={currentTrack}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
