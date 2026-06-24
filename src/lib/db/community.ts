import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbPlaylist, mapDbSong } from "@/lib/supabase/mappers";
import type { Playlist, Song } from "@/types/music";

export interface CommunityPlaylistHit extends Playlist {
  songCount: number;
  source: "community";
}

/** Playlists públicas o del usuario que coincidan con la búsqueda */
export async function searchCommunityPlaylists(
  query: string,
  limit = 12,
): Promise<CommunityPlaylistHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("playlists")
    .select("*, playlist_songs(song_id)")
    .or(`is_public.eq.true,name.ilike.%${q}%`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const pl = mapDbPlaylist(row);
    const songs = row.playlist_songs as unknown as { song_id: string }[] | null;
    return {
      ...pl,
      songCount: songs?.length ?? 0,
      source: "community" as const,
    };
  });
}

/** Canciones con más likes en la comunidad */
export async function getCommunityTrending(limit = 12): Promise<Song[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("liked_songs")
    .select("song_id, songs(*)");

  if (error) throw new Error(error.message);

  const counts = new Map<string, { count: number; song: Song }>();

  for (const row of data ?? []) {
    const raw = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
    if (!raw) continue;
    const song = mapDbSong(raw);
    const entry = counts.get(song.id) ?? { count: 0, song };
    entry.count += 1;
    counts.set(song.id, entry);
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((e) => e.song);
}

/** Últimos tracks indexados por la comunidad */
export async function getLatestDiscoveries(limit = 12): Promise<Song[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_catalog")
    .select("created_at, songs(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  const songs: Song[] = [];

  for (const row of data ?? []) {
    const raw = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
    if (!raw || seen.has(raw.id)) continue;
    seen.add(raw.id);
    songs.push(mapDbSong(raw));
  }

  return songs;
}
