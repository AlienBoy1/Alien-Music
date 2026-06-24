/** Filtros de contenido en búsqueda */
export type SearchContentFilter =
  | "all"
  | "songs"
  | "videos"
  | "playlists"
  | "podcasts";

export type YouTubeContentKind = "song" | "video" | "podcast";

/** Video / audio indexable desde YouTube */
export interface YouTubeSearchItem {
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: number;
  publishedAt?: string;
  kind: YouTubeContentKind;
  category: "music" | "podcast";
}

export interface YouTubePlaylistItem {
  playlistId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  itemCount?: number;
  source: "youtube";
}

export interface YouTubeSearchResponse {
  query: string;
  filter: SearchContentFilter;
  items: YouTubeSearchItem[];
  youtubePlaylists: YouTubePlaylistItem[];
  nextPageToken?: string;
}

/** Miniatura de YouTube */
export interface YouTubeThumbnails {
  maxres?: { url?: string };
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
}

export interface YouTubeSnippet {
  title?: string;
  channelTitle?: string;
  publishedAt?: string;
  thumbnails?: YouTubeThumbnails;
}

/** Respuesta cruda de search.list */
export interface YouTubeSearchListResponse {
  items?: Array<{
    id?: {
      videoId?: string;
      playlistId?: string;
    };
    snippet?: YouTubeSnippet;
  }>;
  nextPageToken?: string;
  error?: { message?: string; code?: number };
}

/** Respuesta cruda de videos.list */
export interface YouTubeVideosListResponse {
  items?: Array<{
    id?: string;
    contentDetails?: {
      duration?: string;
      itemCount?: number;
    };
    snippet?: YouTubeSnippet;
  }>;
  error?: { message?: string; code?: number };
}

/** Respuesta cruda de playlists.list */
export interface YouTubePlaylistsListResponse {
  items?: Array<{
    id?: string;
    contentDetails?: { itemCount?: number };
    snippet?: YouTubeSnippet;
  }>;
  error?: { message?: string; code?: number };
}
