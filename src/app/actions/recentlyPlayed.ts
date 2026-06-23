"use server";

import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function recordRecentlyPlayed(songId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const supabase = createAdminClient();

  await supabase.from("recently_played").upsert(
    {
      user_id: session.user.id,
      song_id: songId,
      played_at: new Date().toISOString(),
    },
    { onConflict: "user_id,song_id" },
  );

  revalidatePath("/");
}
