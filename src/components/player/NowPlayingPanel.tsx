"use client";

import Image from "next/image";
import { usePlayerStore } from "@/lib/stores/playerStore";

/** Panel lateral "Reproduciendo ahora" con portada grande */
export function NowPlayingPanel() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  if (!currentTrack) {
    return (
      <div className="hidden flex-col gap-3 lg:flex">
        <p className="text-sm font-semibold text-text-muted">Now Playing</p>
        <div className="flex aspect-square items-center justify-center rounded-lg bg-surface-highlight text-text-muted">
          Sin reproducción
        </div>
      </div>
    );
  }

  return (
    <div className="hidden flex-col gap-3 lg:flex">
      <p className="text-sm font-semibold">Now Playing</p>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-2xl">
        <Image
          src={currentTrack.coverUrl}
          alt={`${currentTrack.albumTitle} - ${currentTrack.artistName}`}
          fill
          sizes="240px"
          className="object-cover"
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{currentTrack.title}</p>
        <p className="truncate text-xs text-text-muted">
          {currentTrack.artistName}
        </p>
      </div>
    </div>
  );
}
