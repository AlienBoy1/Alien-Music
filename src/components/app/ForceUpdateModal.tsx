"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { APP_VERSION } from "@/lib/app/version";
import { forceAppUpdate } from "@/lib/pwa/forceUpdate";

interface ForceUpdateModalProps {
  minRequiredVersion: string;
}

/**
 * Modal bloqueante — no se puede cerrar hasta actualizar.
 */
export function ForceUpdateModal({ minRequiredVersion }: ForceUpdateModalProps) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    await forceAppUpdate();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="force-update-title"
      aria-describedby="force-update-desc"
    >
      <div className="w-full max-w-md rounded-2xl border border-accent/30 bg-surface p-6 shadow-[0_0_40px_rgba(0,255,159,0.15)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-accent/10 p-3">
            <AlertTriangle className="text-accent" size={28} />
          </div>
          <div>
            <h2
              id="force-update-title"
              className="font-display text-lg font-bold text-white"
            >
              Actualización obligatoria
            </h2>
            <p className="text-xs text-text-muted">
              v{APP_VERSION} → mínimo v{minRequiredVersion}
            </p>
          </div>
        </div>

        <p id="force-update-desc" className="mb-6 text-sm leading-relaxed text-text-muted">
          Estás usando una versión antigua de Alien Music. Para seguir escuchando a
          la comunidad, es obligatorio actualizar.
        </p>

        <button
          type="button"
          onClick={() => void handleUpdate()}
          disabled={updating}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-bold text-black transition-all hover:bg-accent-hover disabled:opacity-60"
        >
          <RefreshCw size={18} className={updating ? "animate-spin" : ""} />
          {updating ? "Actualizando..." : "Actualizar ahora"}
        </button>

        <p className="mt-3 text-center text-xs text-text-muted">
          Se limpiará el caché de la app y se descargará la versión más reciente.
        </p>
      </div>
    </div>
  );
}
