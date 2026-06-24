import { auth } from "@/auth";
import { LikesProvider } from "@/components/providers/LikesProvider";
import { AppShell } from "@/components/layout/AppShell";
import { getLikedSongIds } from "@/lib/db/songs";
import { getWritablePlaylists } from "@/lib/db/playlists";
import type { Playlist } from "@/types/music";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  let likedSongIds: string[] = [];
  let playlists: Playlist[] = [];

  if (userId) {
    try {
      [likedSongIds, playlists] = await Promise.all([
        getLikedSongIds(userId),
        getWritablePlaylists(userId),
      ]);
    } catch {
      // DB no configurada aún — la app sigue funcionando en modo degradado
    }
  }

  return (
    <LikesProvider likedSongIds={likedSongIds} isAuthenticated={!!session}>
      <AppShell session={session} playlists={playlists}>
        {children}
      </AppShell>
    </LikesProvider>
  );
}
