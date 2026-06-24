"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient, tryCreateAdminClient } from "@/lib/supabase/admin";
import {
  normalizeUsername,
  usernameValidationError,
} from "@/lib/username";

export type ProfileActionResult<T = void> = {
  error?: string;
  data?: T;
};

function isMissingUsernameColumn(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("username") &&
    (lower.includes("column") ||
      lower.includes("does not exist") ||
      lower.includes("schema cache"))
  );
}

async function fetchUserRow(userId: string) {
  const supabase = tryCreateAdminClient();
  if (!supabase) return null;

  const withUsername = await supabase
    .from("users")
    .select("id, name, email, username, image")
    .eq("id", userId)
    .maybeSingle();

  if (!withUsername.error && withUsername.data) {
    return withUsername.data;
  }

  if (
    withUsername.error &&
    isMissingUsernameColumn(withUsername.error.message)
  ) {
    const fallback = await supabase
      .from("users")
      .select("id, name, email, image")
      .eq("id", userId)
      .maybeSingle();

    if (fallback.error || !fallback.data) return null;

    return {
      ...fallback.data,
      username: null,
    };
  }

  return withUsername.data;
}

export async function checkUsernameAvailable(
  username: string,
): Promise<ProfileActionResult<{ available: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const normalized = normalizeUsername(username);
    const validationError = usernameValidationError(normalized);
    if (validationError) return { error: validationError };

    const supabase = tryCreateAdminClient();
    if (!supabase) {
      return { error: "Servidor de datos no configurado" };
    }

    const { data: existing, error } = await supabase
      .from("users")
      .select("id")
      .ilike("username", normalized)
      .maybeSingle();

    if (error) {
      if (isMissingUsernameColumn(error.message)) {
        return {
          error:
            "La función de @username aún no está disponible. Aplica la migración de Supabase (fase 8).",
        };
      }
      return { error: "No se pudo comprobar el username" };
    }

    if (existing && existing.id !== session.user.id) {
      return { data: { available: false } };
    }

    return { data: { available: true } };
  } catch {
    return { error: "No se pudo comprobar el username" };
  }
}

export async function updateUsername(
  username: string,
): Promise<ProfileActionResult<{ username: string }>> {
  try {
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

    const supabase = tryCreateAdminClient();
    if (!supabase) {
      return { error: "Servidor de datos no configurado" };
    }

    const { error } = await supabase
      .from("users")
      .update({ username: normalized })
      .eq("id", session.user.id);

    if (error) {
      if (isMissingUsernameColumn(error.message)) {
        return {
          error:
            "No se puede guardar el @username hasta aplicar la migración en Supabase.",
        };
      }
      return { error: error.message };
    }

    revalidatePath("/settings");
    revalidatePath(`/user/${session.user.id}`);
    return { data: { username: normalized } };
  } catch {
    return { error: "No se pudo actualizar el username" };
  }
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
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const data = await fetchUserRow(session.user.id);
    if (!data) return { error: "Usuario no encontrado" };

    return {
      data: {
        id: data.id as string,
        name: data.name as string | null,
        email: data.email as string | null,
        username: (data.username as string | null) ?? null,
        image: data.image as string | null,
      },
    };
  } catch {
    return { error: "No se pudo cargar el perfil" };
  }
}
