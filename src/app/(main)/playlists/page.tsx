import Link from "next/link";
import { ListMusic, Plus } from "lucide-react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { getUserPlaylists } from "@/lib/db/playlists";
import { auth } from "@/auth";

export default async function PlaylistsPage() {
  const session = await auth();
  const playlists = await getUserPlaylists(session!.user!.id);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ContentHeader
        title="Tus Playlists"
        subtitle={`${playlists.length} playlist${playlists.length !== 1 ? "s" : ""}`}
        showFeedback={false}
      />

      {playlists.length === 0 ? (
        <div className="rounded-lg bg-surface-highlight p-8 text-center">
          <ListMusic size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="text-lg font-medium">No tienes playlists</p>
          <p className="mt-2 text-sm text-text-muted">
            Usa el botón &quot;Crear playlist&quot; en la barra lateral.
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/playlists/${pl.id}`}
              className="flex items-center gap-4 rounded-lg bg-surface-highlight p-4 transition-colors hover:bg-surface-hover"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded bg-surface-elevated">
                <ListMusic size={24} className="text-text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{pl.name}</p>
                <p className="text-sm text-text-muted">
                  {pl.description || "Sin descripción"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/playlists/new"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black hover:bg-accent-hover"
      >
        <Plus size={18} />
        Nueva playlist
      </Link>
    </div>
  );
}
