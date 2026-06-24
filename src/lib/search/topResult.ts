import type { SearchResult, PlayerTrack } from "@/types/music";
import type { YouTubeSearchItem } from "@/lib/youtube/types";
import { youtubeItemToPlayerTrack } from "@/types/music";
import type { TopResultData } from "@/components/search/SearchTopResult";

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function pickSearchTopResult(
  query: string,
  local: SearchResult | null,
  youtubeItems: YouTubeSearchItem[],
  youtubeTracks: PlayerTrack[],
): TopResultData | null {
  const q = normalize(query);
  if (!q) return null;

  const localSong = local?.songs.find(
    (s) =>
      normalize(s.title) === q ||
      normalize(s.artist) === q ||
      normalize(s.title).startsWith(q),
  );

  if (localSong) {
    const tracks = (local?.songs ?? []).map((s) => ({
      id: s.id,
      youtubeId: s.youtubeId ?? "",
      title: s.title,
      artistName: s.artist,
      albumTitle: s.albumTitle ?? s.title,
      coverUrl: s.coverUrl,
      duration: s.duration,
      type: s.type,
      isEphemeral: false,
      audioUrl: s.audioUrl,
    }));
    const index = tracks.findIndex((t) => t.id === localSong.id);
    return {
      id: localSong.id,
      title: localSong.title,
      subtitle: localSong.artist,
      coverUrl: localSong.coverUrl,
      typeLabel: "Canción",
      track: tracks[index] ?? tracks[0],
      allTracks: tracks,
      index: Math.max(0, index),
    };
  }

  const exactArtist = local?.artists.find((a) => normalize(a) === q);
  if (exactArtist) {
    const artistSongs = local!.songs.filter(
      (s) => normalize(s.artist) === normalize(exactArtist),
    );
    if (artistSongs.length > 0) {
      const tracks = artistSongs.map((s) => ({
        id: s.id,
        youtubeId: s.youtubeId ?? "",
        title: s.title,
        artistName: s.artist,
        albumTitle: s.albumTitle ?? s.title,
        coverUrl: s.coverUrl,
        duration: s.duration,
        type: s.type,
        isEphemeral: false,
      }));
      return {
        id: `artist:${exactArtist}`,
        title: exactArtist,
        subtitle: "Artista",
        coverUrl: artistSongs[0].coverUrl,
        typeLabel: "Artista",
        isCircular: true,
        track: tracks[0],
        allTracks: tracks,
        index: 0,
      };
    }
  }

  const ytExact = youtubeItems.find(
    (i) =>
      normalize(i.title) === q ||
      normalize(i.channelTitle) === q ||
      normalize(i.title).startsWith(q),
  );

  if (ytExact) {
    const index = youtubeItems.findIndex(
      (i) => i.youtubeId === ytExact.youtubeId,
    );
    const track = youtubeTracks[index] ?? youtubeItemToPlayerTrack(ytExact);
    const isArtist =
      normalize(ytExact.channelTitle) === q &&
      normalize(ytExact.title) !== q;

    return {
      id: ytExact.youtubeId,
      title: isArtist ? ytExact.channelTitle : ytExact.title,
      subtitle: isArtist ? "Artista" : ytExact.channelTitle,
      coverUrl: ytExact.thumbnailUrl,
      typeLabel: isArtist
        ? "Artista"
        : ytExact.kind === "video"
          ? "Video"
          : ytExact.category === "podcast"
            ? "Podcast"
            : "Canción",
      isCircular: isArtist,
      track,
      allTracks: youtubeTracks,
      index: Math.max(0, index),
    };
  }

  if (youtubeItems.length > 0) {
    const first = youtubeItems[0];
    const track = youtubeTracks[0] ?? youtubeItemToPlayerTrack(first);
    return {
      id: first.youtubeId,
      title: first.title,
      subtitle: first.channelTitle,
      coverUrl: first.thumbnailUrl,
      typeLabel: first.kind === "video" ? "Video" : "Canción",
      track,
      allTracks: youtubeTracks,
      index: 0,
    };
  }

  return null;
}
