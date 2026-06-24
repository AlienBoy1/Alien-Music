"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername } from "@/lib/username";

export type FollowActionResult<T = void> = { error?: string; data?: T };

export async function followUser(
  targetUserId: string,
): Promise<FollowActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };
  if (targetUserId === session.user.id) {
    return { error: "No puedes seguirte a ti mismo" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("follows").upsert(
    { follower_id: session.user.id, following_id: targetUserId },
    { onConflict: "follower_id,following_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/messages");
  revalidatePath(`/user/${targetUserId}`);
  return {};
}

export async function unfollowUser(
  targetUserId: string,
): Promise<FollowActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", session.user.id)
    .eq("following_id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/messages");
  return {};
}

export async function isFollowing(
  targetUserId: string,
): Promise<FollowActionResult<{ following: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", session.user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  return { data: { following: Boolean(data) } };
}

export async function isFollowedBy(
  otherUserId: string,
): Promise<FollowActionResult<{ followedBy: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", otherUserId)
    .eq("following_id", session.user.id)
    .maybeSingle();

  return { data: { followedBy: Boolean(data) } };
}

export async function findUserByUsername(username: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" as const };

  const normalized = normalizeUsername(username);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, username, image")
    .ilike("username", normalized)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Usuario no encontrado" };

  const [{ data: following }, { data: followedBy }] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", session.user.id)
      .eq("following_id", data.id)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", data.id)
      .eq("following_id", session.user.id)
      .maybeSingle(),
  ]);

  return {
    data: {
      id: data.id as string,
      name: data.name as string | null,
      username: data.username as string | null,
      image: data.image as string | null,
      isFollowing: Boolean(following),
      isFollowedBy: Boolean(followedBy),
      canChat: Boolean(following),
    },
  };
}

export async function getFollowingForShare() {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" as const };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("follows")
    .select("following_id, users:following_id(id, name, username, image)")
    .eq("follower_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  const users = (data ?? [])
    .map((row) => {
      const u = row.users as unknown as {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
      } | null;
      return u;
    })
    .filter((u): u is NonNullable<typeof u> => u != null);

  return { data: users };
}
