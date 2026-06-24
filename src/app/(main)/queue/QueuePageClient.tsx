"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GripVertical, Trash2 } from "lucide-react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { getActiveQueue } from "@/lib/player/queueUtils";
import { formatTime } from "@/lib/utils/format";
import { COVER_SIZES } from "@/lib/images/coverSizes";

export function QueuePageClient() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const shuffledQueue = usePlayerStore((s) => s.shuffledQueue);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const playCollection = usePlayerStore((s) => s.playCollection);

  const activeQueue = getActiveQueue(queue, shuffledQueue, isShuffle);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const upcoming = currentTrack
    ? activeQueue.filter((t) => t.id !== currentTrack.id)
    : activeQueue;

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || isShuffle) return;
    const fromInQueue = dragIndex + (currentTrack ? 1 : 0);
    const toInQueue = toIndex + (currentTrack ? 1 : 0);
    reorderQueue(fromInQueue, toInQueue);
    setDragIndex(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Cola de reproducción"
        subtitle="Reordena o elimina las siguientes pistas"
        showFeedback={false}
      />

      {isShuffle && (
        <p className="mb-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-text-muted">
          El modo aleatorio está activo. Desactívalo en el reproductor para reordenar manualmente.
        </p>
      )}

      {currentTrack && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Reproduciendo ahora
          </p>
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-lg">
              <Image
                src={currentTrack.coverUrl}
                alt=""
                fill
                sizes={COVER_SIZES.player}
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-medium">{currentTrack.title}</p>
              <p className="text-sm text-text-muted">{currentTrack.artistName}</p>
            </div>
          </div>
        </div>
      )}

      {upcoming.length === 0 ? (
        <p className="rounded-lg bg-surface-highlight p-8 text-center text-text-muted">
          La cola está vacía. Añade canciones con &quot;Agregar a la fila&quot; desde cualquier lista.
        </p>
      ) : (
        <ul className="space-y-1">
          {upcoming.map((track, i) => (
            <li
              key={`${track.id}-${i}`}
              draggable={!isShuffle}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className="group flex items-center gap-3 rounded-lg border border-transparent bg-surface-highlight/50 px-3 py-2 hover:border-border"
            >
              {!isShuffle && (
                <GripVertical
                  size={16}
                  className="cursor-grab text-text-muted opacity-50 group-hover:opacity-100"
                />
              )}
              <span className="w-6 text-center text-xs text-text-muted">{i + 1}</span>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                <Image src={track.coverUrl} alt="" fill sizes={COVER_SIZES.thumb} className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => playCollection(activeQueue, activeQueue.findIndex((t) => t.id === track.id))}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm">{track.title}</p>
                <p className="truncate text-xs text-text-muted">{track.artistName}</p>
              </button>
              <span className="text-xs text-text-muted">{formatTime(track.duration)}</span>
              <button
                type="button"
                onClick={() => removeFromQueue(track.id)}
                className="rounded p-1 text-text-muted opacity-0 hover:text-red-400 group-hover:opacity-100"
                aria-label="Quitar"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center">
        <Link href="/" className="text-sm text-accent hover:underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
