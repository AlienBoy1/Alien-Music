"use client";

import { useEffect } from "react";
import { Download, Play } from "lucide-react";
import Image from "next/image";
import { useOfflineStore } from "@/lib/stores/offlineStore";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { toOfflinePlayerTrack } from "@/lib/offline/downloads";
import { formatTime } from "@/lib/utils/format";

export function DownloadsLibrary() {
  const downloads = useOfflineStore((s) => s.downloads);
  const hydrate = useOfflineStore((s) => s.hydrate);
  const isOnline = useOfflineStore((s) => s.isOnline);
  const playCollection = usePlayerStore((s) => s.playCollection);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const playable = downloads.filter(
    (d) => d.hasCachedAudio || (isOnline && d.track.youtubeId),
  );

  const handlePlayAll = () => {
    const tracks = playable.map((d) => toOfflinePlayerTrack(d));
    if (tracks.length > 0) playCollection(tracks, 0);
  };

  const handlePlay = (index: number) => {
    const tracks = playable.map((d) => toOfflinePlayerTrack(d));
    playCollection(tracks, index);
  };

  if (downloads.length === 0) {
    return (
      <section id="downloads" className="mb-10 scroll-mt-24">
        <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-bold tracking-wide text-alien-gradient">
          <Download size={20} />
          Música descargada
        </h2>
        <div className="glass-alien rounded-xl p-8 text-center">
          <p className="text-lg font-medium">Sin descargas aún</p>
          <p className="mt-2 text-sm text-text-muted">
            Pulsa el botón de descarga en canciones o playlists para escucharlas sin conexión.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="downloads" className="mb-10 scroll-mt-24">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display flex items-center gap-2 text-xl font-bold tracking-wide text-alien-gradient">
          <Download size={20} />
          Música descargada
        </h2>
        {playable.length > 0 && (
          <button
            type="button"
            onClick={handlePlayAll}
            className="glass-alien-pill flex items-center gap-1 text-xs font-medium text-accent"
          >
            <Play size={12} />
            Reproducir todo
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {downloads.map((record, index) => {
          const playableIndex = playable.findIndex((p) => p.id === record.id);
          const canPlay = playableIndex >= 0;

          return (
            <div
              key={record.id}
              className="group flex items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-surface-highlight"
            >
              <button
                type="button"
                onClick={() => canPlay && handlePlay(playableIndex)}
                disabled={!canPlay}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md disabled:opacity-50"
              >
                <Image
                  src={record.track.coverUrl}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
                {canPlay && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play size={18} className="text-accent" />
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{record.track.title}</p>
                <p className="truncate text-xs text-text-muted">
                  {record.track.artistName}
                  {!record.hasCachedAudio && !isOnline && " · Solo metadatos offline"}
                </p>
              </div>
              <span className="text-xs text-text-muted">
                {formatTime(record.track.duration)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
