import { ContentHeader } from "@/components/content/ContentHeader";
import { AlbumGrid } from "@/components/content/AlbumGrid";
import { RecentlyPlayedSection } from "@/components/content/RecentlyPlayedSection";
import { CommunityTrackGrid } from "@/components/content/CommunityTrackGrid";
import {
  getAlbumGroups,
  getRecentlyPlayed,
  type AlbumGroup,
} from "@/lib/db/songs";
import {
  getCommunityTrending,
  getLatestDiscoveries,
} from "@/lib/db/community";
import type { Song } from "@/types/music";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  let groups: AlbumGroup[] = [];
  let recentlyPlayed: Song[] = [];
  let trending: Song[] = [];
  let discoveries: Song[] = [];

  try {
    [groups, trending, discoveries] = await Promise.all([
      getAlbumGroups(),
      getCommunityTrending(12),
      getLatestDiscoveries(12),
    ]);
    if (session?.user?.id) {
      recentlyPlayed = await getRecentlyPlayed(session.user.id);
    }
  } catch {
    groups = [];
    recentlyPlayed = [];
    trending = [];
    discoveries = [];
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Alien Music"
        subtitle={
          session
            ? `Bienvenido, ${session.user?.name ?? "usuario"}`
            : "Explora lo que la comunidad está descubriendo"
        }
      />

      {session?.user?.id && recentlyPlayed.length > 0 && (
        <RecentlyPlayedSection
          userId={session.user.id}
          initialSongs={recentlyPlayed}
        />
      )}

      <CommunityTrackGrid songs={trending} title="Tendencias de la Comunidad" />
      <CommunityTrackGrid songs={discoveries} title="Últimos Descubrimientos" />

      {groups.length > 0 && (
        <AlbumGrid groups={groups} title="Catálogo completo" />
      )}

      {groups.length === 0 && trending.length === 0 && discoveries.length === 0 && (
        <p className="text-text-muted">
          Busca música en la barra superior para empezar a construir el catálogo comunitario.
        </p>
      )}
    </div>
  );
}
