import type { PlayerTrack, RepeatMode } from "@/types/music";

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
  const index = queue.findIndex((t) => t.id === current.id);
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
  const index = queue.findIndex((t) => t.id === current.id);
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
  const index = queue.findIndex((t) => t.id === currentTrack.id);
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
  const rest = queue.filter((t) => t.id !== currentTrack.id);
  return [currentTrack, ...shuffleArray(rest)];
}

/** Índice de la pista actual en la cola activa */
export function getCurrentIndex(
  queue: PlayerTrack[],
  currentTrack: PlayerTrack | null,
): number {
  if (!currentTrack) return -1;
  return queue.findIndex((t) => t.id === currentTrack.id);
}
