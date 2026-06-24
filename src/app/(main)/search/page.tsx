import { Suspense } from "react";
import { auth } from "@/auth";
import { getWritablePlaylists } from "@/lib/db/playlists";
import type { Playlist } from "@/types/music";
import SearchPageClient from "./SearchPageClient";

export default async function SearchPage() {
  const session = await auth();
  let playlists: Playlist[] = [];

  if (session?.user?.id) {
    try {
      playlists = await getWritablePlaylists(session.user.id);
    } catch {
      playlists = [];
    }
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 text-text-muted">Cargando búsqueda...</div>
      }
    >
      <SearchPageClient
        playlists={playlists}
        currentUserId={session?.user?.id}
      />
    </Suspense>
  );
}
