"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { YouTubeSearchRow } from "@/components/search/YouTubeSearchRow";
import { usePlayerStore } from "@/lib/stores/playerStore";
import type { YouTubeSearchItem } from "@/lib/youtube/types";
import type { PlayerTrack, Playlist } from "@/types/music";
import { youtubeItemToPlayerTrack } from "@/types/music";
import { COVER_SIZES } from "@/lib/images/coverSizes";

interface AlbumMeta {
  playlistId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  itemCount?: number;
}

interface AlbumPageClientProps {
  playlistId: string;
  playlists?: Playlist[];
  isAuthenticated?: boolean;
}

export function AlbumPageClient({
  playlistId,
  playlists = [],
  isAuthenticated = false,
}: AlbumPageClientProps) {
  const playCollection = usePlayerStore((s) => s.playCollection);
  const [meta, setMeta] = useState<AlbumMeta | null>(null);
  const [items, setItems] = useState<YouTubeSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch(`/api/youtube/playlist/${encodeURIComponent(playlistId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "No se pudo cargar el álbum");
        }
        return res.json() as Promise<{ meta: AlbumMeta; items: YouTubeSearchItem[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setMeta(data.meta);
        setItems(data.items);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar el álbum");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  const albumContext = useMemo(
    () =>
      meta
        ? { title: meta.title, playlistId: meta.playlistId }
        : undefined,
    [meta],
  );

  const tracks: PlayerTrack[] = useMemo(
    () =>
      items.map((item) => youtubeItemToPlayerTrack(item, "audio", albumContext)),
    [items, albumContext],
  );

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    playCollection(tracks, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-8">
        <div className="alien-loader" />
        <p className="text-sm text-text-muted">Cargando álbum...</p>
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="p-8">
        <p className="text-red-400">{error ?? "Álbum no encontrado"}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader title={meta.title} subtitle={meta.channelTitle} showFeedback={false} />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-lg shadow-2xl sm:h-56 sm:w-56">
          {meta.thumbnailUrl ? (
            <Image
              src={meta.thumbnailUrl}
              alt={meta.title}
              fill
              sizes={COVER_SIZES.hero}
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface-highlight text-4xl">
              ♪
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-wider text-text-muted">Álbum</p>
          <p className="text-sm text-text-muted">
            {meta.itemCount ?? items.length} canciones
          </p>
          <button
            type="button"
            onClick={handlePlayAll}
            disabled={tracks.length === 0}
            className="alien-btn-primary inline-flex w-fit items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            <Play size={18} fill="currentColor" />
            Reproducir
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {items.map((item, index) => (
          <YouTubeSearchRow
            key={item.youtubeId}
            item={item}
            track={tracks[index]}
            index={index}
            allTracks={tracks}
            playlists={playlists}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
}
