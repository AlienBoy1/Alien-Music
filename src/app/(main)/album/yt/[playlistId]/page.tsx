import { auth } from "@/auth";
import { getWritablePlaylists } from "@/lib/db/playlists";
import { AlbumPageClient } from "./AlbumPageClient";

interface AlbumPageProps {
  params: Promise<{ playlistId: string }>;
}

export default async function YouTubeAlbumPage({ params }: AlbumPageProps) {
  const { playlistId } = await params;
  const session = await auth();
  const playlists = session?.user?.id
    ? await getWritablePlaylists(session.user.id)
    : [];

  return (
    <AlbumPageClient
      playlistId={playlistId}
      playlists={playlists}
      isAuthenticated={!!session}
    />
  );
}
