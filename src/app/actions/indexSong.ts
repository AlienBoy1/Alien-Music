"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { canContributeToPlaylist } from "@/lib/db/users";
import { addSongToPlaylist } from "@/app/actions/playlists";
import type { PlayerTrack } from "@/types/music";
import type { ActionResult } from "@/app/actions/playlists";

export interface IndexSongOptions {
  /** Si se indica, indexa y añade la pista a una playlist colaborativa (o propia) */
  playlistId?: string;
}

/**
 * Indexa una pista de YouTube en el catálogo comunitario.
 * Idempotente por youtube_id. Opcionalmente la añade a una playlist.
 */
export async function indexSong(
  track: PlayerTrack,
  options?: IndexSongOptions,
): Promise<ActionResult<{ songId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Debes iniciar sesión para indexar canciones" };
  }

  if (!track.youtubeId) {
    return { error: "La pista no tiene youtube_id" };
  }

  const playlistId = options?.playlistId;
  if (playlistId) {
    const allowed = await canContributeToPlaylist(
      playlistId,
      session.user.id,
    );
    if (!allowed) {
      return { error: "No puedes añadir canciones a esta playlist" };
    }
  }

  const supabase = createAdminClient();
  const userId = session.user.id;

  const { data: existing } = await supabase
    .from("songs")
    .select("id")
    .eq("youtube_id", track.youtubeId)
    .maybeSingle();

  let songId: string;

  if (existing?.id) {
    songId = existing.id as string;
  } else {
    const { data: inserted, error } = await supabase
      .from("songs")
      .insert({
        title: track.title,
        artist: track.artistName,
        album_title: track.albumTitle || track.title,
        duration: Math.round(track.duration) || 0,
        youtube_id: track.youtubeId,
        type: track.type,
        cover_url: track.coverUrl,
        audio_url: null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    songId = inserted.id as string;
  }

  const { error: catalogError } = await supabase.from("community_catalog").upsert(
    { song_id: songId, user_id: userId },
    { onConflict: "song_id,user_id" },
  );

  if (catalogError) return { error: catalogError.message };

  if (playlistId) {
    const addResult = await addSongToPlaylist(playlistId, songId);
    if (addResult.error) return { error: addResult.error };
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/your-library");
  if (playlistId) revalidatePath(`/playlists/${playlistId}`);
  revalidatePath(`/user/${userId}`);

  return { data: { songId } };
}
