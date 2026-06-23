"use client";

import { useEffect } from "react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="max-w-md text-sm text-text-muted">
        No pudimos cargar el contenido. Verifica tu conexión a Supabase y las
        variables de entorno.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-accent px-6 py-2 font-semibold text-black hover:bg-accent-hover"
      >
        Reintentar
      </button>
    </div>
  );
}
