"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { recordRecentlyPlayed } from "@/app/actions/recentlyPlayed";
import { useMediaSession } from "@/hooks/useMediaSession";

const SEEK_STEP = 5;
const PLAYED_THRESHOLD = 0.3;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Hook central del reproductor: audio DOM, atajos, historial y Media Session.
 */
export function useAudioPlayer(audioRef: React.RefObject<HTMLAudioElement | null>) {
  useMediaSession();

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);

  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setLoading = usePlayerStore((s) => s.setLoading);
  const next = usePlayerStore((s) => s.next);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const seekRelative = usePlayerStore((s) => s.seekRelative);
  const hydrateVolume = usePlayerStore((s) => s.hydrateVolume);

  const recordedTrackRef = useRef<string | null>(null);

  // Hidratar volumen desde localStorage al montar
  useEffect(() => {
    hydrateVolume();
  }, [hydrateVolume]);

  // Cambio de pista → cargar fuente
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setLoading(true);
    recordedTrackRef.current = null;

    const fullUrl = currentTrack.audioUrl;
    if (!audio.src.endsWith(fullUrl.split("/").pop() ?? "")) {
      audio.src = fullUrl;
      audio.load();
    }
  }, [currentTrack, audioRef, setLoading]);

  // Play / Pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

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

      if (
        currentTrack &&
        dur > 0 &&
        time / dur >= PLAYED_THRESHOLD &&
        recordedTrackRef.current !== currentTrack.id
      ) {
        recordedTrackRef.current = currentTrack.id;
        void recordRecentlyPlayed(currentTrack.id);
      }

      if ("mediaSession" in navigator && navigator.mediaSession.setPositionState) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: audio.playbackRate,
            position: time,
          });
        } catch {
          // duration NaN en algunos navegadores
        }
      }
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
  }, [
    audioRef,
    currentTrack,
    setCurrentTime,
    setDuration,
    setLoading,
    next,
  ]);

  // Atajos de teclado globales
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (!currentTrack) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(SEEK_STEP);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-SEEK_STEP);
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    },
    [currentTrack, togglePlay, seekRelative, toggleMute],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
