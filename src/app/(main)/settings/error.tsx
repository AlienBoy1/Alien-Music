"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[settings]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="font-display text-xl font-bold text-alien-gradient">
        No se pudieron cargar los ajustes
      </h2>
      <p className="max-w-md text-sm text-text-muted">
        Puede deberse a una migración pendiente en Supabase o a variables de
        entorno en Vercel. El resto de la app sigue disponible.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-black hover:bg-accent-hover"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-2 text-sm text-text-muted hover:border-accent/40 hover:text-accent"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
