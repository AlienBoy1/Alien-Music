const PODCAST_PROGRESS_PREFIX = "alien-podcast-progress:";

export function getPodcastProgressKey(youtubeId: string): string {
  return `${PODCAST_PROGRESS_PREFIX}${youtubeId}`;
}

export function loadPodcastProgress(youtubeId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(getPodcastProgressKey(youtubeId));
  if (!raw) return 0;
  const n = parseFloat(raw);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
}

export function savePodcastProgress(youtubeId: string, seconds: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getPodcastProgressKey(youtubeId), String(seconds));
}

export function clearPodcastProgress(youtubeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getPodcastProgressKey(youtubeId));
}
