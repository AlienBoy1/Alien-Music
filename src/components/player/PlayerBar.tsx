"use client";

import Image from "next/image";
import { Loader2, ListMusic, Maximize2, Mic2, MonitorSpeaker, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatTime } from "@/lib/utils/format";
import { LikeButton } from "@/components/content/LikeButton";
import { getActiveQueue } from "@/lib/player/queueUtils";

export function PlayerBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const shuffledQueue = usePlayerStore((s) => s.shuffledQueue);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleQueuePanel = usePlayerStore((s) => s.toggleQueuePanel);
  const playCollection = usePlayerStore((s) => s.playCollection);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);

  if (!currentTrack) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-[var(--player-height)] items-center justify-center border-t border-border bg-surface-elevated px-4 text-sm text-text-muted">
        Selecciona una canción para reproducir
      </footer>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;
  const activeQueue = getActiveQueue(queue, shuffledQueue, isShuffle);

  return (
    <>
      {isQueueOpen && (
        <div className="fixed bottom-[var(--player-height)] right-0 z-50 flex h-80 w-80 flex-col border border-border bg-surface-elevated shadow-2xl md:right-4 md:rounded-t-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-bold">Cola de reproducción</h3>
            <button
              type="button"
              onClick={() => setQueueOpen(false)}
              className="text-text-muted hover:text-white"
              aria-label="Cerrar cola"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {activeQueue.length === 0 ? (
              <p className="p-4 text-center text-sm text-text-muted">Cola vacía</p>
            ) : (
              activeQueue.map((track, i) => (
                <button
                  key={`${track.id}-${i}`}
                  type="button"
                  onClick={() => playCollection(activeQueue, i)}
                  className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-surface-highlight ${
                    track.id === currentTrack.id ? "text-accent" : ""
                  }`}
                >
                  <span className="w-5 text-center text-xs text-text-muted">
                    {track.id === currentTrack.id && isPlaying ? "♪" : i + 1}
                  </span>
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
                    <Image src={track.coverUrl} alt="" fill sizes="32px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{track.title}</p>
                    <p className="truncate text-xs text-text-muted">{track.artistName}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-[var(--player-height)] items-center border-t border-border bg-surface-elevated px-3 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded md:block">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.albumTitle}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-accent">{currentTrack.title}</p>
            <p className="truncate text-xs text-text-muted">{currentTrack.artistName}</p>
          </div>
          <LikeButton songId={currentTrack.id} className="hidden md:block" />
        </div>

        <div className="flex flex-[2] flex-col items-center gap-1 px-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`transition-colors hover:text-white ${isShuffle ? "text-accent" : "text-text-muted"}`}
              aria-label="Aleatorio"
            >
              <Shuffle size={16} />
            </button>
            <button
              type="button"
              onClick={previous}
              className="text-text-muted transition-colors hover:text-white"
              aria-label="Anterior"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading && !isPlaying}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 disabled:opacity-80"
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isLoading && isPlaying ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              className="text-text-muted transition-colors hover:text-white"
              aria-label="Siguiente"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={`transition-colors hover:text-white ${repeatMode !== "off" ? "text-accent" : "text-text-muted"}`}
              aria-label="Repetir"
              title={
                repeatMode === "off"
                  ? "No repetir"
                  : repeatMode === "all"
                    ? "Repetir playlist"
                    : "Repetir canción"
              }
            >
              {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          <div className="hidden w-full max-w-md items-center gap-2 md:flex">
            <span className="w-10 text-right text-xs text-text-muted">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="progress-range flex-1"
              style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}
              aria-label="Progreso"
            />
            <span className="w-10 text-xs text-text-muted">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <button type="button" className="text-text-muted hover:text-white" aria-label="Letras">
            <Mic2 size={16} />
          </button>
          <button
            type="button"
            onClick={toggleQueuePanel}
            className={`transition-colors hover:text-white ${isQueueOpen ? "text-accent" : "text-text-muted"}`}
            aria-label="Cola"
          >
            <ListMusic size={16} />
          </button>
          <button type="button" className="text-text-muted hover:text-white" aria-label="Dispositivo">
            <MonitorSpeaker size={16} />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-text-muted hover:text-white"
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="volume-range w-24"
              style={{ "--volume": `${volumePercent}%` } as React.CSSProperties}
              aria-label="Volumen"
            />
          </div>
          <button type="button" className="text-text-muted hover:text-white" aria-label="Pantalla completa">
            <Maximize2 size={16} />
          </button>
        </div>
      </footer>
    </>
  );
}
