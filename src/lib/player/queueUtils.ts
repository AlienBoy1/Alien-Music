import type { PlayerTrack, RepeatMode } from "@/types/music";

/** Clave estable para comparar pistas (DB o efímeras de YouTube) */
export function trackKey(track: PlayerTrack): string {
  return track.youtubeId || track.id;
}

export function tracksMatch(a: PlayerTrack, b: PlayerTrack): boolean {
  if (a.id === b.id) return true;
  if (a.youtubeId && b.youtubeId && a.youtubeId === b.youtubeId) return true;
  return false;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Cola activa según modo shuffle */
export function getActiveQueue(
  queue: PlayerTrack[],
  shuffledQueue: PlayerTrack[],
  isShuffle: boolean,
): PlayerTrack[] {
  return isShuffle ? shuffledQueue : queue;
}

export function getNextTrack(
  current: PlayerTrack,
  queue: PlayerTrack[],
  repeatMode: RepeatMode,
): PlayerTrack | null {
  const index = queue.findIndex((t) => tracksMatch(t, current));
  if (index === -1) return queue[0] ?? null;
  if (repeatMode === "one") return current;
  if (index < queue.length - 1) return queue[index + 1];
  if (repeatMode === "all") return queue[0] ?? null;
  return null;
}

export function getPreviousTrack(
  current: PlayerTrack,
  queue: PlayerTrack[],
): PlayerTrack | null {
  const index = queue.findIndex((t) => tracksMatch(t, current));
  if (index === -1) return queue[0] ?? null;
  if (index > 0) return queue[index - 1];
  return queue[queue.length - 1] ?? null;
}

/** Inserta una pista justo después de la actual en la cola principal */
export function insertAfterCurrent(
  queue: PlayerTrack[],
  currentTrack: PlayerTrack | null,
  track: PlayerTrack,
): PlayerTrack[] {
  if (!currentTrack) return [...queue, track];
  const index = queue.findIndex((t) => tracksMatch(t, currentTrack));
  if (index === -1) return [...queue, track];
  const next = [...queue];
  next.splice(index + 1, 0, track);
  return next;
}

/** Reconstruye shuffledQueue manteniendo la canción actual al inicio */
export function buildShuffledQueue(
  queue: PlayerTrack[],
  currentTrack: PlayerTrack | null,
): PlayerTrack[] {
  if (!currentTrack) return shuffleArray(queue);
  const rest = queue.filter((t) => !tracksMatch(t, currentTrack));
  return [currentTrack, ...shuffleArray(rest)];
}

/** Reordena la cola principal (índices en cola activa sin shuffle) */
export function reorderQueueArray<T>(
  queue: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= queue.length ||
    toIndex >= queue.length ||
    fromIndex === toIndex
  ) {
    return queue;
  }
  const next = [...queue];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/** Índice de la pista actual en la cola activa */
export function getCurrentIndex(
  queue: PlayerTrack[],
  currentTrack: PlayerTrack | null,
): number {
  if (!currentTrack) return -1;
  return queue.findIndex((t) => tracksMatch(t, currentTrack));
}
