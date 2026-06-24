import type { AlbumGroup } from "@/lib/db/songs";
import { AlbumGroupCard } from "./AlbumGroupCard";

interface AlbumGridProps {
  groups: AlbumGroup[];
  title?: string;
}

export function AlbumGrid({ groups, title }: AlbumGridProps) {
  return (
    <section className="content-optimize">
      {title && (
        <h2 className="font-display mb-4 text-xl font-bold tracking-wide text-alien-gradient">
          {title}
        </h2>
      )}
      <div className="stagger-children grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {groups.map((group) => (
          <AlbumGroupCard
            key={`${group.artist}-${group.albumTitle}`}
            group={group}
          />
        ))}
      </div>
    </section>
  );
}
