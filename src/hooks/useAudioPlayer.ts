"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { recordRecentlyPlayed } from "@/app/actions/recentlyPlayed";
import { useMediaSession } from "@/hooks/useMediaSession";
import { usePlayerKeyboard } from "@/hooks/usePlayerKeyboard";
import { updateMediaSessionPosition } from "@/lib/media/mediaSession";

const PLAYED_THRESHOLD = 0.3;

/**
 * Hook central del reproductor: audio DOM, atajos, historial y Media Session.
 */
export function useAudioPlayer(audioRef: React.RefObject<HTMLAudioElement | null>) {
  useMediaSession();
  usePlayerKeyboard();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const currentTime = usePlayerStore((s) => s.currentTime);

  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setLoading = usePlayerStore((s) => s.setLoading);
  const next = usePlayerStore((s) => s.next);
  const hydrateVolume = usePlayerStore((s) => s.hydrateVolume);

  const recordedTrackRef = useRef<string | null>(null);

  // Hidratar volumen desde localStorage al montar
  useEffect(() => {
    hydrateVolume();
  }, [hydrateVolume]);

  // Cambio de pista → cargar fuente (solo reproducción nativa / legacy MP3)
  useEffect(() => {
    const audio = audioRef.current;
    const track = usePlayerStore.getState().currentTrack;
    if (!audio || !track) return;

    const playbackSource = usePlayerStore.getState().playbackSource;
    if (playbackSource === "youtube" || !track.audioUrl) return;

    setLoading(true);
    recordedTrackRef.current = null;

    const fullUrl = track.audioUrl;
    if (!audio.src.endsWith(fullUrl.split("/").pop() ?? "")) {
      audio.src = fullUrl;
      audio.load();
      const saved = usePlayerStore.getState().currentTime;
      if (saved > 1) {
        audio.currentTime = saved;
      }
    }
  }, [currentTrack?.id, audioRef, setLoading]);

  // Play / Pause (solo elemento <audio> nativo)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const playbackSource = usePlayerStore.getState().playbackSource;
    if (playbackSource === "youtube" || !currentTrack.audioUrl) return;

    if (isPlaying) {
      setLoading(true);
      void audio.play().catch(() => {
        usePlayerStore.getState().pause();
        setLoading(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, audioRef, setLoading]);

  // Volumen
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, audioRef]);

  // Seek externo
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      audio.currentTime = currentTime;
    }
  }, [currentTime, audioRef]);

  // Eventos del elemento <audio>
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onPlaying = () => setLoading(false);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);

    const onTimeUpdate = () => {
      const time = audio.currentTime;
      const dur = audio.duration || 0;
      setCurrentTime(time);

      const track = usePlayerStore.getState().currentTrack;
      if (
        track &&
        dur > 0 &&
        time / dur >= PLAYED_THRESHOLD &&
        recordedTrackRef.current !== track.id
      ) {
        recordedTrackRef.current = track.id;
        void recordRecentlyPlayed(track.id);
      }

      updateMediaSessionPosition(time, dur, audio.playbackRate);
    };

    const onEnded = () => next();

    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioRef, setCurrentTime, setDuration, setLoading, next]);

}
