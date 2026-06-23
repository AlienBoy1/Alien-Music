"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleLikeSong } from "@/app/actions/likes";
import { useLikesContext } from "@/components/providers/LikesProvider";

interface LikeButtonProps {
  songId: string;
  size?: number;
  className?: string;
}

export function LikeButton({ songId, size = 16, className = "" }: LikeButtonProps) {
  const router = useRouter();
  const { likedSongIds, isAuthenticated } = useLikesContext();
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
      const result = await toggleLikeSong(songId);
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
      className={`transition-colors hover:text-accent disabled:opacity-50 ${
        optimisticLiked ? "text-accent" : "text-text-muted"
      } ${className}`}
      aria-label={optimisticLiked ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      <Heart size={size} fill={optimisticLiked ? "currentColor" : "none"} />
    </button>
  );
}
