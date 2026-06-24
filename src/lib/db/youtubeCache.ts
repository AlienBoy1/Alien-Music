import { createAdminClient } from "@/lib/supabase/admin";
import type { SearchContentFilter } from "@/lib/youtube/types";

const CACHE_TTL_HOURS = 24;

export interface CachedYoutubePayload {
  query: string;
  filter: SearchContentFilter;
  items: import("@/lib/youtube/types").YouTubeSearchItem[];
  youtubePlaylists: import("@/lib/youtube/types").YouTubePlaylistItem[];
  youtubeAlbums?: import("@/lib/youtube/types").YouTubeAlbumItem[];
  nextPageToken?: string;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function cacheExpiresAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + CACHE_TTL_HOURS);
  return d.toISOString();
}

export async function getYoutubeSearchCache(
  query: string,
  filter: SearchContentFilter,
  pageToken?: string,
  maxResults = 25,
): Promise<CachedYoutubePayload | null> {
  const supabase = createAdminClient();
  const queryText = normalizeQuery(query);
  const token = pageToken ?? "";

  const { data, error } = await supabase
    .from("youtube_cache")
    .select("response_json, expires_at")
    .eq("query_text", queryText)
    .eq("filter_type", filter)
    .eq("page_token", token)
    .eq("max_results", maxResults)
    .maybeSingle();

  if (error || !data) return null;

  if (new Date(data.expires_at as string) <= new Date()) {
    void supabase
      .from("youtube_cache")
      .delete()
      .eq("query_text", queryText)
      .eq("filter_type", filter)
      .eq("page_token", token)
      .eq("max_results", maxResults);
    return null;
  }

  return data.response_json as CachedYoutubePayload;
}

export async function setYoutubeSearchCache(
  query: string,
  filter: SearchContentFilter,
  payload: CachedYoutubePayload,
  pageToken?: string,
  maxResults = 25,
): Promise<void> {
  const supabase = createAdminClient();
  const queryText = normalizeQuery(query);
  const token = pageToken ?? "";

  await supabase.from("youtube_cache").upsert(
    {
      query_text: queryText,
      filter_type: filter,
      page_token: token,
      max_results: maxResults,
      response_json: payload,
      expires_at: cacheExpiresAt(),
    },
    { onConflict: "query_text,filter_type,page_token,max_results" },
  );
}
