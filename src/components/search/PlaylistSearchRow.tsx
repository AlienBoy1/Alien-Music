"use client";

import Image from "next/image";
import Link from "next/link";
import { ListMusic } from "lucide-react";
import type { CommunityPlaylistHit } from "@/lib/db/community";
import type { YouTubePlaylistItem } from "@/lib/youtube/types";

interface PlaylistSearchRowProps {
  community?: CommunityPlaylistHit;
  youtube?: YouTubePlaylistItem;
}

export function PlaylistSearchRow({ community, youtube }: PlaylistSearchRowProps) {
  if (community) {
    return (
      <Link
        href={`/playlists/${community.id}`}
        className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-all duration-200 hover:bg-surface-highlight"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-highlight text-accent">
          <ListMusic size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium group-hover:text-accent">
            {community.name}
          </p>
          <p className="truncate text-xs text-text-muted">
            Comunidad · {community.songCount} canciones
            {community.isPublic ? " · Pública" : ""}
          </p>
        </div>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
          Comunidad
        </span>
      </Link>
    );
  }

  if (youtube) {
    return (
      <a
        href={`https://www.youtube.com/playlist?list=${youtube.playlistId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-all duration-200 hover:bg-surface-highlight"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
          {youtube.thumbnailUrl ? (
            <Image
              src={youtube.thumbnailUrl}
              alt={youtube.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-highlight">
              <ListMusic size={20} className="text-text-muted" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium group-hover:text-accent">
            {youtube.title}
          </p>
          <p className="truncate text-xs text-text-muted">
            YouTube · {youtube.channelTitle}
            {youtube.itemCount != null ? ` · ${youtube.itemCount} videos` : ""}
          </p>
        </div>
        <span className="rounded-full bg-alien-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-alien-cyan">
          YouTube
        </span>
      </a>
    );
  }

  return null;
}
