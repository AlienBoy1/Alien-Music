"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { COVER_SIZES } from "@/lib/images/coverSizes";
import { Loader2, Send, UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendChatMessage } from "@/app/actions/messages";
import { followUser } from "@/app/actions/follows";
import type { ChatMessage } from "@/lib/db/messages";
import { songToPlayerTrack } from "@/types/music";
import { usePlayerStore } from "@/lib/stores/playerStore";

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  otherUser: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  canChat: boolean;
  showFollowBackBanner: boolean;
}

export function ChatWindow({
  chatId,
  currentUserId,
  initialMessages,
  otherUser,
  canChat,
  showFollowBackBanner: initialBanner,
}: ChatWindowProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [following, setFollowing] = useState(false);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const displayName =
    otherUser.username ? `@${otherUser.username}` : otherUser.name ?? "Usuario";

  const refreshMessages = useCallback(async () => {
    const res = await fetch(`/api/chat/${chatId}/messages`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    setMessages(data.messages);
  }, [chatId]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          void refreshMessages();
        },
      )
      .subscribe();

    const poll = setInterval(() => void refreshMessages(), 5000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [chatId, refreshMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChat || !text.trim()) return;
    setSending(true);
    const result = await sendChatMessage(chatId, text);
    setSending(false);
    if (!result.error) {
      setText("");
      await refreshMessages();
    }
  };

  const handleFollow = async () => {
    setFollowing(true);
    await followUser(otherUser.id);
    setFollowing(false);
    setBannerDismissed(true);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface-elevated/80">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface-highlight">
          {otherUser.image ? (
            <Image src={otherUser.image} alt="" fill sizes={COVER_SIZES.thumb} className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-accent">
              {(otherUser.name?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold">{displayName}</p>
          {!canChat && (
            <p className="text-xs text-text-muted">Sigue para chatear</p>
          )}
        </div>
      </header>

      {initialBanner && !bannerDismissed && (
        <div className="flex items-center justify-between gap-2 border-b border-accent/20 bg-accent/5 px-4 py-2 text-sm">
          <span>
            {otherUser.name ?? displayName} te ha enviado un mensaje. ¿Quieres
            seguir a {displayName} también?
          </span>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => void handleFollow()}
              disabled={following}
              className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-black"
            >
              <UserPlus size={12} />
              Seguir
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="rounded-full p-1 text-text-muted hover:text-white"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const mine = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-accent/20 text-white"
                    : "bg-surface-highlight text-white/90"
                }`}
              >
                {msg.text && <p>{msg.text}</p>}
                {msg.sharedSong && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-black/30 p-2">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={msg.sharedSong.coverUrl}
                        alt=""
                        fill
                        sizes={COVER_SIZES.row}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{msg.sharedSong.title}</p>
                      <p className="truncate text-xs text-text-muted">
                        {msg.sharedSong.artist}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        playTrack(songToPlayerTrack(msg.sharedSong!))
                      }
                      className="alien-btn-play rounded-full px-3 py-1 text-xs font-semibold"
                    >
                      Play
                    </button>
                  </div>
                )}
                <p className="mt-1 text-[10px] text-text-muted">
                  {new Date(msg.createdAt).toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!canChat ? (
        <div className="border-t border-border p-4 text-center text-sm text-text-muted">
          <button
            type="button"
            onClick={() => void handleFollow()}
            disabled={following}
            className="alien-btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
          >
            <UserPlus size={16} />
            Seguir para interactuar
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSend(e)} className="flex gap-2 border-t border-border p-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full border border-border bg-surface-highlight px-4 py-2 text-sm focus:border-accent/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-black disabled:opacity-50"
            aria-label="Enviar"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      )}
    </div>
  );
}
