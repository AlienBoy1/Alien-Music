"use client";

import Image from "next/image";
import Link from "next/link";
import { ListMusic } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { songToPlayerTrack } from "@/types/music";
import type { Song, Playlist } from "@/types/music";
import { COVER_SIZES } from "@/lib/images/coverSizes";

export interface QuickAccessItem {
  id: string;
  title: string;
  coverUrl?: string;
  href?: string;
  songs?: Song[];
}

interface HomeQuickAccessGridProps {
  recentlyPlayed: Song[];
  playlists: Playlist[];
}

function buildQuickItems(
  recentlyPlayed: Song[],
  playlists: Playlist[],
): QuickAccessItem[] {
  const items: QuickAccessItem[] = [];
  const seen = new Set<string>();

  for (const song of recentlyPlayed) {
    const key = `song:${song.id}`;
    if (seen.has(key) || items.length >= 8) break;
    seen.add(key);
    items.push({
      id: key,
      title: song.title,
      coverUrl: song.coverUrl,
      songs: [song],
    });
  }

  for (const pl of playlists) {
    if (items.length >= 8) break;
    const key = `pl:${pl.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: key,
      title: pl.name,
      href: `/playlists/${pl.id}`,
    });
  }

  return items.slice(0, 8);
}

export function HomeQuickAccessGrid({
  recentlyPlayed,
  playlists,
}: HomeQuickAccessGridProps) {
  const playCollection = usePlayerStore((s) => s.playCollection);
  const items = buildQuickItems(recentlyPlayed, playlists);

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:gap-3">
        {items.map((item) => {
          const inner = (
            <>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-surface-highlight sm:h-11 sm:w-11">
                {item.coverUrl ? (
                  <Image
                    src={item.coverUrl}
                    alt=""
                    fill
                    sizes={COVER_SIZES.row}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-accent">
                    <ListMusic size={18} />
                  </div>
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                {item.title}
              </span>
            </>
          );

          const className =
            "glass-alien group flex items-center gap-3 rounded-md px-2 py-2 transition-all hover:bg-white/10 sm:px-3 sm:py-2.5";

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className={className}>
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.songs?.length) {
                  playCollection(item.songs.map(songToPlayerTrack), 0);
                }
              }}
              className={`${className} text-left`}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
