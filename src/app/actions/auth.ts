"use server";

import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registerUser(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Todos los campos son obligatorios" };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { error: "Ya existe una cuenta con este email" };
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from("users").insert({
    name,
    email,
    password_hash,
    emailVerified: new Date().toISOString(),
  });

  if (error) {
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  return { success: true };
}
