import type { YouTubeSearchItem, YouTubeSnippet, YouTubeThumbnails } from "./types";
import { parseYouTubeDuration } from "./search";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

function pickThumbnail(thumbnails?: YouTubeThumbnails): string {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ""
  );
}

interface PlaylistItemsListResponse {
  items?: Array<{
    contentDetails?: { videoId?: string };
    snippet?: YouTubeSnippet;
  }>;
  nextPageToken?: string;
}

interface VideosListResponse {
  items?: Array<{
    id?: string;
    contentDetails?: { duration?: string };
    snippet?: YouTubeSnippet;
  }>;
}

/**
 * Obtiene los videos de una playlist de YouTube (p. ej. álbum).
 */
export async function getYouTubePlaylistItems(
  playlistId: string,
  apiKey: string,
  maxItems = 50,
): Promise<YouTubeSearchItem[]> {
  const videoIds: string[] = [];
  const snippetMap = new Map<string, YouTubeSnippet | undefined>();
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `${YOUTUBE_API_BASE}/playlistItems?${params.toString()}`,
      { next: { revalidate: 300 } },
    );

    if (!res.ok) break;

    const data = (await res.json()) as PlaylistItemsListResponse;

    for (const item of data.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (!id) continue;
      videoIds.push(id);
      snippetMap.set(id, item.snippet);
      if (videoIds.length >= maxItems) break;
    }

    if (videoIds.length >= maxItems) break;
    pageToken = data.nextPageToken;
  } while (pageToken);

  if (videoIds.length === 0) return [];

  const uniqueIds = [...new Set(videoIds)].slice(0, maxItems);
  const videoParams = new URLSearchParams({
    part: "contentDetails,snippet",
    id: uniqueIds.join(","),
    key: apiKey,
  });

  const videosRes = await fetch(
    `${YOUTUBE_API_BASE}/videos?${videoParams.toString()}`,
    { next: { revalidate: 300 } },
  );

  if (!videosRes.ok) return [];

  const videosData = (await videosRes.json()) as VideosListResponse;
  const items: YouTubeSearchItem[] = [];

  for (const video of videosData.items ?? []) {
    if (!video.id) continue;
    const snippet = video.snippet ?? snippetMap.get(video.id);
    const duration = parseYouTubeDuration(video.contentDetails?.duration ?? "");

    items.push({
      youtubeId: video.id,
      title: snippet?.title ?? "Sin título",
      channelTitle: snippet?.channelTitle ?? "Desconocido",
      thumbnailUrl: pickThumbnail(snippet?.thumbnails),
      duration,
      publishedAt: snippet?.publishedAt,
      kind: duration >= 20 * 60 ? "podcast" : "song",
      category: duration >= 20 * 60 ? "podcast" : "music",
    });
  }

  return items;
}

export interface YouTubePlaylistMeta {
  playlistId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  itemCount?: number;
}

export async function getYouTubePlaylistMeta(
  playlistId: string,
  apiKey: string,
): Promise<YouTubePlaylistMeta | null> {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: playlistId,
    key: apiKey,
  });

  const res = await fetch(
    `${YOUTUBE_API_BASE}/playlists?${params.toString()}`,
    { next: { revalidate: 600 } },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    items?: Array<{
      id?: string;
      snippet?: YouTubeSnippet;
      contentDetails?: { itemCount?: number };
    }>;
  };

  const pl = data.items?.[0];
  if (!pl?.id) return null;

  return {
    playlistId: pl.id,
    title: pl.snippet?.title ?? "Álbum",
    channelTitle: pl.snippet?.channelTitle ?? "",
    thumbnailUrl: pickThumbnail(pl.snippet?.thumbnails),
    itemCount: pl.contentDetails?.itemCount,
  };
}
