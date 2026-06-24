import type { CSSProperties } from "react";

/**
 * Contenedor 1×1 casi invisible — el SO no suspende el iframe de YouTube
 * porque técnicamente sigue "visible" en pantalla (no 0×0 ni display:none).
 */
export const YOUTUBE_KEEPALIVE_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: 1,
  height: 1,
  opacity: 0.01,
  zIndex: -50,
  pointerEvents: "none",
  overflow: "hidden",
};

export function isMobilePlaybackDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 767px)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}
