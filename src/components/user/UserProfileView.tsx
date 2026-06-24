import Image from "next/image";
import Link from "next/link";
import { ListMusic, Music2, Users } from "lucide-react";
import { SongRow } from "@/components/content/SongRow";
import type { PublicUserProfile } from "@/lib/db/users";

interface UserProfileViewProps {
  profile: PublicUserProfile;
  isAuthenticated: boolean;
}

export function UserProfileView({
  profile,
  isAuthenticated,
}: UserProfileViewProps) {
  const displayName = profile.name ?? "Miembro de la comunidad";

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-2 border-accent/30 bg-surface-highlight shadow-[0_0_30px_rgba(0,255,159,0.15)]">
          {profile.image ? (
            <Image
              src={profile.image}
              alt={displayName}
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-alien-cyan text-4xl font-bold text-black">
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-alien-cyan/80">
            Perfil público
          </p>
          <h1 className="font-display text-3xl font-bold text-alien-gradient md:text-4xl">
            {profile.username ? `@${profile.username}` : displayName}
          </h1>
          {profile.username && profile.name && (
            <p className="text-sm text-text-muted">{profile.name}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Music2 size={14} className="text-accent" />
              {profile.indexedSongs.length} canciones indexadas
            </span>
            <span className="flex items-center gap-1">
              <ListMusic size={14} className="text-accent" />
              {profile.publicPlaylists.length} playlists públicas
            </span>
            {profile.contributorPlaylistCount > 0 && (
              <span className="flex items-center gap-1">
                <Users size={14} className="text-accent" />
                {profile.contributorPlaylistCount} colaboraciones
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-bold tracking-wide">
          Descubrimientos indexados
        </h2>
        {profile.indexedSongs.length === 0 ? (
          <p className="rounded-lg bg-surface-highlight p-6 text-sm text-text-muted">
            Este usuario aún no ha indexado canciones en el catálogo comunitario.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {profile.indexedSongs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                queue={profile.indexedSongs}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold tracking-wide">
          Playlists públicas
        </h2>
        {profile.publicPlaylists.length === 0 ? (
          <p className="rounded-lg bg-surface-highlight p-6 text-sm text-text-muted">
            No hay playlists públicas visibles.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.publicPlaylists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlists/${pl.id}`}
                className="alien-card group rounded-xl p-4 transition-all hover:border-accent/30"
              >
                <div className="mb-2 flex items-center gap-2">
                  <ListMusic
                    size={18}
                    className="text-accent group-hover:drop-shadow-[0_0_6px_rgba(0,255,159,0.5)]"
                  />
                  {pl.isCollaborative && (
                    <span className="rounded-full border border-alien-cyan/30 bg-alien-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-alien-cyan">
                      Colaborativa
                    </span>
                  )}
                </div>
                <p className="font-semibold">{pl.name}</p>
                {pl.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                    {pl.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
