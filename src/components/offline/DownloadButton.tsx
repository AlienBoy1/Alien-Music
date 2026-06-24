"use client";

import { Download, Check, Loader2, Trash2 } from "lucide-react";
import type { PlayerTrack } from "@/types/music";
import { useOfflineStore } from "@/lib/stores/offlineStore";

interface DownloadButtonProps {
  track: PlayerTrack;
  variant?: "icon" | "menu";
  className?: string;
}

export function DownloadButton({
  track,
  variant = "icon",
  className = "",
}: DownloadButtonProps) {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const isDownloaded = useOfflineStore((s) => s.isDownloaded(track.id));
  const isDownloading = useOfflineStore((s) => s.isDownloading(track.id));
  const download = useOfflineStore((s) => s.download);
  const remove = useOfflineStore((s) => s.remove);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloaded) {
      await remove(track.id);
    } else {
      await download(track);
    }
  };

  if (!isOnline && !isDownloaded) {
    return null;
  }

  const label = isDownloaded
    ? "Eliminar descarga"
    : isDownloading
      ? "Descargando..."
      : "Descargar para offline";

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDownloading}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-highlight disabled:opacity-60 ${className}`}
      >
        {isDownloading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isDownloaded ? (
          <Trash2 size={14} />
        ) : (
          <Download size={14} />
        )}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDownloading}
      className={`rounded-full p-1.5 transition-colors hover:bg-surface-highlight hover:text-accent disabled:opacity-60 ${
        isDownloaded ? "text-accent" : "text-text-muted"
      } ${className}`}
      aria-label={label}
    >
      {isDownloading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isDownloaded ? (
        <Check size={16} />
      ) : (
        <Download size={16} />
      )}
    </button>
  );
}
