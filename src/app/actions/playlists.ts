"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult<T = void> = { error?: string; data?: T };

export async function createPlaylist(name?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Debes iniciar sesión" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("playlists")
    .insert({
      name: name?.trim() || "Nueva playlist",
      user_id: session.user.id,
      description: null,
      is_public: false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/playlists");
  return { data: { id: data.id as string } };
}

export async function updatePlaylist(
  playlistId: string,
  updates: { name?: string; description?: string; isPublic?: boolean },
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;

  const { error } = await supabase
    .from("playlists")
    .update(payload)
    .eq("id", playlistId)
    .eq("user_id", session.user.id);

  if (error) return { error: error.message };

  revalidatePath(`/playlists/${playlistId}`);
  revalidatePath("/playlists");
  return { success: true };
}

export async function deletePlaylist(playlistId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId)
    .eq("user_id", session.user.id);

  if (error) return { error: error.message };

  revalidatePath("/playlists");
  return { success: true };
}

export async function addSongToPlaylist(
  playlistId: string,
  songId: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();

  const { data: playlist } = await supabase
    .from("playlists")
    .select("id")
    .eq("id", playlistId)
    .eq("user_id", session.user.id)
    .single();

  if (!playlist) return { error: "Playlist no encontrada" };

  const { count } = await supabase
    .from("playlist_songs")
    .select("*", { count: "exact", head: true })
    .eq("playlist_id", playlistId);

  const { error } = await supabase.from("playlist_songs").upsert(
    {
      playlist_id: playlistId,
      song_id: songId,
      position: count ?? 0,
    },
    { onConflict: "playlist_id,song_id" },
  );

  if (error) return { error: error.message };

  revalidatePath(`/playlists/${playlistId}`);
  revalidatePath("/playlists");
  return { success: true };
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);

  if (error) return { error: error.message };

  revalidatePath(`/playlists/${playlistId}`);
  return { success: true };
}

export async function reorderPlaylistSong(
  playlistId: string,
  songId: string,
  newPosition: number,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("playlist_songs")
    .update({ position: newPosition })
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);

  if (error) return { error: error.message };

  revalidatePath(`/playlists/${playlistId}`);
  return { success: true };
}
