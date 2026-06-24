import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let warnedMissingEnv = false;

export function createAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === "production" && !warnedMissingEnv) {
      warnedMissingEnv = true;
      console.error(
        "[supabase] Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el entorno de producción",
      );
    }
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en las variables de entorno",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Variante que no lanza — útil en Server Components degradados */
export function tryCreateAdminClient(): SupabaseClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}
