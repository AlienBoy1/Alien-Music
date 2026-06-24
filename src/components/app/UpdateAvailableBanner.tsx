"use client";

import { RefreshCw, X } from "lucide-react";

interface UpdateAvailableBannerProps {
  onApply: () => void;
  onDismiss: () => void;
  applying: boolean;
}

export function UpdateAvailableBanner({
  onApply,
  onDismiss,
  applying,
}: UpdateAvailableBannerProps) {
  return (
    <div
      className="fixed bottom-[calc(var(--player-height)+var(--mobile-nav-height)+8px)] left-0 right-0 z-[80] mx-auto max-w-lg px-4 md:bottom-[calc(var(--player-height)+8px)]"
      role="status"
    >
      <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-surface/95 px-4 py-3 shadow-[0_0_24px_rgba(0,255,159,0.12)] backdrop-blur-md">
        <RefreshCw
          size={18}
          className={`shrink-0 text-accent ${applying ? "animate-spin" : ""}`}
        />
        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          className="min-w-0 flex-1 text-left text-sm text-white hover:underline disabled:opacity-60"
        >
          Nueva versión disponible de Alien Music. Haz clic aquí para reiniciar y
          actualizar
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-text-muted hover:text-white"
          aria-label="Ocultar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
