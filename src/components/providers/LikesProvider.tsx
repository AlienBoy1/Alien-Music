"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface LikesContextValue {
  likedSongIds: Set<string>;
  isAuthenticated: boolean;
}

const LikesContext = createContext<LikesContextValue>({
  likedSongIds: new Set(),
  isAuthenticated: false,
});

export function LikesProvider({
  children,
  likedSongIds,
  isAuthenticated,
}: {
  children: React.ReactNode;
  likedSongIds: string[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const onLikesChanged = () => router.refresh();
    window.addEventListener("alien:likes-changed", onLikesChanged);
    return () => window.removeEventListener("alien:likes-changed", onLikesChanged);
  }, [router]);

  const value = useMemo(
    () => ({
      likedSongIds: new Set(likedSongIds),
      isAuthenticated,
    }),
    [likedSongIds, isAuthenticated],
  );

  return (
    <LikesContext.Provider value={value}>{children}</LikesContext.Provider>
  );
}

export function useLikesContext() {
  return useContext(LikesContext);
}
