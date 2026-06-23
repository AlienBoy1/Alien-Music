export interface Song {
  id: string;
  title: string;
  artist: string;
  albumTitle: string | null;
  duration: number;
  audioUrl: string;
  coverUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export type RepeatMode = "off" | "all" | "one";

/** Formato interno del reproductor (compatible con Song) */
export interface PlayerTrack {
  id: string;
  title: string;
  artistName: string;
  albumTitle: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
}

export function songToPlayerTrack(song: Song): PlayerTrack {
  return {
    id: song.id,
    title: song.title,
    artistName: song.artist,
    albumTitle: song.albumTitle ?? "",
    coverUrl: song.coverUrl,
    audioUrl: song.audioUrl,
    duration: song.duration,
  };
}

export interface SearchResult {
  songs: Song[];
  artists: string[];
  albums: { title: string; artist: string; coverUrl: string }[];
}
