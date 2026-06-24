import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaylistForViewer } from "@/lib/db/playlists";
import { auth } from "@/auth";
import { PlaylistEditor } from "@/components/playlists/PlaylistEditor";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistDetailPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const session = await auth();
  const playlist = await getPlaylistForViewer(id, session?.user?.id);

  if (!playlist) notFound();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {!playlist.canEdit && (
        <p className="mb-4 text-sm text-text-muted">
          Playlist pública
          {playlist.isCollaborative && playlist.canContribute && (
            <> · Puedes añadir canciones desde la búsqueda</>
          )}
          {" · "}
          <Link
            href={`/user/${playlist.userId}`}
            className="text-accent hover:underline"
          >
            Ver perfil del creador
          </Link>
        </p>
      )}
      <PlaylistEditor playlist={playlist} canEdit={playlist.canEdit} />
    </div>
  );
}
