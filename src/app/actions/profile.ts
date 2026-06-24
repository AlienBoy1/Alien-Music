"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidUsername,
  normalizeUsername,
  usernameValidationError,
} from "@/lib/username";

export type ProfileActionResult<T = void> = {
  error?: string;
  data?: T;
};

export async function checkUsernameAvailable(
  username: string,
): Promise<ProfileActionResult<{ available: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const normalized = normalizeUsername(username);
  const validationError = usernameValidationError(normalized);
  if (validationError) return { error: validationError };

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .ilike("username", normalized)
    .maybeSingle();

  if (existing && existing.id !== session.user.id) {
    return { data: { available: false } };
  }

  return { data: { available: true } };
}

export async function updateUsername(
  username: string,
): Promise<ProfileActionResult<{ username: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const normalized = normalizeUsername(username);
  const validationError = usernameValidationError(normalized);
  if (validationError) return { error: validationError };

  const available = await checkUsernameAvailable(normalized);
  if (available.error) return { error: available.error };
  if (!available.data?.available) {
    return { error: "Ese @username ya está en uso" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ username: normalized })
    .eq("id", session.user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath(`/user/${session.user.id}`);
  return { data: { username: normalized } };
}

export async function getCurrentUserProfile(): Promise<
  ProfileActionResult<{
    id: string;
    name: string | null;
    email: string | null;
    username: string | null;
    image: string | null;
  }>
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, username, image")
    .eq("id", session.user.id)
    .single();

  if (error || !data) return { error: "Usuario no encontrado" };

  return {
    data: {
      id: data.id as string,
      name: data.name as string | null,
      email: data.email as string | null,
      username: data.username as string | null,
      image: data.image as string | null,
    },
  };
}
