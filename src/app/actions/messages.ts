"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getChatMessages,
  getOrCreateDirectChat,
  findDirectChatId,
  getUserChatPreviews,
  type ChatMessage,
  type ChatPreview,
} from "@/lib/db/messages";
import { mapDbSong } from "@/lib/supabase/mappers";
import type { PlayerTrack } from "@/types/music";

export type MessageActionResult<T = void> = { error?: string; data?: T };

async function assertCanMessage(
  senderId: string,
  targetUserId: string,
): Promise<string | null> {
  if (senderId === targetUserId) return "No puedes enviarte mensajes a ti mismo";

  const supabase = createAdminClient();

  const [{ data: sender }, { data: follow }] = await Promise.all([
    supabase
      .from("users")
      .select("username")
      .eq("id", senderId)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", senderId)
      .eq("following_id", targetUserId)
      .maybeSingle(),
  ]);

  if (!sender?.username) {
    return "Debes configurar tu @username único en Ajustes para chatear o compartir";
  }

  if (!follow) {
    return "Debes seguir a este usuario para chatear o compartir contenido";
  }

  return null;
}

export async function getMyChats(): Promise<MessageActionResult<ChatPreview[]>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  try {
    const data = await getUserChatPreviews(session.user.id);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al cargar chats" };
  }
}

export async function getChatWithUser(
  otherUserId: string,
): Promise<
  MessageActionResult<{
    chatId: string;
    messages: ChatMessage[];
    canChat: boolean;
    showFollowBackBanner: boolean;
    otherUser: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { data: otherUser } = await supabase
    .from("users")
    .select("id, name, username, image")
    .eq("id", otherUserId)
    .single();

  if (!otherUser) return { error: "Usuario no encontrado" };

  const [{ data: following }, { data: followedBy }] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", session.user.id)
      .eq("following_id", otherUserId)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", otherUserId)
      .eq("following_id", session.user.id)
      .maybeSingle(),
  ]);

  const canChat = Boolean(following);
  const canView = canChat || Boolean(followedBy);

  let chatId = "";
  let messages: ChatMessage[] = [];

  if (canView) {
    const existing = await findDirectChatId(session.user.id, otherUserId);
    if (existing) {
      chatId = existing;
      messages = await getChatMessages(chatId);
    } else if (canChat) {
      chatId = await getOrCreateDirectChat(session.user.id, otherUserId);
      messages = await getChatMessages(chatId);
    }
  }

  return {
    data: {
      chatId,
      messages,
      canChat,
      showFollowBackBanner: Boolean(followedBy) && !following,
      otherUser: {
        id: otherUser.id as string,
        name: otherUser.name as string | null,
        username: otherUser.username as string | null,
        image: otherUser.image as string | null,
      },
    },
  };
}

export async function sendChatMessage(
  chatId: string,
  text: string,
): Promise<MessageActionResult<{ messageId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const trimmed = text.trim();
  if (!trimmed) return { error: "Mensaje vacío" };

  const supabase = createAdminClient();

  const { data: participants } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("chat_id", chatId);

  const ids = (participants ?? []).map((p) => p.user_id as string);
  if (!ids.includes(session.user.id)) return { error: "No eres participante de este chat" };

  const otherId = ids.find((id) => id !== session.user.id);
  if (otherId) {
    const block = await assertCanMessage(session.user.id, otherId);
    if (block) return { error: block };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: session.user.id,
      text: trimmed,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/messages");
  return { data: { messageId: data.id as string } };
}

export async function shareSongWithUser(
  targetUserId: string,
  track: PlayerTrack,
): Promise<MessageActionResult<{ chatId: string; messageId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const block = await assertCanMessage(session.user.id, targetUserId);
  if (block) return { error: block };

  const supabase = createAdminClient();
  let songId: string | null = null;

  if (track.youtubeId) {
    const { data: existing } = await supabase
      .from("songs")
      .select("id")
      .eq("youtube_id", track.youtubeId)
      .maybeSingle();

    if (existing?.id) {
      songId = existing.id as string;
    } else {
      const { data: inserted, error } = await supabase
        .from("songs")
        .insert({
          title: track.title,
          artist: track.artistName,
          album_title: track.albumTitle || track.title,
          duration: Math.round(track.duration) || 0,
          youtube_id: track.youtubeId,
          type: track.type,
          cover_url: track.coverUrl,
          audio_url: null,
        })
        .select("id")
        .single();
      if (error) return { error: error.message };
      songId = inserted.id as string;
    }
  } else if (!track.isEphemeral && !track.id.startsWith("yt:")) {
    songId = track.id;
  }

  const chatId = await getOrCreateDirectChat(session.user.id, targetUserId);

  const shareText = `Compartió: ${track.title} — ${track.artistName}`;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: session.user.id,
      text: shareText,
      shared_song_id: songId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/messages");
  return { data: { chatId, messageId: data.id as string } };
}

export async function resolveSharedSong(
  songId: string,
): Promise<MessageActionResult<{ song: ReturnType<typeof mapDbSong> }>> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .single();

  if (error || !data) return { error: "Canción no encontrada" };
  return { data: { song: mapDbSong(data) } };
}
