import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/app/version";
import { getMinRequiredVersion } from "@/lib/db/appConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/app/config
 * Versión mínima obligatoria (Supabase) + versión empaquetada actual.
 */
export async function GET() {
  try {
    const minRequiredVersion = await getMinRequiredVersion();

    return NextResponse.json(
      {
        minRequiredVersion,
        currentVersion: APP_VERSION,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        minRequiredVersion: APP_VERSION,
        currentVersion: APP_VERSION,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
