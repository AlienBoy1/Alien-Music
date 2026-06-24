"use client";

import Image from "next/image";
import { memo, useRef, useCallback } from "react";
import type { Song, Playlist } from "@/types/music";
import { songToPlayerTrack } from "@/types/music";
import {
  usePlayerStore,
  useIsTrackCurrent,
} from "@/lib/stores/playerStore";
import { formatTime } from "@/lib/utils/format";
import { LikeButton } from "@/components/content/LikeButton";
import { TrackActionsMenu } from "@/components/content/TrackActionsMenu";
import { AddToPlaylistMenu } from "@/components/playlists/AddToPlaylistMenu";
import { COVER_SIZES } from "@/lib/images/coverSizes";

interface SongRowProps {
  song: Song;
  index?: number;
  queue?: Song[];
  playlists?: Playlist[];
  isAuthenticated?: boolean;
  showPlayNext?: boolean;
}

export const SongRow = memo(function SongRow({
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

  const handleClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      playTrack(track, trackList);
    }, 250);
  }, [playTrack, track, trackList]);

  const handleDoubleClick = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    const startIndex = index ?? trackList.findIndex((t) => t.id === song.id);
    playCollection(trackList, startIndex >= 0 ? startIndex : 0);
  }, [index, playCollection, song.id, trackList]);

  return (
    <div
      className={`song-row-compact-target group flex w-full items-center gap-4 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-surface-highlight hover:shadow-[inset_0_0_16px_rgba(0,255,159,0.04)] ${
        isCurrent ? "bg-surface-highlight/50 border-l-2 border-accent shadow-[inset_0_0_20px_rgba(0,255,159,0.06)]" : ""
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
        <span className="hidden w-6 text-center text-accent drop-shadow-[0_0_6px_rgba(0,255,159,0.5)] group-hover:block">▶</span>

        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
          <Image
            src={song.coverUrl}
            alt={song.albumTitle ?? song.title}
            fill
            sizes={COVER_SIZES.thumb}
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
      <TrackActionsMenu track={track} isAuthenticated={isAuthenticated} />
      <AddToPlaylistMenu
        songId={song.id}
        playlists={playlists}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
});
