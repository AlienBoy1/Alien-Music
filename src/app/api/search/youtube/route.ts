import { NextRequest, NextResponse } from "next/server";
import { searchYouTubeContent } from "@/lib/youtube/search";
import { searchCommunityPlaylists } from "@/lib/db/community";
import {
  getYoutubeSearchCache,
  setYoutubeSearchCache,
} from "@/lib/db/youtubeCache";
import type { SearchContentFilter } from "@/lib/youtube/types";

export const runtime = "nodejs";

const VALID_FILTERS: SearchContentFilter[] = [
  "all",
  "songs",
  "videos",
  "playlists",
  "podcasts",
];

/**
 * GET /api/search/youtube?q=term&filter=...&pageToken=...
 * Usa caché Supabase (24h) antes de consumir cuota de YouTube.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API no configurada en el servidor" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? "";
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const rawFilter = searchParams.get("filter") ?? "all";
  const filter = VALID_FILTERS.includes(rawFilter as SearchContentFilter)
    ? (rawFilter as SearchContentFilter)
    : "all";
  const maxResults = Math.min(
    parseInt(searchParams.get("maxResults") ?? "25", 10) || 25,
    50,
  );

  if (!query.trim()) {
    return NextResponse.json(
      { error: "Parámetro q requerido" },
      { status: 400 },
    );
  }

  try {
    const cached = await getYoutubeSearchCache(
      query,
      filter,
      pageToken,
      maxResults,
    );

    let youtubePayload = cached;

    if (!youtubePayload) {
      const result = await searchYouTubeContent({
        query,
        filter,
        maxResults,
        pageToken,
        apiKey,
      });

      youtubePayload = {
        query: result.query,
        filter: result.filter,
        items: result.items,
        youtubePlaylists: result.youtubePlaylists,
        youtubeAlbums: result.youtubeAlbums ?? [],
        nextPageToken: result.nextPageToken,
      };

      await setYoutubeSearchCache(
        query,
        filter,
        youtubePayload,
        pageToken,
        maxResults,
      );
    }

    let communityPlaylists: Awaited<
      ReturnType<typeof searchCommunityPlaylists>
    > = [];

    if (filter === "playlists" || filter === "all") {
      communityPlaylists = await searchCommunityPlaylists(query, 12);
    }

    return NextResponse.json({
      ...youtubePayload,
      communityPlaylists,
      cached: Boolean(cached),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al buscar en YouTube";
    console.error("[youtube/search]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
