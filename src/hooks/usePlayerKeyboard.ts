"use client";

import { useEffect, useCallback } from "react";
import { usePlayerStore } from "@/lib/stores/playerStore";

const SEEK_STEP = 5;

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

/** Atajos de teclado globales del reproductor */
export function usePlayerKeyboard() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const seekRelative = usePlayerStore((s) => s.seekRelative);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

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
