"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Song, Playlist } from "@/types/music";
import { songToPlayerTrack } from "@/types/music";
import {
  usePlayerStore,
  useIsTrackCurrent,
} from "@/lib/stores/playerStore";
import { formatTime } from "@/lib/utils/format";
import { LikeButton } from "@/components/content/LikeButton";
import { AddToPlaylistMenu } from "@/components/playlists/AddToPlaylistMenu";

interface SongRowProps {
  song: Song;
  index?: number;
  queue?: Song[];
  playlists?: Playlist[];
  isAuthenticated?: boolean;
  showPlayNext?: boolean;
}

export function SongRow({
  song,
  index,
  queue,
  playlists = [],
  isAuthenticated = false,
  showPlayNext = true,
}: SongRowProps) {
  const isCurrent = useIsTrackCurrent(song.id);
  const isPlaying = usePlayerStore(
    (s) => s.currentTrack?.id === song.id && s.isPlaying,
  );
  const playTrack = usePlayerStore((s) => s.playTrack);
  const playCollection = usePlayerStore((s) => s.playCollection);
  const playNext = usePlayerStore((s) => s.playNext);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackList = (queue ?? [song]).map(songToPlayerTrack);
  const track = songToPlayerTrack(song);

  const handleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      playTrack(track, trackList);
    }, 250);
  };

  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    const startIndex = index ?? trackList.findIndex((t) => t.id === song.id);
    playCollection(trackList, startIndex >= 0 ? startIndex : 0);
  };

  return (
    <div
      className={`group flex w-full items-center gap-4 rounded-md px-3 py-2 transition-colors hover:bg-surface-highlight ${
        isCurrent ? "bg-surface-highlight/50" : ""
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        {index !== undefined && (
          <span
            className={`w-6 text-center text-sm group-hover:hidden ${
              isCurrent ? "text-accent" : "text-text-muted"
            }`}
          >
            {isPlaying ? "♪" : index + 1}
          </span>
        )}
        <span className="hidden w-6 text-center text-accent group-hover:block">▶</span>

        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
          <Image
            src={song.coverUrl}
            alt={song.albumTitle ?? song.title}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm ${
              isCurrent ? "font-medium text-accent" : ""
            }`}
          >
            {song.title}
          </p>
          <p className="truncate text-xs text-text-muted">{song.artist}</p>
        </div>

        <span className="text-xs text-text-muted">{formatTime(song.duration)}</span>
      </button>

      {showPlayNext && (
        <button
          type="button"
          onClick={() => playNext(track)}
          className="hidden rounded px-2 py-1 text-xs text-text-muted opacity-0 transition-opacity hover:text-white group-hover:opacity-100 md:block"
          title="Reproducir siguiente"
        >
          + Next
        </button>
      )}

      <LikeButton songId={song.id} />
      <AddToPlaylistMenu
        songId={song.id}
        playlists={playlists}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
