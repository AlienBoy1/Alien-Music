"use server";

import { searchSongs } from "@/lib/db/songs";
import type { SearchResult } from "@/types/music";

export async function searchMusicAction(query: string): Promise<SearchResult> {
  try {
    return await searchSongs(query);
  } catch {
    return { songs: [], artists: [], albums: [] };
  }
}
