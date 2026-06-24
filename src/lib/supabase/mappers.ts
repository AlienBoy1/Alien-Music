import type { Song } from "@/types/music";

interface DbSong {
  id: string;
  title: string;
  artist: string;
  album_title: string | null;
  duration: number;
  audio_url: string | null;
  cover_url: string;
  youtube_id: string | null;
  type?: "audio" | "video";
  lyrics?: string | null;
}

export function mapDbSong(row: DbSong): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    albumTitle: row.album_title,
    duration: row.duration,
    youtubeId: row.youtube_id,
    type: row.type ?? "audio",
    coverUrl: row.cover_url,
    audioUrl: row.audio_url,
    lyrics: row.lyrics ?? null,
  };
}

export interface DbPlaylist {
  id: string;
  name: string;
  user_id: string;
  description: string | null;
  is_public: boolean;
  is_collaborative?: boolean;
  created_at: string;
  updated_at: string;
}

export function mapDbPlaylist(row: DbPlaylist) {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    description: row.description,
    isPublic: row.is_public,
    isCollaborative: row.is_collaborative ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
