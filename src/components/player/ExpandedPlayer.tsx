"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
import { ImmersiveAuroraBackground } from "@/components/player/ImmersiveAuroraBackground";
import { ImmersiveParticles } from "@/components/player/ImmersiveParticles";

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
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor a pantalla completa"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <ImmersiveAuroraBackground
        coverUrl={currentTrack.coverUrl}
        progress={progressRatio}
      />
      <ImmersiveParticles
        progress={progressRatio}
        isPlaying={isPlaying}
      />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={() => setExpandedMode(false)}
          className="glass-alien flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-all hover:border-accent/50 hover:text-accent"
        >
          <Minimize2 size={16} />
          <span className="hidden sm:inline">Salir de pantalla completa</span>
          <span className="sm:hidden">Minimizar</span>
        </button>
        <div className="text-right">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-accent/90">
            Modo inmersivo
          </p>
          <p className="text-sm text-white/70">{currentTrack.artistName}</p>
        </div>
      </header>

      <div
        className={`relative z-10 flex flex-1 flex-col gap-6 px-4 pb-4 md:px-8 lg:flex-row lg:items-center lg:gap-12 ${
          isVideo ? "lg:justify-start" : "lg:justify-center"
        }`}
      >
        {isVideo ? (
          <>
            <div
              id="expanded-video-mount"
              className="glass-alien relative mx-auto aspect-video w-full max-w-4xl shrink-0 overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(0,255,159,0.12)] lg:mx-0 lg:w-[58%]"
            />
            <div className="flex flex-1 flex-col justify-center lg:max-w-md">
              <h1 className="font-display text-2xl font-bold text-alien-gradient md:text-3xl">
                {currentTrack.title}
              </h1>
              <p className="mt-1 text-lg text-white/70">{currentTrack.artistName}</p>
              {isPlaying && (
                <div className="mt-4">
                  <AudioVisualizer active bars={5} />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <motion.div
              className="relative mx-auto h-56 w-56 shrink-0 overflow-hidden rounded-2xl ring-1 ring-accent/40 shadow-[0_0_80px_rgba(0,255,159,0.25)] md:h-72 md:w-72 lg:mx-0 lg:h-80 lg:w-80"
              animate={isPlaying ? { y: [0, -4, 0] } : { y: 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={currentTrack.coverUrl}
                alt={currentTrack.albumTitle}
                fill
                sizes="(max-width:768px) 224px, 320px"
                className={`object-cover ${isPlaying ? "animate-alien-pulse" : ""}`}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-accent/10" />
            </motion.div>

            <div className="flex min-h-0 flex-1 flex-col justify-center lg:max-w-xl">
              <div className="glass-alien mb-4 rounded-2xl p-5">
                <h1 className="font-display text-2xl font-bold text-alien-gradient md:text-4xl">
                  {currentTrack.title}
                </h1>
                <p className="mt-2 text-lg text-white/75">{currentTrack.artistName}</p>
                {isPlaying && (
                  <div className="mt-3">
                    <AudioVisualizer active bars={5} />
                  </div>
                )}
              </div>

              <div className="glass-alien min-h-[180px] flex-1 overflow-y-auto p-4 md:p-5">
                {lyricsLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-text-muted">
                    <Loader2 size={18} className="animate-spin text-accent" />
                    Cargando letras...
                  </div>
                )}
                {!lyricsLoading && lyrics && (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/90 md:text-base">
                    {lyrics}
                  </pre>
                )}
                {!lyricsLoading && !lyrics && (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    {lyricsError ? (
                      <p className="text-center text-sm text-white/60">{lyricsError}</p>
                    ) : null}
                    <AudioVisualizer active={isPlaying} bars={7} className="scale-125" />
                    <p className="text-center text-xs text-white/50">
                      Ondas interestelares sincronizadas con tu universo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="relative z-10 px-4 py-4 md:px-8">
        <div className="glass-alien mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-right text-xs text-white/60">
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
            <span className="w-10 shrink-0 text-xs text-white/60">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-between">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`p-2 transition-colors ${
                isShuffle ? "text-accent" : "text-white/50 hover:text-white"
              }`}
              aria-label="Aleatorio"
            >
              <Shuffle size={18} />
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={previous}
                className="text-white/60 transition-colors hover:text-accent"
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
                className="text-white/60 transition-colors hover:text-accent"
                aria-label="Siguiente"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>

            <button
              type="button"
              onClick={cycleRepeat}
              className={`p-2 transition-colors ${
                repeatMode !== "off" ? "text-accent" : "text-white/50 hover:text-white"
              }`}
              aria-label="Repetir"
            >
              {repeatMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={cycleQuality}
              className="glass-alien-pill text-xs font-medium text-white/60 transition-colors hover:text-accent"
            >
              Calidad: {qualityLabel}
            </button>
            <button
              type="button"
              onClick={toggleLyricsPanel}
              className={`glass-alien-pill flex items-center gap-1 text-xs font-medium transition-colors ${
                isLyricsOpen ? "text-accent" : "text-white/60 hover:text-white"
              }`}
            >
              <Mic2 size={14} />
              Letras
            </button>
            <Link
              href="/queue"
              onClick={() => setExpandedMode(false)}
              className="glass-alien-pill flex items-center gap-1 text-xs font-medium text-white/60 transition-colors hover:text-accent"
            >
              <ListMusic size={14} />
              Cola
            </Link>
            <button
              type="button"
              onClick={() => setAutoplayEnabled(!autoplayEnabled)}
              className={`glass-alien-pill text-xs font-medium transition-colors ${
                autoplayEnabled ? "text-accent" : "text-white/60"
              }`}
            >
              Autoplay
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="text-white/60 hover:text-accent"
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
    </motion.div>
  );
}
