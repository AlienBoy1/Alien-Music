import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPlayHistory, type HistoryFilter } from "@/lib/db/history";

const VALID: HistoryFilter[] = ["today", "yesterday", "older"];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const filter = (request.nextUrl.searchParams.get("filter") ??
    "today") as HistoryFilter;
  const safe = VALID.includes(filter) ? filter : "today";

  try {
    const entries = await getPlayHistory(session.user.id, safe);
    return NextResponse.json({ entries });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
