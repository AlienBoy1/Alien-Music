"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { recordRecentlyPlayed } from "@/app/actions/recentlyPlayed";
import {
  loadPodcastProgress,
  savePodcastProgress,
} from "@/lib/podcast/progress";
import {
  updateMediaSessionMetadata,
  updateMediaSessionPosition,
} from "@/lib/media/mediaSession";

const PLAYED_THRESHOLD = 0.3;
const TIME_SYNC_THRESHOLD = 0.75;
const PODCAST_SAVE_INTERVAL_MS = 5000;

function youtubeWatchUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/**
 * Sincroniza react-player (YouTube) con playerStore:
 * play/pause, volumen, seekRevision, progreso y fin de pista.
 */
export function useYouTubePlayer(
  playerRef: React.RefObject<HTMLVideoElement | null>,
) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playbackSource = usePlayerStore((s) => s.playbackSource);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerReady = usePlayerStore((s) => s.isPlayerReady);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const seekRevision = usePlayerStore((s) => s.seekRevision);
  const repeatMode = usePlayerStore((s) => s.repeatMode);

  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setLoading = usePlayerStore((s) => s.setLoading);
  const setPlayerReady = usePlayerStore((s) => s.setPlayerReady);
  const next = usePlayerStore((s) => s.next);

  const recordedTrackRef = useRef<string | null>(null);
  const lastSeekRevisionRef = useRef(seekRevision);
  const isSeekingFromStoreRef = useRef(false);
  const podcastSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeAppliedRef = useRef<string | null>(null);

  const isYoutubeActive =
    playbackSource === "youtube" && Boolean(currentTrack?.youtubeId);

  // Reset al cambiar de pista
  useEffect(() => {
    if (!isYoutubeActive) return;
    setPlayerReady(false);
    setLoading(true);
    recordedTrackRef.current = null;
    lastSeekRevisionRef.current = 0;
    resumeAppliedRef.current = null;
    if (podcastSaveTimerRef.current) {
      clearInterval(podcastSaveTimerRef.current);
      podcastSaveTimerRef.current = null;
    }
  }, [currentTrack?.youtubeId, isYoutubeActive, setLoading, setPlayerReady]);

  // Guardar progreso de podcast cada 5s
  useEffect(() => {
    if (!isYoutubeActive || currentTrack?.category !== "podcast") return;

    podcastSaveTimerRef.current = setInterval(() => {
      const track = usePlayerStore.getState().currentTrack;
      const time = usePlayerStore.getState().currentTime;
      if (track?.category === "podcast" && track.youtubeId && time > 0) {
        savePodcastProgress(track.youtubeId, time);
      }
    }, PODCAST_SAVE_INTERVAL_MS);

    return () => {
      if (podcastSaveTimerRef.current) {
        clearInterval(podcastSaveTimerRef.current);
        podcastSaveTimerRef.current = null;
      }
    };
  }, [currentTrack?.youtubeId, currentTrack?.category, isYoutubeActive]);

  // Media Session: metadata en cada cambio de pista YouTube
  useEffect(() => {
    if (!isYoutubeActive || !currentTrack) return;
    updateMediaSessionMetadata(currentTrack);
  }, [currentTrack, isYoutubeActive]);

  // Seek desde la UI (barra de progreso / atajos / lock screen)
  useEffect(() => {
    if (!isYoutubeActive || !isPlayerReady) return;
    if (seekRevision === lastSeekRevisionRef.current) return;

    lastSeekRevisionRef.current = seekRevision;
    const el = playerRef.current;
    if (!el) return;

    isSeekingFromStoreRef.current = true;
    try {
      el.currentTime = currentTime;
    } catch {
      // YouTube iframe puede rechazar seeks prematuros
    }
    window.setTimeout(() => {
      isSeekingFromStoreRef.current = false;
    }, 400);
  }, [seekRevision, currentTime, isYoutubeActive, isPlayerReady, playerRef]);

  const handleReady = useCallback(() => {
    setPlayerReady(true);
    setLoading(false);
    const el = playerRef.current;
    const track = usePlayerStore.getState().currentTrack;
    const savedTime = usePlayerStore.getState().currentTime;

    if (el && !Number.isNaN(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    }

    if (!track?.youtubeId || resumeAppliedRef.current === track.youtubeId) {
      return;
    }

    let seekTo = 0;

    if (track.category === "podcast") {
      const podcastSaved = loadPodcastProgress(track.youtubeId);
      if (podcastSaved > 5) seekTo = podcastSaved;
    } else if (savedTime > 1) {
      seekTo = savedTime;
    }

    if (seekTo > 1 && el) {
      resumeAppliedRef.current = track.youtubeId;
      isSeekingFromStoreRef.current = true;
      try {
        el.currentTime = seekTo;
        usePlayerStore.getState().setCurrentTime(seekTo);
        lastSeekRevisionRef.current = usePlayerStore.getState().seekRevision;
      } catch {
        // ignore
      }
      window.setTimeout(() => {
        isSeekingFromStoreRef.current = false;
      }, 500);
    }
  }, [playerRef, setDuration, setLoading, setPlayerReady]);

  const handleWaiting = useCallback(() => setLoading(true), [setLoading]);
  const handlePlaying = useCallback(() => setLoading(false), [setLoading]);

  const handleDurationChange = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const dur = e.currentTarget.duration;
      if (!Number.isNaN(dur) && dur > 0) setDuration(dur);
    },
    [setDuration],
  );

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (isSeekingFromStoreRef.current) return;

      const time = e.currentTarget.currentTime;
      const dur = e.currentTarget.duration || 0;
      const storeTime = usePlayerStore.getState().currentTime;

      if (Math.abs(time - storeTime) > TIME_SYNC_THRESHOLD) {
        setCurrentTime(time);
      }

      const track = usePlayerStore.getState().currentTrack;
      if (
        track &&
        !track.isEphemeral &&
        dur > 0 &&
        time / dur >= PLAYED_THRESHOLD &&
        recordedTrackRef.current !== track.id
      ) {
        recordedTrackRef.current = track.id;
        void recordRecentlyPlayed(track.id);
      }

      updateMediaSessionPosition(time, dur);
    },
    [setCurrentTime],
  );

  const handleEnded = useCallback(() => {
    if (repeatMode === "one") return;
    const track = usePlayerStore.getState().currentTrack;
    if (track?.category === "podcast" && track.youtubeId) {
      savePodcastProgress(track.youtubeId, 0);
    }
    next();
  }, [next, repeatMode]);

  const handleError = useCallback(() => {
    setLoading(false);
    usePlayerStore.getState().pause();
  }, [setLoading]);

  return {
    isYoutubeActive,
    youtubeSrc: currentTrack?.youtubeId
      ? youtubeWatchUrl(currentTrack.youtubeId)
      : undefined,
    playing: isPlaying && isYoutubeActive,
    volume: isMuted ? 0 : volume,
    muted: isMuted,
    loop: repeatMode === "one",
    onReady: handleReady,
    onWaiting: handleWaiting,
    onPlaying: handlePlaying,
    onDurationChange: handleDurationChange,
    onTimeUpdate: handleTimeUpdate,
    onEnded: handleEnded,
    onError: handleError,
  };
}
