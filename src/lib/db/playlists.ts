import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbPlaylist, mapDbSong } from "@/lib/supabase/mappers";
import type { Playlist, PlaylistWithSongs } from "@/types/music";

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDbPlaylist);
}

export async function getPlaylistById(
  playlistId: string,
  userId: string,
): Promise<PlaylistWithSongs | null> {
  const supabase = createAdminClient();
  const { data: playlist, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .eq("user_id", userId)
    .single();

  if (error || !playlist) return null;

  const { data: rows, error: songsError } = await supabase
    .from("playlist_songs")
    .select("position, songs(*)")
    .eq("playlist_id", playlistId)
    .order("position");

  if (songsError) throw new Error(songsError.message);

  const songs = (rows ?? [])
    .map((row) => {
      const song = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
      return song ? mapDbSong(song) : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    ...mapDbPlaylist(playlist),
    songs,
  };
}
