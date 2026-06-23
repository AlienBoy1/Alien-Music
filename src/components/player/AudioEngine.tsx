"use client";

import { useRef } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

/** Motor de audio: delega toda la lógica a useAudioPlayer */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useAudioPlayer(audioRef);
  return <audio ref={audioRef} preload="auto" />;
}
