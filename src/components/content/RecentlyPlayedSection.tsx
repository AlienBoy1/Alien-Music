"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mapDbSong } from "@/lib/supabase/mappers";
import type { Song } from "@/types/music";
import { songToPlayerTrack } from "@/types/music";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { COVER_SIZES } from "@/lib/images/coverSizes";

interface RecentlyPlayedSectionProps {
  userId: string;
  initialSongs: Song[];
}

export function RecentlyPlayedSection({
  userId,
  initialSongs,
}: RecentlyPlayedSectionProps) {
  const [songs, setSongs] = useState(initialSongs);
  const playCollection = usePlayerStore((s) => s.playCollection);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("recently_played")
      .select("played_at, songs(*)")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(10);

    if (data) {
      const mapped = data
        .map((row) => {
          const raw = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
          return raw ? mapDbSong(raw) : null;
        })
        .filter((s): s is Song => s !== null);
      setSongs(mapped);
    }
  }, [userId]);

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`recently_played:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recently_played",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  if (songs.length === 0) return null;

  return (
    <section className="content-optimize mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold tracking-wide text-alien-gradient beam-underline inline-block">
          Escuchado recientemente
        </h2>
        <Link
          href="/history"
          className="text-sm font-medium text-accent transition-colors hover:underline"
        >
          Ver historial
        </Link>
      </div>
      <div className="stagger-children flex gap-4 overflow-x-auto pb-2">
        {songs.map((song) => {
          const isCurrent = currentTrack?.id === song.id;
          return (
            <button
              key={song.id}
              type="button"
              onClick={() =>
                playCollection(songs.map(songToPlayerTrack), songs.indexOf(song))
              }
              className="group w-36 shrink-0 text-left"
            >
              <div
                className={`relative mb-2 aspect-square overflow-hidden rounded-lg bg-surface-highlight transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(0,255,159,0.12)] ${
                  isCurrent ? "ring-2 ring-accent alien-glow" : "border border-border group-hover:border-accent/30"
                }`}
              >
                <Image
                  src={song.coverUrl}
                  alt={song.title}
                  fill
                  sizes={COVER_SIZES.card}
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <p
                className={`truncate text-sm transition-colors ${
                  isCurrent ? "font-medium text-accent alien-glow-text" : "group-hover:text-white"
                }`}
              >
                {song.title}
              </p>
              <p className="truncate text-xs text-text-muted">{song.artist}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
