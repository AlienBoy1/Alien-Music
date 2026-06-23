"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { error?: string; success?: boolean; liked?: boolean };

export async function toggleLikeSong(songId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Debes iniciar sesión para dar like" };
  }

  const userId = session.user.id;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("liked_songs")
    .select("song_id")
    .eq("user_id", userId)
    .eq("song_id", songId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("liked_songs")
      .delete()
      .eq("user_id", userId)
      .eq("song_id", songId);

    if (error) return { error: error.message };
    revalidatePath("/your-library");
    revalidatePath("/");
    return { success: true, liked: false };
  }

  const { error } = await supabase
    .from("liked_songs")
    .insert({ user_id: userId, song_id: songId });

  if (error) return { error: error.message };
  revalidatePath("/your-library");
  revalidatePath("/");
  return { success: true, liked: true };
}
