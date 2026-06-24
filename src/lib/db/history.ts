import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbSong } from "@/lib/supabase/mappers";
import type { Song } from "@/types/music";

export type HistoryFilter = "today" | "yesterday" | "older";

export interface HistoryEntry {
  song: Song;
  playedAt: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function filterByPeriod(
  playedAt: string,
  filter: HistoryFilter,
): boolean {
  const played = new Date(playedAt);
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (filter === "today") {
    return played >= todayStart;
  }
  if (filter === "yesterday") {
    return played >= yesterdayStart && played < todayStart;
  }
  return played < yesterdayStart;
}

export async function getPlayHistory(
  userId: string,
  filter: HistoryFilter = "today",
): Promise<HistoryEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recently_played")
    .select("played_at, songs(*)")
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const raw = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
      if (!raw) return null;
      const playedAt = row.played_at as string;
      if (!filterByPeriod(playedAt, filter)) return null;
      return { song: mapDbSong(raw), playedAt };
    })
    .filter((e): e is HistoryEntry => e !== null);
}
