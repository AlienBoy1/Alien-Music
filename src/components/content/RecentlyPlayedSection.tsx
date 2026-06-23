"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Song } from "@/types/music";
import { songToPlayerTrack } from "@/types/music";
import { usePlayerStore } from "@/lib/stores/playerStore";

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
          const raw = row.songs as unknown as {
            id: string;
            title: string;
            artist: string;
            album_title: string | null;
            duration: number;
            audio_url: string;
            cover_url: string;
          } | null;
          if (!raw) return null;
          return {
            id: raw.id,
            title: raw.title,
            artist: raw.artist,
            albumTitle: raw.album_title,
            duration: raw.duration,
            audioUrl: raw.audio_url,
            coverUrl: raw.cover_url,
          } satisfies Song;
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
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold">Escuchado recientemente</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
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
                className={`relative mb-2 aspect-square overflow-hidden rounded-md bg-surface-highlight ${
                  isCurrent ? "ring-2 ring-accent" : ""
                }`}
              >
                <Image
                  src={song.coverUrl}
                  alt={song.title}
                  fill
                  sizes="144px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <p
                className={`truncate text-sm ${
                  isCurrent ? "font-medium text-accent" : ""
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
