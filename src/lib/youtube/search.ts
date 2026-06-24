import type {
  SearchContentFilter,
  YouTubeContentKind,
  YouTubePlaylistItem,
  YouTubeSearchItem,
  YouTubeSearchListResponse,
  YouTubeVideosListResponse,
  YouTubePlaylistsListResponse,
  YouTubeSnippet,
  YouTubeThumbnails,
} from "./types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const MUSIC_CATEGORY_ID = "10";
const PODCAST_MIN_DURATION = 20 * 60;
const DEFAULT_MAX_RESULTS = 25;

/** Convierte duración ISO 8601 de YouTube (PT4M13S) a segundos */
export function parseYouTubeDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function pickThumbnail(thumbnails?: YouTubeThumbnails): string {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ""
  );
}

export interface SearchYouTubeOptions {
  query: string;
  filter?: SearchContentFilter;
  maxResults?: number;
  pageToken?: string;
  apiKey: string;
}

function buildSearchQuery(query: string, filter: SearchContentFilter): string {
  if (filter === "podcasts") {
    return `${query} podcast`.trim();
  }
  return query.trim();
}

function resolveKind(
  filter: SearchContentFilter,
  duration: number,
): YouTubeContentKind {
  if (filter === "podcasts" || duration >= PODCAST_MIN_DURATION) {
    return "podcast";
  }
  if (filter === "videos") return "video";
  return "song";
}

async function enrichVideos(
  videoIds: string[],
  apiKey: string,
  filter: SearchContentFilter,
  snippets: Map<string, YouTubeSnippet | undefined>,
): Promise<YouTubeSearchItem[]> {
  if (videoIds.length === 0) return [];

  const videoParams = new URLSearchParams({
    part: "contentDetails,snippet",
    id: videoIds.join(","),
    key: apiKey,
  });

  const videosRes = await fetch(
    `${YOUTUBE_API_BASE}/videos?${videoParams.toString()}`,
    { next: { revalidate: 300 } },
  );

  if (!videosRes.ok) {
    throw new Error(`YouTube videos lookup failed (${videosRes.status})`);
  }

  const videosData = (await videosRes.json()) as YouTubeVideosListResponse;
  const items: YouTubeSearchItem[] = [];

  for (const video of videosData.items ?? []) {
    if (!video.id) continue;
    const duration = parseYouTubeDuration(video.contentDetails?.duration ?? "");
    const snippet = video.snippet ?? snippets.get(video.id);

    if (filter === "podcasts" && duration < PODCAST_MIN_DURATION) continue;
    if (filter === "songs" && duration >= PODCAST_MIN_DURATION) continue;

    const kind = resolveKind(filter, duration);

    items.push({
      youtubeId: video.id,
      title: snippet?.title ?? "Sin título",
      channelTitle: snippet?.channelTitle ?? "Desconocido",
      thumbnailUrl: pickThumbnail(snippet?.thumbnails),
      duration,
      publishedAt: snippet?.publishedAt,
      kind,
      category: kind === "podcast" ? "podcast" : "music",
    });
  }

  return items;
}

async function searchVideos(
  query: string,
  filter: SearchContentFilter,
  apiKey: string,
  maxResults: number,
  pageToken?: string,
) {
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: buildSearchQuery(query, filter),
    type: "video",
    maxResults: String(Math.min(maxResults, 50)),
    key: apiKey,
  });

  if (pageToken) searchParams.set("pageToken", pageToken);

  if (filter === "songs") {
    searchParams.set("videoCategoryId", MUSIC_CATEGORY_ID);
  }

  if (filter === "podcasts") {
    searchParams.set("videoDuration", "long");
  }

  const searchRes = await fetch(
    `${YOUTUBE_API_BASE}/search?${searchParams.toString()}`,
    { next: { revalidate: 60 } },
  );

  if (!searchRes.ok) {
    const body = (await searchRes.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      body.error?.message ?? `YouTube search failed (${searchRes.status})`,
    );
  }

  const searchData = (await searchRes.json()) as YouTubeSearchListResponse;

  if (searchData.error) {
    throw new Error(searchData.error.message ?? "YouTube API error");
  }

  const snippetMap = new Map<string, YouTubeSnippet | undefined>();
  const videoIds: string[] = [];

  for (const item of searchData.items ?? []) {
    const id = item.id?.videoId;
    if (!id) continue;
    videoIds.push(id);
    snippetMap.set(id, item.snippet);
  }

  const items = await enrichVideos(videoIds, apiKey, filter, snippetMap);

  return { items, nextPageToken: searchData.nextPageToken };
}

async function searchYouTubePlaylists(
  query: string,
  apiKey: string,
  maxResults: number,
  pageToken?: string,
) {
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: query.trim(),
    type: "playlist",
    maxResults: String(Math.min(maxResults, 50)),
    key: apiKey,
  });

  if (pageToken) searchParams.set("pageToken", pageToken);

  const searchRes = await fetch(
    `${YOUTUBE_API_BASE}/search?${searchParams.toString()}`,
    { next: { revalidate: 120 } },
  );

  if (!searchRes.ok) {
    throw new Error(`YouTube playlist search failed (${searchRes.status})`);
  }

  const searchData = (await searchRes.json()) as YouTubeSearchListResponse;
  const playlistIds = (searchData.items ?? [])
    .map((i) => i.id?.playlistId)
    .filter((id): id is string => Boolean(id));

  if (playlistIds.length === 0) {
    return {
      playlists: [] as YouTubePlaylistItem[],
      nextPageToken: searchData.nextPageToken,
    };
  }

  const listParams = new URLSearchParams({
    part: "snippet,contentDetails",
    id: playlistIds.join(","),
    key: apiKey,
  });

  const listRes = await fetch(
    `${YOUTUBE_API_BASE}/playlists?${listParams.toString()}`,
    { next: { revalidate: 300 } },
  );

  const listData = (await listRes.json()) as YouTubePlaylistsListResponse;
  const playlists: YouTubePlaylistItem[] = (listData.items ?? []).map((pl) => ({
    playlistId: pl.id ?? "",
    title: pl.snippet?.title ?? "Playlist",
    channelTitle: pl.snippet?.channelTitle ?? "",
    thumbnailUrl: pickThumbnail(pl.snippet?.thumbnails),
    itemCount: pl.contentDetails?.itemCount,
    source: "youtube" as const,
  }));

  return { playlists, nextPageToken: searchData.nextPageToken };
}

/** Busca playlists tipo álbum en YouTube */
async function searchYouTubeAlbums(
  query: string,
  apiKey: string,
  maxResults: number,
) {
  const { playlists } = await searchYouTubePlaylists(
    `${query.trim()} album`,
    apiKey,
    Math.min(maxResults, 12),
  );

  const albums = playlists
    .filter((pl) => {
      const t = pl.title.toLowerCase();
      return (
        t.includes("album") ||
        t.includes("álbum") ||
        t.includes("full") ||
        t.includes("complete") ||
        (pl.itemCount ?? 0) >= 4
      );
    })
    .map((pl) => ({
      playlistId: pl.playlistId,
      title: pl.title.replace(/\s*[-–|]\s*full album.*/i, "").trim(),
      artist: pl.channelTitle,
      thumbnailUrl: pl.thumbnailUrl,
      itemCount: pl.itemCount,
    }));

  return albums.slice(0, 8);
}

/**
 * Búsqueda unificada en YouTube con filtros y paginación.
 */
export async function searchYouTubeContent({
  query,
  filter = "all",
  maxResults = DEFAULT_MAX_RESULTS,
  pageToken,
  apiKey,
}: SearchYouTubeOptions) {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: trimmed,
      filter,
      items: [] as YouTubeSearchItem[],
      youtubePlaylists: [] as YouTubePlaylistItem[],
      youtubeAlbums: [] as import("./types").YouTubeAlbumItem[],
    };
  }

  if (filter === "playlists") {
    const { playlists, nextPageToken } = await searchYouTubePlaylists(
      trimmed,
      apiKey,
      maxResults,
      pageToken,
    );
    return {
      query: trimmed,
      filter,
      items: [],
      youtubePlaylists: playlists,
      youtubeAlbums: [],
      nextPageToken,
    };
  }

  const effectiveFilter: SearchContentFilter =
    filter === "all" ? "all" : filter;

  const [{ items, nextPageToken }, youtubeAlbums] = await Promise.all([
    searchVideos(
      trimmed,
      effectiveFilter === "all" ? "all" : effectiveFilter,
      apiKey,
      maxResults,
      pageToken,
    ),
    !pageToken && (filter === "all" || filter === "songs")
      ? searchYouTubeAlbums(trimmed, apiKey, maxResults)
      : Promise.resolve([] as import("./types").YouTubeAlbumItem[]),
  ]);

  return {
    query: trimmed,
    filter,
    items,
    youtubePlaylists: [] as YouTubePlaylistItem[],
    youtubeAlbums,
    nextPageToken,
  };
}

/** Videos relacionados para Smart Autoplay */
export async function getRelatedYouTubeVideos(
  videoId: string,
  apiKey: string,
  maxResults = 5,
): Promise<YouTubeSearchItem[]> {
  const searchParams = new URLSearchParams({
    part: "snippet",
    relatedToVideoId: videoId,
    type: "video",
    maxResults: String(maxResults),
    key: apiKey,
  });

  const searchRes = await fetch(
    `${YOUTUBE_API_BASE}/search?${searchParams.toString()}`,
    { next: { revalidate: 120 } },
  );

  if (!searchRes.ok) return [];

  const searchData = (await searchRes.json()) as YouTubeSearchListResponse;
  const snippetMap = new Map<string, YouTubeSnippet | undefined>();
  const videoIds: string[] = [];

  for (const item of searchData.items ?? []) {
    const id = item.id?.videoId;
    if (!id || id === videoId) continue;
    videoIds.push(id);
    snippetMap.set(id, item.snippet);
  }

  return enrichVideos(videoIds, apiKey, "all", snippetMap);
}
