import { NextRequest, NextResponse } from "next/server";
import { getRelatedYouTubeVideos } from "@/lib/youtube/search";

export const runtime = "nodejs";

/** GET /api/youtube/related?videoId=xxx */
export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API no configurada" }, { status: 503 });
  }

  const videoId = request.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId requerido" }, { status: 400 });
  }

  try {
    const items = await getRelatedYouTubeVideos(videoId, apiKey, 8);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
