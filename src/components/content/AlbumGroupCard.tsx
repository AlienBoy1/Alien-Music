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
          className={`relative mb-3 aspect-square w-full overflow-hidden rounded-md bg-surface-highlight shadow-lg transition-transform group-hover:scale-[1.02] ${
            isAlbumPlaying ? "ring-2 ring-accent" : ""
          }`}
        >
          <Image
            src={group.coverUrl}
            alt={`${group.artist} - ${group.albumTitle}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-xl">
              <span className="ml-1 text-black">▶</span>
            </div>
          </div>
        </div>
        <p
          className={`truncate text-xs ${
            isAlbumPlaying ? "font-medium text-accent" : "text-text-muted"
          }`}
        >
          {group.artist} - {group.albumTitle}
        </p>
      </button>

      {firstSong && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <LikeButton songId={firstSong.id} />
        </div>
      )}
    </div>
  );
}
