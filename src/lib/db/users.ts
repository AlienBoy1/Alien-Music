import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbPlaylist, mapDbSong } from "@/lib/supabase/mappers";
import type { Playlist, Song } from "@/types/music";

export interface PublicUserProfile {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  indexedSongs: Song[];
  publicPlaylists: Playlist[];
  contributorPlaylistCount: number;
}

export async function getPublicUserProfile(
  userId: string,
): Promise<PublicUserProfile | null> {
  const supabase = createAdminClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, image, username")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user) return null;

  const { data: catalogRows } = await supabase
    .from("community_catalog")
    .select("created_at, songs(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const indexedSongs: Song[] = [];
  const seen = new Set<string>();
  for (const row of catalogRows ?? []) {
    const raw = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
    if (!raw || seen.has(raw.id)) continue;
    seen.add(raw.id);
    indexedSongs.push(mapDbSong(raw));
  }

  const { data: playlistRows } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  const { count: contributorCount } = await supabase
    .from("playlist_contributors")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    id: user.id as string,
    name: user.name as string | null,
    username: user.username as string | null,
    image: user.image as string | null,
    indexedSongs,
    publicPlaylists: (playlistRows ?? []).map(mapDbPlaylist),
    contributorPlaylistCount: contributorCount ?? 0,
  };
}

/** Verifica si el usuario puede añadir canciones a la playlist */
export async function canContributeToPlaylist(
  playlistId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("playlists")
    .select("user_id, is_collaborative")
    .eq("id", playlistId)
    .maybeSingle();

  if (!data) return false;
  if (data.user_id === userId) return true;
  return Boolean(data.is_collaborative);
}

export async function registerPlaylistContributor(
  playlistId: string,
  userId: string,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("playlist_contributors").upsert(
    { playlist_id: playlistId, user_id: userId },
    { onConflict: "playlist_id,user_id" },
  );
}
