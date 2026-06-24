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

/** Playlists propias + colaborativas públicas de otros usuarios */
export async function getWritablePlaylists(userId: string): Promise<Playlist[]> {
  const supabase = createAdminClient();

  const [{ data: own, error: ownError }, { data: collab, error: collabError }] =
    await Promise.all([
      supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("playlists")
        .select("*")
        .eq("is_collaborative", true)
        .eq("is_public", true)
        .neq("user_id", userId)
        .order("updated_at", { ascending: false }),
    ]);

  if (ownError) throw new Error(ownError.message);
  if (collabError) throw new Error(collabError.message);

  const merged = [...(own ?? []), ...(collab ?? [])].map(mapDbPlaylist);
  const seen = new Set<string>();
  return merged.filter((pl) => {
    if (seen.has(pl.id)) return false;
    seen.add(pl.id);
    return true;
  });
}

export interface PlaylistView extends PlaylistWithSongs {
  canEdit: boolean;
  canContribute: boolean;
}

export async function getPlaylistForViewer(
  playlistId: string,
  viewerId?: string,
): Promise<PlaylistView | null> {
  const supabase = createAdminClient();
  const { data: playlist, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .maybeSingle();

  if (error || !playlist) return null;

  const isOwner = viewerId != null && playlist.user_id === viewerId;
  const isPublic = Boolean(playlist.is_public);
  const isCollaborative = Boolean(playlist.is_collaborative);

  if (!isOwner && !isPublic) return null;

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

  const canContribute =
    isOwner ||
    (isCollaborative && viewerId != null);

  return {
    ...mapDbPlaylist(playlist),
    songs,
    canEdit: isOwner,
    canContribute,
  };
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
