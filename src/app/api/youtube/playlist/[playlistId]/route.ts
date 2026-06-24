import { NextRequest, NextResponse } from "next/server";
import {
  getYouTubePlaylistItems,
  getYouTubePlaylistMeta,
} from "@/lib/youtube/playlist";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ playlistId: string }>;
}

/**
 * GET /api/youtube/playlist/[playlistId]
 * Metadatos + pistas de una playlist (álbum) de YouTube.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API no configurada" },
      { status: 503 },
    );
  }

  const { playlistId } = await params;

  if (!playlistId?.trim()) {
    return NextResponse.json({ error: "playlistId requerido" }, { status: 400 });
  }

  try {
    const [meta, items] = await Promise.all([
      getYouTubePlaylistMeta(playlistId, apiKey),
      getYouTubePlaylistItems(playlistId, apiKey, 80),
    ]);

    if (!meta) {
      return NextResponse.json(
        { error: "Playlist no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ meta, items });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al cargar playlist";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
