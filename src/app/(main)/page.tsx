import { ContentHeader } from "@/components/content/ContentHeader";
import { AlbumGrid } from "@/components/content/AlbumGrid";
import { RecentlyPlayedSection } from "@/components/content/RecentlyPlayedSection";
import { getAlbumGroups, getRecentlyPlayed, type AlbumGroup } from "@/lib/db/songs";
import type { Song } from "@/types/music";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  let groups: AlbumGroup[] = [];
  let recentlyPlayed: Song[] = [];

  try {
    groups = await getAlbumGroups();
    if (session?.user?.id) {
      recentlyPlayed = await getRecentlyPlayed(session.user.id);
    }
  } catch {
    groups = [];
    recentlyPlayed = [];
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="All / Artists"
        subtitle={
          session
            ? `Bienvenido, ${session.user?.name ?? "usuario"}`
            : "Explora música — inicia sesión para ver tu historial"
        }
      />

      {session?.user?.id && recentlyPlayed.length > 0 && (
        <RecentlyPlayedSection
          userId={session.user.id}
          initialSongs={recentlyPlayed}
        />
      )}

      {groups.length === 0 ? (
        <p className="text-text-muted">
          No hay canciones disponibles. Ejecuta las migraciones de Supabase.
        </p>
      ) : (
        <AlbumGrid groups={groups} title="Todos los álbumes" />
      )}
    </div>
  );
}
