import type { AlbumGroup } from "@/lib/db/songs";
import { AlbumGroupCard } from "./AlbumGroupCard";

interface AlbumGridProps {
  groups: AlbumGroup[];
  title?: string;
}

export function AlbumGrid({ groups, title }: AlbumGridProps) {
  return (
    <section>
      {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
