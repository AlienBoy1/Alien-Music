"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { SongRow } from "@/components/content/SongRow";
import { searchMusicAction } from "@/app/actions/search";
import { useSearchStore } from "@/lib/stores/searchStore";
import type { Playlist, SearchResult } from "@/types/music";

interface SearchPageClientProps {
  playlists?: Playlist[];
}

export default function SearchPageClient({
  playlists = [],
}: SearchPageClientProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const storeQuery = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const activeQuery = urlQuery || storeQuery;

  useEffect(() => {
    if (urlQuery) setQuery(urlQuery);
  }, [urlQuery, setQuery]);

  useEffect(() => {
    if (!activeQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      void searchMusicAction(activeQuery).then((data) => {
        setResults(data);
        setLoading(false);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [activeQuery]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Buscar"
        subtitle={
          activeQuery
            ? `Resultados para "${activeQuery}"`
            : "Encuentra álbumes, artistas y canciones"
        }
        showFeedback={false}
      />

      {loading && <p className="text-text-muted">Buscando...</p>}

      {!loading && !activeQuery.trim() && (
        <p className="text-text-muted">
          Escribe en la barra de búsqueda para encontrar música.
        </p>
      )}

      {!loading && activeQuery.trim() && results && (
        <div className="space-y-8">
          {results.songs.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">Canciones</h2>
              <div className="flex flex-col gap-1">
                {results.songs.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={i}
                    queue={results.songs}
                    playlists={playlists}
                    isAuthenticated={!!session}
                  />
                ))}
              </div>
            </section>
          )}

          {results.artists.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">Artistas</h2>
              <div className="flex flex-wrap gap-2">
                {results.artists.map((artist) => (
                  <span
                    key={artist}
                    className="rounded-full bg-surface-highlight px-4 py-2 text-sm"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            </section>
          )}

          {results.albums.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">Álbumes</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {results.albums.map((album) => (
                  <div key={`${album.artist}-${album.title}`} className="text-sm">
                    <p className="font-medium">{album.title}</p>
                    <p className="text-text-muted">{album.artist}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.songs.length === 0 &&
            results.artists.length === 0 &&
            results.albums.length === 0 && (
              <p className="text-text-muted">
                No se encontraron resultados para &quot;{activeQuery}&quot;.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
