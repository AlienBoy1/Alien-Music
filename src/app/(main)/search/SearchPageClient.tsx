"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { SongRow } from "@/components/content/SongRow";
import { YouTubeSearchRow } from "@/components/search/YouTubeSearchRow";
import { SearchFilterPills } from "@/components/search/SearchFilterPills";
import { PlaylistSearchRow } from "@/components/search/PlaylistSearchRow";
import { searchMusicAction } from "@/app/actions/search";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { CommunityPlaylistHit } from "@/lib/db/community";
import type {
  SearchContentFilter,
  YouTubePlaylistItem,
  YouTubeSearchItem,
} from "@/lib/youtube/types";
import type { Playlist, PlayerTrack, SearchResult } from "@/types/music";
import { youtubeItemToPlayerTrack } from "@/types/music";

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
          filter === "playlists" ? { songs: [], artists: [], albums: [] } : await searchMusicAction(q);

        if (cancelled) return;
        setLocalResults(local);
        await fetchYoutube(q);
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
  }, [debouncedQuery, filter, fetchYoutube]);

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

  const showVideos =
    filter === "all" || filter === "songs" || filter === "videos" || filter === "podcasts";
  const showPlaylists = filter === "all" || filter === "playlists";

  const isEmpty =
    !loading &&
    debouncedQuery.trim() &&
    youtubeItems.length === 0 &&
    youtubePlaylists.length === 0 &&
    communityPlaylists.length === 0 &&
    (!localResults || localResults.songs.length === 0);

  const sectionTitle =
    filter === "podcasts"
      ? "Podcasts"
      : filter === "videos"
        ? "Videos"
        : filter === "songs"
          ? "Canciones"
          : "Canciones / Videos";

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
        <div className="space-y-8 animate-fade-in-up">
          {showPlaylists &&
            (communityPlaylists.length > 0 || youtubePlaylists.length > 0) && (
              <section>
                <h2 className="font-display mb-4 text-xl font-bold tracking-wide text-alien-gradient">
                  Playlists
                </h2>
                <div className="flex flex-col gap-1">
                  {communityPlaylists.map((pl) => (
                    <PlaylistSearchRow key={pl.id} community={pl} />
                  ))}
                  {youtubePlaylists.map((pl) => (
                    <PlaylistSearchRow
                      key={pl.playlistId}
                      youtube={pl}
                    />
                  ))}
                </div>
              </section>
            )}

          {showVideos && youtubeItems.length > 0 && (
            <section className="content-optimize">
              <h2 className="font-display mb-4 text-xl font-bold tracking-wide text-alien-gradient beam-underline inline-block">
                {sectionTitle}
              </h2>
              <div className="flex flex-col gap-1">
                {youtubeItems.map((item, i) => (
                  <YouTubeSearchRow
                    key={item.youtubeId}
                    item={item}
                    track={youtubeTracks[i]}
                    index={i}
                    allTracks={youtubeTracks}
                    playlists={playlists}
                    isAuthenticated={!!session}
                    currentUserId={currentUserId ?? session?.user?.id}
                  />
                ))}
              </div>
            </section>
          )}

          {filter === "all" && localResults && localResults.songs.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-lg font-bold tracking-wide text-text-muted">
                Catálogo local
              </h2>
              <div className="flex flex-col gap-1">
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
