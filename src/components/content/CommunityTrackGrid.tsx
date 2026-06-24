"use client";

import { memo, useCallback, useMemo } from "react";
import Image from "next/image";
import { songToPlayerTrack } from "@/types/music";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { COVER_SIZES } from "@/lib/images/coverSizes";
import type { Song } from "@/types/music";

interface CommunityTrackGridProps {
  songs: Song[];
  title: string;
}

export const CommunityTrackGrid = memo(function CommunityTrackGrid({
  songs,
  title,
}: CommunityTrackGridProps) {
  const playCollection = usePlayerStore((s) => s.playCollection);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const tracks = useMemo(() => songs.map(songToPlayerTrack), [songs]);

  const handlePlay = useCallback(
    (index: number) => {
      playCollection(tracks, index);
    },
    [playCollection, tracks],
  );

  if (songs.length === 0) return null;

  return (
    <section className="content-optimize mb-8 max-w-full overflow-hidden">
      <h2 className="font-display mb-4 inline-block text-xl font-bold tracking-wide text-alien-gradient beam-underline">
        {title}
      </h2>
      <div className="stagger-children flex max-w-full gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {songs.map((song, i) => {
          const isCurrent = currentTrackId === song.id && isPlaying;
          return (
            <button
              key={song.id}
              type="button"
              onClick={() => handlePlay(i)}
              className="group w-36 max-w-[40vw] shrink-0 text-left sm:w-40"
            >
              <div
                className={`relative mb-2 aspect-square overflow-hidden rounded-lg border bg-surface-highlight transition-transform duration-200 group-hover:scale-105 ${
                  isCurrent
                    ? "border-accent ring-2 ring-accent alien-glow"
                    : "border-border group-hover:border-accent/30"
                }`}
              >
                {song.coverUrl ? (
                  <Image
                    src={song.coverUrl}
                    alt={song.title}
                    fill
                    sizes={COVER_SIZES.card}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    ♪
                  </div>
                )}
              </div>
              <p
                className={`truncate text-sm ${
                  isCurrent ? "font-medium text-accent" : "group-hover:text-white"
                }`}
              >
                {song.title}
              </p>
              <p className="truncate text-xs text-text-muted">{song.artist}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
});
