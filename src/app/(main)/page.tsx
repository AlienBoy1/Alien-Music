import { ContentHeader } from "@/components/content/ContentHeader";
import { CommunityTrackGrid } from "@/components/content/CommunityTrackGrid";
import { HomeQuickAccessGrid } from "@/components/home/HomeQuickAccessGrid";
import {
  getRecentlyPlayed,
} from "@/lib/db/songs";
import {
  getCommunityTrending,
  getLatestDiscoveries,
} from "@/lib/db/community";
import { getUserPlaylists } from "@/lib/db/playlists";
import type { Song, Playlist } from "@/types/music";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  let recentlyPlayed: Song[] = [];
  let trending: Song[] = [];
  let discoveries: Song[] = [];
  let playlists: Playlist[] = [];

  try {
    [trending, discoveries] = await Promise.all([
      getCommunityTrending(16),
      getLatestDiscoveries(16),
    ]);
    if (session?.user?.id) {
      [recentlyPlayed, playlists] = await Promise.all([
        getRecentlyPlayed(session.user.id, 12),
        getUserPlaylists(session.user.id),
      ]);
    }
  } catch {
    recentlyPlayed = [];
    trending = [];
    discoveries = [];
    playlists = [];
  }

  const hasContent =
    trending.length > 0 ||
    discoveries.length > 0 ||
    recentlyPlayed.length > 0 ||
    playlists.length > 0;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Alien Music"
        subtitle={
          session
            ? `Bienvenido de vuelta, ${session.user?.name?.split(" ")[0] ?? "usuario"}`
            : "Explora lo que la comunidad está descubriendo"
        }
      />

      {(recentlyPlayed.length > 0 || playlists.length > 0) && (
        <HomeQuickAccessGrid
          recentlyPlayed={recentlyPlayed}
          playlists={playlists}
        />
      )}

      <CommunityTrackGrid songs={discoveries} title="Nuevos lanzamientos" />

      {session?.user?.id && recentlyPlayed.length > 0 && (
        <CommunityTrackGrid
          songs={recentlyPlayed}
          title="Vuelve a tu música"
        />
      )}

      <CommunityTrackGrid
        songs={trending}
        title="Tendencias de la Comunidad"
      />

      {!hasContent && (
        <p className="text-text-muted">
          Busca música en la barra superior para empezar a construir el catálogo comunitario.
        </p>
      )}
    </div>
  );
}
