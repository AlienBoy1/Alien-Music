import Link from "next/link";
import { ContentHeader } from "@/components/content/ContentHeader";
import { SongRow } from "@/components/content/SongRow";
import { DownloadsLibrary } from "@/components/offline/DownloadsLibrary";
import { getLikedSongs } from "@/lib/db/songs";
import { getUserPlaylists } from "@/lib/db/playlists";
import { auth } from "@/auth";
import { ListMusic, Heart } from "lucide-react";

export default async function YourLibraryPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [likedSongs, playlists] = await Promise.all([
    getLikedSongs(userId),
    getUserPlaylists(userId),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Tu Biblioteca"
        subtitle={`${likedSongs.length} favoritos · ${playlists.length} playlists`}
        showFeedback={false}
      />

      <DownloadsLibrary />

      {playlists.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-bold tracking-wide text-alien-gradient">
            <ListMusic size={20} />
            Tus Playlists
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {playlists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlists/${pl.id}`}
                className="alien-card group rounded-xl p-4 transition-transform duration-200 hover:scale-[1.02]"
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-surface-highlight text-accent group-hover:shadow-[0_0_16px_rgba(0,255,159,0.15)]">
                  <ListMusic size={32} />
                </div>
                <p className="truncate text-sm font-medium group-hover:text-accent">
                  {pl.name}
                </p>
                <p className="text-xs text-text-muted">
                  {pl.isPublic ? "Pública" : "Privada"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-bold tracking-wide text-alien-gradient">
          <Heart size={20} />
          Canciones que te gustan
        </h2>

        {likedSongs.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-highlight/50 p-8 text-center">
            <p className="text-lg font-medium">Aún no tienes favoritos</p>
            <p className="mt-2 text-sm text-text-muted">
              Pulsa el corazón en cualquier canción o indexa descubrimientos desde la búsqueda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {likedSongs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                queue={likedSongs}
                playlists={playlists}
                isAuthenticated
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
