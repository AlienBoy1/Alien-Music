import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getChatMessages } from "@/lib/db/messages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { chatId } = await params;
  try {
    const messages = await getChatMessages(chatId);
    return NextResponse.json({ messages });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
