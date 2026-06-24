"use client";

import Image from "next/image";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { AudioVisualizer } from "@/components/ui/AudioVisualizer";

/** Panel lateral "Reproduciendo ahora" con portada grande y efectos alien */
export function NowPlayingPanel() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  if (!currentTrack) {
    return (
      <div className="hidden flex-col gap-3 lg:flex">
        <p className="font-display text-sm font-semibold tracking-wide text-text-muted">
          Now Playing
        </p>
        <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-surface-highlight/50 text-text-muted animate-hologram">
          <span className="text-xs">Sin señal</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden flex-col gap-3 lg:flex animate-fade-in-up">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold tracking-wide text-alien-gradient">
          Now Playing
        </p>
        <AudioVisualizer active={isPlaying} />
      </div>
      <div className="relative">
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-xl alien-border-glow shadow-2xl ${
            isPlaying ? "vinyl-playing" : ""
          }`}
        >
          <Image
            src={currentTrack.coverUrl}
            alt={`${currentTrack.albumTitle} - ${currentTrack.artistName}`}
            fill
            sizes="240px"
            className="object-cover"
            priority
          />
          {isPlaying && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent/10 via-transparent to-alien-purple/10" />
          )}
        </div>
        {isPlaying && (
          <div className="pointer-events-none absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-accent/20 via-alien-cyan/20 to-alien-purple/20 blur-md animate-alien-pulse" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-accent alien-glow-text">
          {currentTrack.title}
        </p>
        <p className="truncate text-xs text-text-muted">
          {currentTrack.artistName}
        </p>
      </div>
    </div>
  );
}
