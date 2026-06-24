"use client";

import { useEffect, useState } from "react";
import type { PlayerTrack } from "@/types/music";
import { isEphemeralTrackId } from "@/types/music";

export function useTrackLyrics(track: PlayerTrack | null, enabled: boolean) {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !track) {
      setLyrics(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setLyrics(null);

    const params = new URLSearchParams();
    if (!track.isEphemeral && !isEphemeralTrackId(track.id)) {
      params.set("songId", track.id);
    } else {
      params.set("artist", track.artistName);
      params.set("title", track.title);
    }

    void fetch(`/api/lyrics?${params.toString()}`)
      .then(async (res) => {
        const data = (await res.json()) as { lyrics?: string; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Letras no disponibles");
          return;
        }
        setLyrics(data.lyrics ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Error de red al cargar letras");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, track]);

  return { lyrics, loading, error };
}
