"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { SongRow } from "@/components/content/SongRow";
import { SearchFilterPills } from "@/components/search/SearchFilterPills";
import { SearchTopResult } from "@/components/search/SearchTopResult";
import {
  SearchHorizontalCarousel,
  type CarouselCard,
} from "@/components/search/SearchHorizontalCarousel";
import { SearchVideoCarousel } from "@/components/search/SearchVideoCarousel";
import { searchMusicAction } from "@/app/actions/search";
import { pickSearchTopResult } from "@/lib/search/topResult";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useOfflineStore } from "@/lib/stores/offlineStore";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { CommunityPlaylistHit } from "@/lib/db/community";
import type {
  SearchContentFilter,
  YouTubePlaylistItem,
  YouTubeSearchItem,
} from "@/lib/youtube/types";
import type { Playlist, PlayerTrack, SearchResult } from "@/types/music";
import { songToPlayerTrack, youtubeItemToPlayerTrack } from "@/types/music";

interface SearchPageClientProps {
  playlists?: Playlist[];
  currentUserId?: string;
}

interface YouTubeApiResponse {
  items: YouTubeSearchItem[];
  youtubePlaylists: YouTubePlaylistItem[];
  communityPlaylists: CommunityPlaylistHit[];
  nextPageToken?: string;
  error?: string;
}

function mergeUnique<T>(prev: T[], incoming: T[], getId: (item: T) => string): T[] {
  const seen = new Set(prev.map(getId));
  const merged = [...prev];
  for (const item of incoming) {
    const id = getId(item);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }
  return merged;
}

const VALID_FILTERS: SearchContentFilter[] = [
  "all",
  "songs",
  "videos",
  "playlists",
  "podcasts",
];

export default function SearchPageClient({
  playlists = [],
  currentUserId,
}: SearchPageClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlFilter = searchParams.get("filter") ?? "all";
  const storeQuery = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const isOnline = useOfflineStore((s) => s.isOnline);
  const playCollection = usePlayerStore((s) => s.playCollection);

  const [filter, setFilter] = useState<SearchContentFilter>(
    VALID_FILTERS.includes(urlFilter as SearchContentFilter)
      ? (urlFilter as SearchContentFilter)
      : "all",
  );
  const [localResults, setLocalResults] = useState<SearchResult | null>(null);
  const [youtubeItems, setYoutubeItems] = useState<YouTubeSearchItem[]>([]);
  const [youtubePlaylists, setYoutubePlaylists] = useState<YouTubePlaylistItem[]>([]);
  const [communityPlaylists, setCommunityPlaylists] = useState<CommunityPlaylistHit[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeQuery = urlQuery || storeQuery;
  const debouncedQuery = useDebounce(activeQuery, 300);

  useEffect(() => {
    if (urlQuery) setQuery(urlQuery);
  }, [urlQuery, setQuery]);

  useEffect(() => {
    if (VALID_FILTERS.includes(urlFilter as SearchContentFilter)) {
      setFilter(urlFilter as SearchContentFilter);
    }
  }, [urlFilter]);

  const updateFilter = (next: SearchContentFilter) => {
    setFilter(next);
    const q = activeQuery.trim();
    if (q) {
      router.replace(
        `/search?q=${encodeURIComponent(q)}&filter=${next}`,
        { scroll: false },
      );
    }
  };

  const fetchYoutube = useCallback(
    async (q: string, pageToken?: string, append = false) => {
      if (!navigator.onLine) return;
      const params = new URLSearchParams({
        q,
        filter,
        maxResults: "25",
      });
      if (pageToken) params.set("pageToken", pageToken);

      const res = await fetch(`/api/search/youtube?${params.toString()}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Error al buscar en YouTube");
      }

      const data = (await res.json()) as YouTubeApiResponse;

      setYoutubeItems((prev) =>
        append
          ? mergeUnique(prev, data.items ?? [], (i) => i.youtubeId)
          : data.items ?? [],
      );
      setYoutubePlaylists((prev) =>
        append
          ? mergeUnique(prev, data.youtubePlaylists ?? [], (p) => p.playlistId)
          : data.youtubePlaylists ?? [],
      );
      if (!append) {
        setCommunityPlaylists(data.communityPlaylists ?? []);
      }
      setNextPageToken(data.nextPageToken);
    },
    [filter],
  );

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setLocalResults(null);
      setYoutubeItems([]);
      setYoutubePlaylists([]);
      setCommunityPlaylists([]);
      setNextPageToken(undefined);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const local =
          filter === "playlists"
            ? { songs: [], artists: [], albums: [] }
            : await searchMusicAction(q);

        if (cancelled) return;
        setLocalResults(local);
        if (isOnline) {
          await fetchYoutube(q);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "No se pudo completar la búsqueda");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, filter, fetchYoutube, isOnline]);

  const loadMore = useCallback(async () => {
    const q = debouncedQuery.trim();
    if (!q || !nextPageToken || loadingMore) return;

    setLoadingMore(true);
    try {
      await fetchYoutube(q, nextPageToken, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar más");
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedQuery, nextPageToken, loadingMore, fetchYoutube]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: () => void loadMore(),
    hasMore: Boolean(nextPageToken),
    loading: loadingMore || loading,
  });

  const youtubeTracks: PlayerTrack[] = useMemo(
    () =>
      youtubeItems.map((item) =>
        youtubeItemToPlayerTrack(
          item,
          item.kind === "video" ? "video" : "audio",
        ),
      ),
    [youtubeItems],
  );

  const topResult = useMemo(
    () =>
      debouncedQuery.trim()
        ? pickSearchTopResult(
            debouncedQuery,
            localResults,
            youtubeItems,
            youtubeTracks,
          )
        : null,
    [debouncedQuery, localResults, youtubeItems, youtubeTracks],
  );

  const videoItems = useMemo(
    () => youtubeItems.filter((i) => i.kind === "video"),
    [youtubeItems],
  );

  const songItems = useMemo(
    () =>
      youtubeItems.filter(
        (i) => i.kind !== "video" && i.category !== "podcast",
      ),
    [youtubeItems],
  );

  const albumCards: CarouselCard[] = useMemo(() => {
    const localAlbums =
      localResults?.albums.map((a) => ({
        id: `album:${a.title}:${a.artist}`,
        title: a.title,
        subtitle: a.artist,
        imageUrl: a.coverUrl,
        onClick: () => {
          const songs = localResults?.songs.filter(
            (s) => s.albumTitle === a.title && s.artist === a.artist,
          );
          if (songs?.length) {
            playCollection(songs.map(songToPlayerTrack), 0);
          }
        },
      })) ?? [];

    return localAlbums;
  }, [localResults, playCollection]);

  const artistCards: CarouselCard[] = useMemo(() => {
    const fromLocal =
      localResults?.artists.map((name) => {
        const songs =
          localResults?.songs.filter((s) => s.artist === name) ?? [];
        const cover = songs[0]?.coverUrl;
        return {
          id: `artist:${name}`,
          title: name,
          subtitle: "Artista",
          imageUrl: cover,
          isCircular: true,
          onClick: () => {
            if (songs.length) {
              playCollection(songs.map(songToPlayerTrack), 0);
            }
          },
        };
      }) ?? [];

    const seen = new Set(fromLocal.map((a) => a.title.toLowerCase()));
    const fromYt = youtubeItems
      .filter((i) => !seen.has(i.channelTitle.toLowerCase()))
      .slice(0, 8)
      .map((i) => ({
        id: `yt-artist:${i.channelTitle}`,
        title: i.channelTitle,
        subtitle: "Artista",
        imageUrl: i.thumbnailUrl,
        isCircular: true,
        onClick: () => {
          const related = youtubeItems.filter(
            (x) => x.channelTitle === i.channelTitle,
          );
          playCollection(
            related.map((r) => youtubeItemToPlayerTrack(r)),
            0,
          );
        },
      }));

    return [...fromLocal, ...fromYt].slice(0, 12);
  }, [localResults, youtubeItems, playCollection]);

  const playlistCards: CarouselCard[] = useMemo(() => {
    const community: CarouselCard[] = communityPlaylists.map((pl) => ({
      id: pl.id,
      title: pl.name,
      subtitle: "Playlist comunitaria",
      href: `/playlists/${pl.id}`,
    }));

    const yt: CarouselCard[] = youtubePlaylists.map((pl) => ({
      id: pl.playlistId,
      title: pl.title,
      subtitle: pl.channelTitle,
      imageUrl: pl.thumbnailUrl,
    }));

    return [...community, ...yt];
  }, [communityPlaylists, youtubePlaylists]);

  const showPlaylists = filter === "all" || filter === "playlists";
  const showVideos =
    filter === "all" || filter === "songs" || filter === "videos" || filter === "podcasts";

  const isEmpty =
    !loading &&
    debouncedQuery.trim() &&
    youtubeItems.length === 0 &&
    youtubePlaylists.length === 0 &&
    communityPlaylists.length === 0 &&
    (!localResults || localResults.songs.length === 0);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Buscar"
        subtitle={
          activeQuery
            ? `Resultados para "${activeQuery}"`
            : "Explora YouTube y el catálogo comunitario"
        }
        showFeedback={false}
      />

      <SearchFilterPills value={filter} onChange={updateFilter} />

      {!isOnline && (
        <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
          Modo offline — YouTube desactivado. Reproduce descargas desde Tu biblioteca.
        </div>
      )}

      {loading && youtubeItems.length === 0 && (
        <div className="flex items-center gap-3 py-8">
          <div className="alien-loader" />
          <p className="font-display text-sm tracking-wide text-alien-gradient">
            Escaneando el universo musical...
          </p>
        </div>
      )}

      {!loading && !activeQuery.trim() && (
        <p className="text-text-muted">
          Escribe en la barra superior y elige un filtro para explorar sin límites.
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {!loading && debouncedQuery.trim() && (
        <div className="space-y-2 animate-fade-in-up">
          {topResult && filter !== "playlists" && (
            <SearchTopResult result={topResult} />
          )}

          {showPlaylists && playlistCards.length > 0 && (
            <SearchHorizontalCarousel
              title="Playlists públicas"
              items={playlistCards}
            />
          )}

          {filter !== "playlists" && albumCards.length > 0 && (
            <SearchHorizontalCarousel title="Álbumes" items={albumCards} />
          )}

          {filter !== "playlists" && artistCards.length > 0 && (
            <SearchHorizontalCarousel
              title="Artistas relacionados"
              items={artistCards}
            />
          )}

          {showVideos && videoItems.length > 0 && (
            <SearchVideoCarousel items={videoItems} allTracks={youtubeTracks} />
          )}

          {showVideos && songItems.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-white">Canciones</h2>
              <div className="flex flex-col gap-0.5">
                {songItems.slice(0, 15).map((item, i) => {
                  const trackIndex = youtubeItems.findIndex(
                    (x) => x.youtubeId === item.youtubeId,
                  );
                  const track = youtubeTracks[trackIndex];
                  if (!track) return null;
                  return (
                    <button
                      key={item.youtubeId}
                      type="button"
                      onClick={() =>
                        playCollection(youtubeTracks, trackIndex)
                      }
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-highlight"
                    >
                      <span className="w-5 text-center text-sm text-text-muted">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-white">
                        {item.title}
                      </span>
                      <span className="truncate text-xs text-text-muted">
                        {item.channelTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {filter === "all" && localResults && localResults.songs.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-bold text-white">Catálogo local</h2>
              <div className="flex flex-col gap-0.5">
                {localResults.songs.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={i}
                    queue={localResults.songs}
                    playlists={playlists}
                    isAuthenticated={!!session}
                  />
                ))}
              </div>
            </section>
          )}

          {isEmpty && (
            <p className="text-text-muted">
              No se encontraron resultados para &quot;{debouncedQuery}&quot;.
            </p>
          )}

          {nextPageToken && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loadingMore && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <div className="alien-loader h-6 w-6" />
                  Cargando más...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
