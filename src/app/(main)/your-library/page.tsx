import { ContentHeader } from "@/components/content/ContentHeader";
import { SongRow } from "@/components/content/SongRow";
import { getLikedSongs } from "@/lib/db/songs";
import { getUserPlaylists } from "@/lib/db/playlists";
import { auth } from "@/auth";

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
        subtitle={`${likedSongs.length} canciones que te gustan`}
        showFeedback={false}
      />

      {likedSongs.length === 0 ? (
        <div className="rounded-lg bg-surface-highlight p-8 text-center">
          <p className="text-lg font-medium">Aún no tienes favoritos</p>
          <p className="mt-2 text-sm text-text-muted">
            Pulsa el corazón en cualquier canción para guardarla aquí.
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
    </div>
  );
}
