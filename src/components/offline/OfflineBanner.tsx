"use client";

import { WifiOff } from "lucide-react";
import { useOfflineStore } from "@/lib/stores/offlineStore";

export function OfflineBanner() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const downloads = useOfflineStore((s) => s.downloads);

  if (isOnline) return null;

  return (
    <div
      className="relative z-40 flex items-center justify-center gap-2 border-b border-accent/20 bg-accent/10 px-4 py-2 text-sm text-accent backdrop-blur-md"
      role="status"
    >
      <WifiOff size={16} />
      <span>
        Modo offline — {downloads.length} descarga{downloads.length === 1 ? "" : "s"} disponible
        {downloads.length === 1 ? "" : "s"}. YouTube en vivo desactivado.
      </span>
    </div>
  );
}
