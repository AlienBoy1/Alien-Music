import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbSong } from "@/lib/supabase/mappers";
import type { Song, SearchResult } from "@/types/music";

export async function getSongs(): Promise<Song[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("artist")
    .order("title");

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDbSong);
}

export async function getSongById(id: string): Promise<Song | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapDbSong(data);
}

export async function getSongsByAlbum(
  albumTitle: string,
  artist: string,
): Promise<Song[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("album_title", albumTitle)
    .eq("artist", artist)
    .order("title");

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDbSong);
}

export interface AlbumGroup {
  albumTitle: string;
  artist: string;
  coverUrl: string;
  songs: Song[];
}

/** Agrupa canciones por álbum para la grilla del home */
export async function getAlbumGroups(): Promise<AlbumGroup[]> {
  const songs = await getSongs();
  const map = new Map<string, AlbumGroup>();

  for (const song of songs) {
    const key = `${song.artist}::${song.albumTitle ?? song.title}`;
    const existing = map.get(key);
    if (existing) {
      existing.songs.push(song);
    } else {
      map.set(key, {
        albumTitle: song.albumTitle ?? song.title,
        artist: song.artist,
        coverUrl: song.coverUrl,
        songs: [song],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.artist.localeCompare(b.artist),
  );
}

export async function searchSongs(query: string): Promise<SearchResult> {
  const q = query.trim().toLowerCase();
  if (!q) return { songs: [], artists: [], albums: [] };

  const all = await getSongs();
  const songs = all.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.albumTitle?.toLowerCase().includes(q) ?? false),
  );

  const artistSet = new Set(songs.map((s) => s.artist));
  const albumMap = new Map<string, { title: string; artist: string; coverUrl: string }>();

  for (const s of songs) {
    const key = `${s.artist}::${s.albumTitle}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, {
        title: s.albumTitle ?? s.title,
        artist: s.artist,
        coverUrl: s.coverUrl,
      });
    }
  }

  return {
    songs,
    artists: Array.from(artistSet),
    albums: Array.from(albumMap.values()),
  };
}

export async function getLikedSongIds(userId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("liked_songs")
    .select("song_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.song_id);
}

export async function getLikedSongs(userId: string): Promise<Song[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("liked_songs")
    .select("song_id, songs(*)")
    .eq("user_id", userId)
    .order("liked_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => {
      const song = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
      return song ? mapDbSong(song) : null;
    })
    .filter((s): s is Song => s !== null);
}

/** Últimas canciones escuchadas por el usuario (máx. 10) */
export async function getRecentlyPlayed(userId: string, limit = 10): Promise<Song[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recently_played")
    .select("played_at, songs(*)")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => {
      const song = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
      return song ? mapDbSong(song) : null;
    })
    .filter((s): s is Song => s !== null);
}
