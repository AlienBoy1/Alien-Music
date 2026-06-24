import type { VideoQuality } from "@/lib/stores/playerStore";

/** Mapeo de calidad UI → parámetros YouTube iframe */
export function youtubeQualityConfig(quality: VideoQuality) {
  switch (quality) {
    case "low":
      return { quality: "small" as const };
    case "high":
      return { quality: "hd720" as const };
    case "extreme":
      return { quality: "hd1080" as const };
    case "normal":
    default:
      return { quality: "medium" as const };
  }
}
