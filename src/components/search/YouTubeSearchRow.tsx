"use client";

import Image from "next/image";
import { Play, Video } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatTime } from "@/lib/utils/format";
import { TrackRowActions } from "@/components/content/TrackRowActions";
import type { YouTubeSearchItem } from "@/lib/youtube/types";
import type { PlayerTrack, Playlist } from "@/types/music";
import { youtubeItemToPlayerTrack } from "@/types/music";
import type { YouTubeAlbumItem } from "@/lib/youtube/types";
import { COVER_SIZES } from "@/lib/images/coverSizes";

interface YouTubeSearchRowProps {
  item: YouTubeSearchItem;
  track: PlayerTrack;
  index: number;
  allTracks: PlayerTrack[];
  playlists: Playlist[];
  youtubeAlbums?: YouTubeAlbumItem[];
  isAuthenticated: boolean;
  currentUserId?: string;
}

function kindLabelFor(item: YouTubeSearchItem): string {
  if (item.category === "podcast") return "Podcast";
  return "Canción";
}

export function YouTubeSearchRow({
  item,
  track,
  index,
  allTracks,
  playlists,
  youtubeAlbums = [],
  isAuthenticated,
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

  const kind = kindLabelFor(item);

  return (
    <div className="group flex w-full items-center gap-2 py-1 pl-1 pr-0 transition-colors hover:bg-white/5 md:rounded-lg md:px-2 md:py-2">
      <button
        type="button"
        onClick={handlePlay}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-surface-highlight">
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt={item.title}
              fill
              sizes={COVER_SIZES.row}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              ♪
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <p
            className={`truncate text-base md:text-sm ${
              isCurrent ? "font-medium text-accent" : "font-normal text-white"
            }`}
          >
            {item.title}
          </p>
          <p className="truncate text-sm text-neutral-400 md:text-xs">
            {kind} • {item.channelTitle}
          </p>
        </div>

        <span className="hidden shrink-0 text-xs text-text-muted lg:inline">
          {item.duration > 0 ? formatTime(item.duration) : "—"}
        </span>
      </button>

      <button
        type="button"
        onClick={handlePlayAsVideo}
        className="hidden shrink-0 rounded-full p-2 text-text-muted opacity-0 transition-all hover:bg-surface-highlight hover:text-alien-cyan group-hover:opacity-100 lg:block"
        title="Reproducir como video"
        aria-label="Reproducir como video"
      >
        <Video size={16} />
      </button>

      <button
        type="button"
        onClick={handlePlay}
        className="alien-btn-play hidden h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 lg:flex"
        aria-label={`Reproducir ${item.title}`}
      >
        <Play size={14} fill="currentColor" className="ml-0.5 text-black" />
      </button>

      <TrackRowActions
        track={track}
        playlists={playlists}
        youtubeAlbums={youtubeAlbums}
        isAuthenticated={isAuthenticated}
        layout="spotify"
        kindLabel={kind}
      />
    </div>
  );
}
