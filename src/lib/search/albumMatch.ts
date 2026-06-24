import type { PlayerTrack } from "@/types/music";
import type { YouTubeAlbumItem } from "@/lib/youtube/types";

/** Álbum de YouTube más probable para una pista según canal y título. */
export function findAlbumForTrack(
  track: PlayerTrack,
  albums: YouTubeAlbumItem[],
): YouTubeAlbumItem | undefined {
  if (track.albumPlaylistId) {
    return albums.find((a) => a.playlistId === track.albumPlaylistId);
  }

  const channel = track.artistName.toLowerCase();
  const candidates = albums.filter(
    (a) => a.artist.toLowerCase() === channel,
  );

  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  const titleLower = track.title.toLowerCase();
  const byTitle = candidates.find((a) => {
    const albumLower = a.title.toLowerCase();
    return (
      titleLower.includes(albumLower) ||
      albumLower.includes(titleLower.split("-")[0]?.trim() ?? "")
    );
  });

  return byTitle ?? candidates[0];
}

export function albumByChannelMap(
  albums: YouTubeAlbumItem[],
): Map<string, YouTubeAlbumItem> {
  const map = new Map<string, YouTubeAlbumItem>();
  for (const album of albums) {
    const key = album.artist.toLowerCase();
    if (!map.has(key)) map.set(key, album);
  }
  return map;
}
