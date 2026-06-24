"use client";

import Image from "next/image";
import type { AlbumGroup } from "@/lib/db/songs";
import { songToPlayerTrack } from "@/types/music";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { LikeButton } from "@/components/content/LikeButton";

interface AlbumGroupCardProps {
  group: AlbumGroup;
}

export function AlbumGroupCard({ group }: AlbumGroupCardProps) {
  const playCollection = usePlayerStore((s) => s.playCollection);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const firstSong = group.songs[0];
  const isAlbumPlaying =
    isPlaying &&
    currentTrack &&
    group.songs.some((s) => s.id === currentTrack.id);

  const handlePlay = () => {
    const tracks = group.songs.map(songToPlayerTrack);
    playCollection(tracks, 0);
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handlePlay}
        onDoubleClick={handlePlay}
        className="w-full text-left"
        aria-label={`Reproducir ${group.albumTitle} de ${group.artist}`}
      >
        <div
          className={`relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-surface-highlight shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_24px_rgba(0,255,159,0.15)] ${
            isAlbumPlaying
              ? "ring-2 ring-accent alien-glow"
              : "border border-border group-hover:border-accent/30"
          }`}
        >
          <Image
            src={group.coverUrl}
            alt={`${group.artist} - ${group.albumTitle}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="alien-btn-play flex h-12 w-12 items-center justify-center rounded-full">
              <span className="ml-1 text-black">▶</span>
            </div>
          </div>
          {isAlbumPlaying && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent/15 to-transparent" />
          )}
        </div>
        <p
          className={`truncate text-xs transition-colors duration-200 ${
            isAlbumPlaying ? "font-medium text-accent alien-glow-text" : "text-text-muted group-hover:text-white"
          }`}
        >
          {group.artist} - {group.albumTitle}
        </p>
      </button>

      {firstSong && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <LikeButton songId={firstSong.id} />
        </div>
      )}
    </div>
  );
}
