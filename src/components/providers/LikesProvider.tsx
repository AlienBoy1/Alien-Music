"use client";

import { createContext, useContext, useMemo } from "react";

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
