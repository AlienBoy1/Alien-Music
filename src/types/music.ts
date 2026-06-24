export type MediaType = "audio" | "video";
export type TrackCategory = "music" | "podcast";

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  duration: number;
  youtubeId: string | null;
  type: MediaType;
  coverUrl: string;
  /** Legacy: MP3 directo. Opcional tras migración YouTube. */
  audioUrl?: string | null;
  /** Letra en texto plano (beta) */
  lyrics?: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  description: string | null;
  isPublic: boolean;
  isCollaborative: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export type RepeatMode = "off" | "all" | "one";

/** Formato interno del reproductor */
export interface PlayerTrack {
  id: string;
  youtubeId: string;
  title: string;
  artistName: string;
  albumTitle: string;
  coverUrl: string;
  duration: number;
  type: MediaType;
  category?: TrackCategory;
  /** true si viene de búsqueda YouTube y aún no está en Supabase */
  isEphemeral?: boolean;
  /** Legacy fallback para canciones seed sin youtube_id */
  audioUrl?: string | null;
  /** Playlist de YouTube que representa el álbum (para navegación) */
  albumPlaylistId?: string;
}

export interface CommunityCatalogEntry {
  id: string;
  songId: string;
  userId: string;
  createdAt: string;
}

/** ID temporal para pistas de YouTube no indexadas */
export function ephemeralTrackId(youtubeId: string): string {
  return `yt:${youtubeId}`;
}

export function isEphemeralTrackId(id: string): boolean {
  return id.startsWith("yt:");
}

export function songToPlayerTrack(song: Song): PlayerTrack {
  const youtubeId = song.youtubeId ?? "";
  return {
    id: song.id,
    youtubeId,
    title: song.title,
    artistName: song.artist,
    albumTitle: song.albumTitle ?? "",
    coverUrl: song.coverUrl,
    duration: song.duration,
    type: song.type,
    isEphemeral: false,
    audioUrl: song.audioUrl,
  };
}

export function youtubeItemToPlayerTrack(
  item: import("@/lib/youtube/types").YouTubeSearchItem,
  type: MediaType = "audio",
  album?: { title: string; playlistId: string },
): PlayerTrack {
  return {
    id: ephemeralTrackId(item.youtubeId),
    youtubeId: item.youtubeId,
    title: item.title,
    artistName: item.channelTitle,
    albumTitle: album?.title ?? item.title,
    albumPlaylistId: album?.playlistId,
    coverUrl: item.thumbnailUrl,
    duration: item.duration,
    type: item.kind === "video" ? "video" : type,
    category: item.category,
    isEphemeral: true,
  };
}

export interface SearchResult {
  songs: Song[];
  artists: string[];
  albums: { title: string; artist: string; coverUrl: string }[];
}

/** Resultados híbridos: catálogo local + YouTube */
export interface HybridSearchResult extends SearchResult {
  youtube: import("@/lib/youtube/types").YouTubeSearchItem[];
}
