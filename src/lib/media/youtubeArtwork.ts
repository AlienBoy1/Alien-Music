/** Tamaños estándar para artwork de Media Session API */
export const MEDIA_SESSION_ARTWORK_SIZES = [
  96, 128, 192, 256, 384, 512,
] as const;

/**
 * URLs de portada YouTube en alta resolución.
 * maxresdefault (1280×720) para ≥256px; hqdefault (480×360) para menores.
 */
export function buildYoutubeArtwork(youtubeId: string): MediaImage[] {
  const hq = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  const max = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;

  return MEDIA_SESSION_ARTWORK_SIZES.map((size) => ({
    src: size >= 256 ? max : hq,
    sizes: `${size}x${size}`,
    type: "image/jpeg",
  }));
}

/** Artwork genérico a partir de una URL de portada existente */
export function buildCoverArtwork(coverUrl: string): MediaImage[] {
  return MEDIA_SESSION_ARTWORK_SIZES.map((size) => ({
    src: coverUrl,
    sizes: `${size}x${size}`,
    type: "image/jpeg",
  }));
}
