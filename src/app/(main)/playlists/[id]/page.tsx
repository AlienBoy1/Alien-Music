import { notFound } from "next/navigation";
import { getPlaylistById } from "@/lib/db/playlists";
import { auth } from "@/auth";
import { PlaylistEditor } from "@/components/playlists/PlaylistEditor";

interface PlaylistPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistDetailPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const session = await auth();
  const playlist = await getPlaylistById(id, session!.user!.id);

  if (!playlist) notFound();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PlaylistEditor playlist={playlist} />
    </div>
  );
}
