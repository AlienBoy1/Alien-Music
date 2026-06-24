"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import type { PlayerTrack } from "@/types/music";
import { COVER_SIZES } from "@/lib/images/coverSizes";

export interface TopResultData {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  typeLabel: string;
  isCircular?: boolean;
  track: PlayerTrack;
  allTracks: PlayerTrack[];
  index: number;
}

interface SearchTopResultProps {
  result: TopResultData;
}

export function SearchTopResult({ result }: SearchTopResultProps) {
  const playCollection = usePlayerStore((s) => s.playCollection);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isCurrent =
    currentTrack?.id === result.track.id && isPlaying;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
        Mejor resultado
      </h2>
      <button
        type="button"
        onClick={() => playCollection(result.allTracks, result.index)}
        className="group flex w-full max-w-md flex-col gap-4 rounded-xl bg-surface-highlight/60 p-5 text-left transition-all hover:bg-surface-highlight/90 sm:flex-row sm:items-end"
      >
        <div
          className={`relative mx-auto h-36 w-36 shrink-0 overflow-hidden shadow-2xl sm:mx-0 sm:h-40 sm:w-40 ${
            result.isCircular ? "rounded-full" : "rounded-md"
          } ${isCurrent ? "ring-2 ring-accent alien-glow" : ""}`}
        >
          <Image
            src={result.coverUrl}
            alt={result.title}
            fill
            sizes={COVER_SIZES.card}
            className="object-cover"
            priority
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg">
              <Play size={24} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <span className="mb-2 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
            {result.typeLabel}
          </span>
          <h3 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            {result.title}
          </h3>
          <p className="mt-1 text-sm text-text-muted">{result.subtitle}</p>
        </div>
      </button>
    </section>
  );
}
