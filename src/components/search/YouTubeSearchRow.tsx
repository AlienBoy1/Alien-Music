"use client";

import Image from "next/image";
import { Play, Video } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatTime } from "@/lib/utils/format";
import { EphemeralLikeButton } from "@/components/search/EphemeralLikeButton";
import { EphemeralPlaylistMenu } from "@/components/search/EphemeralPlaylistMenu";
import { DownloadButton } from "@/components/offline/DownloadButton";
import type { YouTubeSearchItem } from "@/lib/youtube/types";
import type { PlayerTrack, Playlist } from "@/types/music";
import { youtubeItemToPlayerTrack } from "@/types/music";
import { COVER_SIZES } from "@/lib/images/coverSizes";

interface YouTubeSearchRowProps {
  item: YouTubeSearchItem;
  track: PlayerTrack;
  index: number;
  allTracks: PlayerTrack[];
  playlists: Playlist[];
  isAuthenticated: boolean;
  currentUserId?: string;
}

export function YouTubeSearchRow({
  item,
  track,
  index,
  allTracks,
  playlists,
  isAuthenticated,
  currentUserId,
}: YouTubeSearchRowProps) {
  const playCollection = usePlayerStore((s) => s.playCollection);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isCurrent =
    currentTrack?.youtubeId === item.youtubeId && isPlaying;

  const handlePlay = () => {
    const playTrack =
      item.category === "podcast"
        ? youtubeItemToPlayerTrack(item, "audio")
        : track;
    const queue = allTracks.map((t, idx) => (idx === index ? playTrack : t));
    playCollection(queue, index);
  };

  const handlePlayAsVideo = () => {
    const videoTrack = youtubeItemToPlayerTrack(item, "video");
    const videoQueue = allTracks.map((t) =>
      t.youtubeId === item.youtubeId ? videoTrack : t,
    );
    playCollection(videoQueue, index);
  };

  return (
    <div className="group flex w-full items-center gap-4 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-surface-highlight hover:shadow-[inset_0_0_16px_rgba(0,255,159,0.04)]">
      <button
        type="button"
        onClick={handlePlay}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <span className="w-6 text-center text-sm text-text-muted group-hover:hidden">
          {isCurrent ? (
            <span className="text-accent">♪</span>
          ) : (
            index + 1
          )}
        </span>
        <span className="hidden w-6 text-center text-accent drop-shadow-[0_0_6px_rgba(0,255,159,0.5)] group-hover:block">
          ▶
        </span>

        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              sizes={COVER_SIZES.row}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-highlight text-text-muted">
              ♪
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm ${
              isCurrent ? "font-medium text-accent alien-glow-text" : ""
            }`}
          >
            {item.title}
          </p>
          <p className="truncate text-xs text-text-muted">
            {item.channelTitle}
            {item.category === "podcast" && (
              <span className="ml-2 rounded bg-alien-purple/20 px-1.5 py-0.5 text-[10px] text-alien-purple">
                Podcast
              </span>
            )}
          </p>
        </div>

        <span className="hidden text-xs text-text-muted sm:inline">
          {item.duration > 0 ? formatTime(item.duration) : "—"}
        </span>
      </button>

      <button
        type="button"
        onClick={handlePlayAsVideo}
        className="hidden rounded-full p-2 text-text-muted opacity-0 transition-all hover:bg-surface-highlight hover:text-alien-cyan group-hover:opacity-100 md:block"
        title="Reproducir como video"
        aria-label="Reproducir como video"
      >
        <Video size={16} />
      </button>

      <button
        type="button"
        onClick={handlePlay}
        className="alien-btn-play flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={`Reproducir ${item.title}`}
      >
        <Play size={14} fill="currentColor" className="ml-0.5 text-black" />
      </button>

      <EphemeralLikeButton track={track} />
      <DownloadButton track={track} />
      <EphemeralPlaylistMenu
        track={track}
        playlists={playlists}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
      />
    </div>
  );
}
