"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import type { YouTubeSearchItem } from "@/lib/youtube/types";
import type { PlayerTrack } from "@/types/music";
import { youtubeItemToPlayerTrack } from "@/types/music";
import { COVER_SIZES } from "@/lib/images/coverSizes";

interface SearchVideoCarouselProps {
  items: YouTubeSearchItem[];
  allTracks: PlayerTrack[];
}

export function SearchVideoCarousel({
  items,
  allTracks,
}: SearchVideoCarouselProps) {
  const playCollection = usePlayerStore((s) => s.playCollection);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-white">Videos musicales</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {items.map((item) => {
          const trackIndex = allTracks.findIndex(
            (t) => t.youtubeId === item.youtubeId,
          );
          const videoTrack = youtubeItemToPlayerTrack(item, "video");
          const isCurrent =
            currentTrack?.youtubeId === item.youtubeId && isPlaying;

          return (
            <button
              key={item.youtubeId}
              type="button"
              onClick={() => {
                const queue = allTracks.map((t) =>
                  t.youtubeId === item.youtubeId ? videoTrack : t,
                );
                playCollection(queue, trackIndex >= 0 ? trackIndex : 0);
              }}
              className="group w-64 shrink-0 text-left sm:w-72"
            >
              <div
                className={`relative mb-2 aspect-video overflow-hidden rounded-lg bg-surface-highlight shadow-md transition-transform group-hover:scale-[1.02] ${
                  isCurrent ? "ring-2 ring-accent" : ""
                }`}
              >
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width:768px) 256px, 288px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    ▶
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black shadow-lg">
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </span>
                </span>
              </div>
              <p
                className={`truncate text-sm font-medium ${
                  isCurrent ? "text-accent" : "text-white group-hover:text-accent"
                }`}
              >
                {item.title}
              </p>
              <p className="truncate text-xs text-text-muted">
                {item.channelTitle}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
