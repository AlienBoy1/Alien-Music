import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbSong } from "@/lib/supabase/mappers";
import type { Song } from "@/types/music";

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string | null;
  sharedSong: Song | null;
  createdAt: string;
}

export interface ChatPreview {
  chatId: string;
  otherUser: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export async function findDirectChatId(
  userA: string,
  userB: string,
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: myChats } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", userA);

  const chatIds = (myChats ?? []).map((r) => r.chat_id as string);
  if (chatIds.length === 0) return null;

  for (const chatId of chatIds) {
    const { count } = await supabase
      .from("chat_participants")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chatId);

    if (count !== 2) continue;

    const { data: other } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("chat_id", chatId)
      .eq("user_id", userB)
      .maybeSingle();

    if (other) return chatId;
  }

  return null;
}

export async function getOrCreateDirectChat(
  currentUserId: string,
  otherUserId: string,
): Promise<string> {
  const existing = await findDirectChatId(currentUserId, otherUserId);
  if (existing) return existing;

  const supabase = createAdminClient();
  const { data: chat, error } = await supabase
    .from("chats")
    .insert({})
    .select("id")
    .single();

  if (error || !chat) throw new Error(error?.message ?? "No se pudo crear el chat");

  const chatId = chat.id as string;
  const { error: partError } = await supabase.from("chat_participants").insert([
    { chat_id: chatId, user_id: currentUserId },
    { chat_id: chatId, user_id: otherUserId },
  ]);

  if (partError) throw new Error(partError.message);
  return chatId;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, chat_id, sender_id, text, shared_song_id, created_at, songs(*)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const rawSong = row.songs as unknown as Parameters<typeof mapDbSong>[0] | null;
    return {
      id: row.id as string,
      chatId: row.chat_id as string,
      senderId: row.sender_id as string,
      text: row.text as string | null,
      sharedSong: rawSong ? mapDbSong(rawSong) : null,
      createdAt: row.created_at as string,
    };
  });
}

export async function getUserChatPreviews(userId: string): Promise<ChatPreview[]> {
  const supabase = createAdminClient();
  const { data: participations, error } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const previews: ChatPreview[] = [];

  for (const row of participations ?? []) {
    const chatId = row.chat_id as string;

    const { data: others } = await supabase
      .from("chat_participants")
      .select("user_id, users(id, name, username, image)")
      .eq("chat_id", chatId)
      .neq("user_id", userId)
      .limit(1);

    const otherRaw = others?.[0]?.users as unknown as {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;

    if (!otherRaw) continue;

    const { data: lastMsg } = await supabase
      .from("messages")
      .select("text, created_at, shared_song_id")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    previews.push({
      chatId,
      otherUser: otherRaw,
      lastMessage: lastMsg?.shared_song_id
        ? "🎵 Canción compartida"
        : (lastMsg?.text as string | null) ?? null,
      lastMessageAt: (lastMsg?.created_at as string) ?? null,
    });
  }

  previews.sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });

  return previews;
}
