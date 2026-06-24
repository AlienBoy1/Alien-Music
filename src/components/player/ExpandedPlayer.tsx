"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  Loader2,
  ListMusic,
  Mic2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { usePlayerStore, type VideoQuality } from "@/lib/stores/playerStore";
import { useTrackLyrics } from "@/hooks/useTrackLyrics";
import { formatTime } from "@/lib/utils/format";
import { AudioVisualizer } from "@/components/ui/AudioVisualizer";

export function ExpandedPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isExpandedMode = usePlayerStore((s) => s.isExpandedMode);
  const setExpandedMode = usePlayerStore((s) => s.setExpandedMode);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleLyricsPanel = usePlayerStore((s) => s.toggleLyricsPanel);
  const isLyricsOpen = usePlayerStore((s) => s.isLyricsOpen);
  const videoQuality = usePlayerStore((s) => s.videoQuality);
  const setVideoQuality = usePlayerStore((s) => s.setVideoQuality);
  const autoplayEnabled = usePlayerStore((s) => s.autoplayEnabled);
  const setAutoplayEnabled = usePlayerStore((s) => s.setAutoplayEnabled);

  const cycleQuality = () => {
    const order: VideoQuality[] = ["low", "normal", "high", "extreme"];
    const idx = order.indexOf(videoQuality);
    setVideoQuality(order[(idx + 1) % order.length]);
  };

  const qualityLabel =
    videoQuality === "low"
      ? "Baja"
      : videoQuality === "high"
        ? "Alta"
        : videoQuality === "extreme"
          ? "Extrema"
          : "Normal";

  const isVideo = currentTrack?.type === "video";
  const { lyrics, loading: lyricsLoading, error: lyricsError } = useTrackLyrics(
    currentTrack,
    isExpandedMode && !isVideo,
  );

  useEffect(() => {
    if (!isExpandedMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isExpandedMode]);

  if (!isExpandedMode || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor a pantalla completa"
    >
      {/* Fondo cinematográfico difuminado */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src={currentTrack.coverUrl}
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover opacity-60 blur-[64px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-surface/70 to-black/90" />
        <div className="absolute inset-0 animate-cosmic-drift bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,255,159,0.12),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(168,85,247,0.1),transparent_45%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={() => setExpandedMode(false)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-accent/40 hover:text-accent"
        >
          <Minimize2 size={16} />
          Salir de pantalla completa
        </button>
        <div className="hidden text-right md:block">
          <p className="font-display text-xs uppercase tracking-widest text-accent/80">
            Modo inmersivo
          </p>
          <p className="text-sm text-text-muted">{currentTrack.artistName}</p>
        </div>
      </header>

      <div
        className={`relative z-10 flex flex-1 flex-col gap-6 px-4 pb-8 md:px-8 lg:flex-row lg:items-center lg:gap-12 ${
          isVideo ? "lg:justify-start" : "lg:justify-center"
        }`}
      >
        {isVideo ? (
          <>
            {/* Slot visual: el iframe de YouTube se posiciona aquí vía AudioEngine */}
            <div
              id="expanded-video-mount"
              className="relative mx-auto aspect-video w-full max-w-4xl shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_0_60px_rgba(0,255,159,0.08)] backdrop-blur-sm lg:mx-0 lg:w-[58%]"
            />
            <div className="flex flex-1 flex-col justify-center lg:max-w-md">
              <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
                {currentTrack.title}
              </h1>
              <p className="mt-1 text-lg text-text-muted">{currentTrack.artistName}</p>
              {isPlaying && (
                <div className="mt-4">
                  <AudioVisualizer active bars={5} />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="relative mx-auto h-56 w-56 shrink-0 overflow-hidden rounded-2xl shadow-[0_0_80px_rgba(0,255,159,0.2)] ring-1 ring-accent/30 md:h-72 md:w-72 lg:mx-0 lg:h-80 lg:w-80">
              <Image
                src={currentTrack.coverUrl}
                alt={currentTrack.albumTitle}
                fill
                sizes="(max-width:768px) 224px, 320px"
                className={`object-cover ${isPlaying ? "animate-alien-pulse" : ""}`}
                priority
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-center lg:max-w-xl">
              <h1 className="font-display text-2xl font-bold text-alien-gradient md:text-4xl">
                {currentTrack.title}
              </h1>
              <p className="mt-2 text-lg text-text-muted">{currentTrack.artistName}</p>

              <div className="mt-6 min-h-[180px] flex-1 overflow-y-auto rounded-xl border border-white/5 bg-black/30 p-4 backdrop-blur-md">
                {lyricsLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-text-muted">
                    <Loader2 size={18} className="animate-spin text-accent" />
                    Cargando letras...
                  </div>
                )}
                {!lyricsLoading && lyrics && (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/85 md:text-base">
                    {lyrics}
                  </pre>
                )}
                {!lyricsLoading && !lyrics && (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    {lyricsError ? (
                      <p className="text-center text-sm text-text-muted">{lyricsError}</p>
                    ) : null}
                    <AudioVisualizer active={isPlaying} bars={7} className="scale-125" />
                    <p className="text-center text-xs text-text-muted">
                      Disfruta las ondas mientras suena tu universo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="relative z-10 border-t border-white/10 bg-black/50 px-4 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-right text-xs text-text-muted">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="progress-range min-w-0 flex-1"
              style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}
              aria-label="Progreso"
            />
            <span className="w-10 shrink-0 text-xs text-text-muted">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-between">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`p-2 transition-colors ${
                isShuffle ? "text-accent" : "text-text-muted hover:text-white"
              }`}
              aria-label="Aleatorio"
            >
              <Shuffle size={18} />
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={previous}
                className="text-text-muted transition-colors hover:text-accent"
                aria-label="Anterior"
              >
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                disabled={isLoading && !isPlaying}
                className="alien-btn-play flex h-14 w-14 items-center justify-center rounded-full disabled:opacity-80"
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isLoading && isPlaying ? (
                  <Loader2 size={22} className="animate-spin text-black" />
                ) : isPlaying ? (
                  <Pause size={22} fill="currentColor" />
                ) : (
                  <Play size={22} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={next}
                className="text-text-muted transition-colors hover:text-accent"
                aria-label="Siguiente"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>

            <button
              type="button"
              onClick={cycleRepeat}
              className={`p-2 transition-colors ${
                repeatMode !== "off" ? "text-accent" : "text-text-muted hover:text-white"
              }`}
              aria-label="Repetir"
            >
              {repeatMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/5 pt-3">
            <button
              type="button"
              onClick={cycleQuality}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              Calidad: {qualityLabel}
            </button>
            <button
              type="button"
              onClick={toggleLyricsPanel}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isLyricsOpen
                  ? "border-accent/40 text-accent"
                  : "border-white/10 text-text-muted hover:text-white"
              }`}
            >
              <Mic2 size={14} />
              Letras
            </button>
            <Link
              href="/queue"
              onClick={() => setExpandedMode(false)}
              className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <ListMusic size={14} />
              Cola
            </Link>
            <button
              type="button"
              onClick={() => setAutoplayEnabled(!autoplayEnabled)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                autoplayEnabled
                  ? "border-accent/40 text-accent"
                  : "border-white/10 text-text-muted"
              }`}
            >
              Autoplay
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="text-text-muted hover:text-accent"
                aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-range w-20 md:w-24"
                style={{ "--volume": `${volumePercent}%` } as React.CSSProperties}
                aria-label="Volumen"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
