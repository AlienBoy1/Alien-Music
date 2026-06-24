"use client";

import { useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useMediaSession } from "@/hooks/useMediaSession";
import { useBackgroundPlayback } from "@/hooks/useBackgroundPlayback";
import { useSilentAudioKeepalive } from "@/hooks/useSilentAudioKeepalive";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { isMobileNetwork } from "@/lib/settings/storage";
import { youtubeQualityConfig } from "@/lib/youtube/quality";
import { YOUTUBE_KEEPALIVE_STYLE } from "@/lib/player/youtubeKeepaliveStyle";

const ReactPlayerLazy = dynamic(() => import("react-player"), { ssr: false });

/**
 * Motor de audio/video — ReactPlayer permanece montado siempre.
 * Nunca desmontar el iframe: solo cambiar src/volumen/visibilidad CSS.
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubeRef = useRef<HTMLVideoElement | null>(null);
  const keepaliveRef = useSilentAudioKeepalive();
  const mountedYoutubeIdRef = useRef<string | null>(null);

  useAudioPlayer(audioRef);
  useMediaSession();
  const { isSlowNetwork } = useBackgroundPlayback(audioRef);

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

  const isVideoMode =
    Boolean(currentTrack) &&
    currentTrack?.type === "video" &&
    !forceAudioOnly &&
    (isExpandedMode || videoPanelMode !== "hidden");

  const isMaximized =
    isExpandedMode || videoPanelMode === "maximized";

  /** Key estable: solo remontar al cambiar pista o calidad, NUNCA por visibilidad */
  const playerInstanceKey = useMemo(() => {
    const id = currentTrack?.youtubeId ?? "idle";
    if (id !== "idle") mountedYoutubeIdRef.current = id;
    return `${mountedYoutubeIdRef.current ?? id}-${videoQuality}`;
  }, [currentTrack?.youtubeId, videoQuality]);

  let containerClass = "pointer-events-none fixed overflow-hidden";

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

  const wrapperStyle: React.CSSProperties = isVideoMode
    ? {}
    : {
        ...YOUTUBE_KEEPALIVE_STYLE,
        display: currentTrack?.youtubeId ? "block" : "none",
      };

  return (
    <>
      <audio
        ref={audioRef}
        preload={isSlowNetwork ? "auto" : "metadata"}
        className="hidden"
        playsInline
      />

      <audio
        ref={keepaliveRef}
        className="hidden"
        playsInline
        aria-hidden
        tabIndex={-1}
      />

      {/* ReactPlayer SIEMPRE montado — evita reset al cambiar pestaña */}
      <div
        className={containerClass}
        style={wrapperStyle}
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
          src={youtube.youtubeSrc ?? ""}
          playing={youtube.playing}
          volume={youtube.volume}
          muted={youtube.muted}
          loop={youtube.loop}
          playsInline
          controls={false}
          width={isVideoMode ? "100%" : 1}
          height={isVideoMode ? "100%" : 1}
          style={
            isVideoMode
              ? { width: "100%", height: "100%" }
              : YOUTUBE_KEEPALIVE_STYLE
          }
          config={{
            youtube: {
              color: "white",
              rel: 0,
              iv_load_policy: 3,
              ...ytQuality,
            },
          }}
          key={playerInstanceKey}
          onReady={youtube.onReady}
          onWaiting={youtube.onWaiting}
          onPlaying={youtube.onPlaying}
          onDurationChange={youtube.onDurationChange}
          onTimeUpdate={youtube.onTimeUpdate}
          onEnded={youtube.onEnded}
          onError={youtube.onError}
        />
      </div>
    </>
  );
}
