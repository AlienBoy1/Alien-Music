import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function fetchLyricsOvh(
  artist: string,
  title: string,
): Promise<string | null> {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = (await res.json()) as { lyrics?: string };
  return data.lyrics?.trim() || null;
}

/**
 * GET /api/lyrics?songId=... | ?artist=...&title=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const songId = searchParams.get("songId");
  const artist = searchParams.get("artist");
  const title = searchParams.get("title");

  try {
    if (songId) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("songs")
        .select("lyrics, artist, title")
        .eq("id", songId)
        .maybeSingle();

      if (data?.lyrics) {
        return NextResponse.json({
          lyrics: data.lyrics as string,
          source: "database",
        });
      }

      if (data?.artist && data?.title) {
        const remote = await fetchLyricsOvh(
          data.artist as string,
          data.title as string,
        );
        if (remote) {
          return NextResponse.json({ lyrics: remote, source: "lyrics.ovh" });
        }
      }
    } else if (artist && title) {
      const remote = await fetchLyricsOvh(artist, title);
      if (remote) {
        return NextResponse.json({ lyrics: remote, source: "lyrics.ovh" });
      }
    }

    return NextResponse.json(
      { error: "No se encontraron letras para esta canción" },
      { status: 404 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al buscar letras";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
