"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useBackgroundPlayback } from "@/hooks/useBackgroundPlayback";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { isMobileNetwork } from "@/lib/settings/storage";
import { youtubeQualityConfig } from "@/lib/youtube/quality";

const ReactPlayerLazy = dynamic(() => import("react-player"), { ssr: false });

/** Estilo mínimo 1×1 para mantener el iframe activo en segundo plano (anti-suspensión iOS/Android) */
const HIDDEN_PLAYER_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: "none",
  overflow: "hidden",
};

/**
 * Motor multimedia híbrido:
 * - `<audio>` nativo para pistas legacy (MP3)
 * - react-player (YouTube) para el catálogo comunitario
 * - Panel PiP cuando type === 'video'
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubeRef = useRef<HTMLVideoElement | null>(null);

  useAudioPlayer(audioRef);
  const { forceBackgroundAudioOnly, isSlowNetwork } =
    useBackgroundPlayback(audioRef);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const videoPanelMode = usePlayerStore((s) => s.videoPanelMode);
  const videoQuality = usePlayerStore((s) => s.videoQuality);
  const isExpandedMode = usePlayerStore((s) => s.isExpandedMode);
  const hydrateQuality = usePlayerStore((s) => s.hydrateQuality);
  const hideVideo = usePlayerStore((s) => s.hideVideo);
  const toggleVideoMaximize = usePlayerStore((s) => s.toggleVideoMaximize);
  const mobileDataSaver = useSettingsStore((s) => s.mobileDataSaver);

  useEffect(() => {
    hydrateQuality();
  }, [hydrateQuality]);

  const youtube = useYouTubePlayer(youtubeRef);
  const ytQuality = youtubeQualityConfig(videoQuality);

  const forceAudioOnly =
    mobileDataSaver &&
    isMobileNetwork() &&
    currentTrack?.type === "video";

  /** Segundo plano / pantalla bloqueada: solo audio, iframe mínimo activo */
  const backgroundAudioOnly = forceBackgroundAudioOnly;

  const isVideoMode =
    currentTrack?.type === "video" &&
    !forceAudioOnly &&
    !backgroundAudioOnly &&
    (isExpandedMode || videoPanelMode !== "hidden");

  const isMaximized =
    isExpandedMode || videoPanelMode === "maximized";

  let containerClass = "pointer-events-none fixed overflow-hidden opacity-0";

  if (isVideoMode) {
    if (isExpandedMode) {
      containerClass =
        "fixed left-4 right-4 top-[5.5rem] z-[71] mx-auto aspect-video max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl md:left-[8%] md:right-auto md:top-[18%] md:w-[58vw] md:max-w-none";
    } else if (isMaximized) {
      containerClass =
        "fixed inset-4 z-[45] overflow-hidden rounded-xl border border-border bg-black shadow-2xl alien-border-glow md:inset-8";
    } else {
      containerClass =
        "fixed bottom-[calc(var(--player-height)+var(--mobile-nav-height)+12px)] right-4 z-[45] h-44 w-72 overflow-hidden rounded-lg border border-border bg-black shadow-2xl alien-border-glow md:bottom-[calc(var(--player-height)+12px)] md:h-52 md:w-80";
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        preload={isSlowNetwork ? "auto" : "metadata"}
        className="hidden"
      />

      {youtube.youtubeSrc && (
        <div
          className={containerClass}
          style={isVideoMode ? undefined : HIDDEN_PLAYER_STYLE}
          aria-hidden={!isVideoMode}
        >
          {isVideoMode && !isExpandedMode && (
            <div className="absolute right-2 top-2 z-10 flex gap-1">
              <button
                type="button"
                onClick={toggleVideoMaximize}
                className="rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-accent hover:text-black"
                aria-label={isMaximized ? "Restaurar tamaño" : "Maximizar video"}
              >
                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                type="button"
                onClick={hideVideo}
                className="rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-accent hover:text-black"
                aria-label="Ocultar video (solo audio)"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <ReactPlayerLazy
            ref={youtubeRef}
            src={youtube.youtubeSrc}
            playing={youtube.playing}
            volume={youtube.volume}
            muted={youtube.muted}
            loop={youtube.loop}
            playsInline
            width={isVideoMode ? "100%" : 1}
            height={isVideoMode ? "100%" : 1}
            style={
              isVideoMode
                ? { width: "100%", height: "100%" }
                : HIDDEN_PLAYER_STYLE
            }
            config={{
              youtube: {
                color: "white",
                rel: 0,
                iv_load_policy: 3,
                ...ytQuality,
              },
            }}
            key={`${youtube.youtubeSrc}-${videoQuality}-${backgroundAudioOnly ? "bg" : "fg"}`}
            onReady={youtube.onReady}
            onWaiting={youtube.onWaiting}
            onPlaying={youtube.onPlaying}
            onDurationChange={youtube.onDurationChange}
            onTimeUpdate={youtube.onTimeUpdate}
            onEnded={youtube.onEnded}
            onError={youtube.onError}
          />
        </div>
      )}
    </>
  );
}
