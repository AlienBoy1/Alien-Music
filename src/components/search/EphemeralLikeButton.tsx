"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleLikeSong } from "@/app/actions/likes";
import { indexSong } from "@/app/actions/indexSong";
import { useLikesContext } from "@/components/providers/LikesProvider";
import { usePlayerStore } from "@/lib/stores/playerStore";
import type { PlayerTrack } from "@/types/music";
import { isEphemeralTrackId } from "@/types/music";

interface EphemeralLikeButtonProps {
  track: PlayerTrack;
  size?: number;
  className?: string;
}

export function EphemeralLikeButton({
  track,
  size = 16,
  className = "",
}: EphemeralLikeButtonProps) {
  const router = useRouter();
  const { likedSongIds, isAuthenticated } = useLikesContext();
  const promoteEphemeralTrack = usePlayerStore((s) => s.promoteEphemeralTrack);

  const songId = track.id;
  const isLiked = likedSongIds.has(songId);
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(isLiked);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked);

      let resolvedId = songId;

      if (track.isEphemeral || isEphemeralTrackId(songId)) {
        const indexed = await indexSong(track);
        if (indexed.error || !indexed.data?.songId) {
          setOptimisticLiked(optimisticLiked);
          return;
        }
        resolvedId = indexed.data.songId;
        promoteEphemeralTrack(track.youtubeId, resolvedId);
      }

      const result = await toggleLikeSong(resolvedId);
      if (result.error) {
        setOptimisticLiked(optimisticLiked);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`transition-all duration-200 hover:text-accent hover:drop-shadow-[0_0_6px_rgba(0,255,159,0.5)] disabled:opacity-50 ${
        optimisticLiked
          ? "text-accent drop-shadow-[0_0_8px_rgba(0,255,159,0.4)]"
          : "text-text-muted opacity-0 group-hover:opacity-100"
      } ${className}`}
      aria-label={optimisticLiked ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      <Heart size={size} fill={optimisticLiked ? "currentColor" : "none"} />
    </button>
  );
}
