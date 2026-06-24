"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, UserPlus } from "lucide-react";
import { ContentHeader } from "@/components/content/ContentHeader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { COVER_SIZES } from "@/lib/images/coverSizes";
import { findUserByUsername, followUser } from "@/app/actions/follows";
import { getChatWithUser, getMyChats } from "@/app/actions/messages";
import type { ChatPreview } from "@/lib/db/messages";
import type { ChatMessage } from "@/lib/db/messages";

const ChatWindow = dynamic(
  () =>
    import("@/components/messages/ChatWindow").then((m) => ({
      default: m.ChatWindow,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  },
);

interface MessagesPageClientProps {
  userId: string;
  initialChats: ChatPreview[];
  initialChat?: {
    chatId: string;
    messages: ChatMessage[];
    canChat: boolean;
    showFollowBackBanner: boolean;
    otherUser: ChatPreview["otherUser"];
  } | null;
}

export function MessagesPageClient({
  userId,
  initialChats,
  initialChat,
}: MessagesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUser = searchParams.get("with");

  const [chats] = useState(initialChats);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Awaited<
    ReturnType<typeof findUserByUsername>
  >["data"] | null>(null);
  const [activeChat, setActiveChat] = useState(initialChat);
  const [loadingChat, setLoadingChat] = useState(false);

  const openChat = useCallback(async (otherUserId: string) => {
    setLoadingChat(true);
    const result = await getChatWithUser(otherUserId);
    setLoadingChat(false);
    if (result.data) {
      setActiveChat(result.data);
      router.replace(`/messages?with=${otherUserId}`, { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    if (!withUser || loadingChat) return;
    if (activeChat?.otherUser?.id === withUser) return;
    void openChat(withUser);
  }, [withUser, activeChat?.otherUser?.id, loadingChat, openChat]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    const result = await findUserByUsername(search);
    setSearching(false);
    if (result.data) setSearchResult(result.data);
    else setSearchResult(null);
  };

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height)-var(--player-height)-2rem)] flex-col p-4 md:p-6 lg:flex-row lg:gap-4">
      <aside className="mb-4 flex w-full flex-col border-border lg:mb-0 lg:w-80 lg:border-r lg:pr-4">
        <ContentHeader title="Mensajes" showFeedback={false} />

        <form onSubmit={(e) => void handleSearch(e)} className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar @username"
            className="w-full rounded-full border border-border bg-surface-highlight py-2 pl-9 pr-4 text-sm focus:border-accent/40 focus:outline-none"
          />
        </form>

        {searching && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-accent" />
          </div>
        )}

        {searchResult && (
          <div className="mb-4 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {searchResult.username
                    ? `@${searchResult.username}`
                    : searchResult.name}
                </p>
                {!searchResult.canChat && (
                  <p className="text-xs text-text-muted">Sigue para chatear</p>
                )}
              </div>
              {searchResult.canChat ? (
                <button
                  type="button"
                  onClick={() => void openChat(searchResult.id)}
                  className="text-sm text-accent hover:underline"
                >
                  Abrir chat
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void followUser(searchResult.id)}
                  className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-black"
                >
                  <UserPlus size={12} />
                  Seguir
                </button>
              )}
            </div>
          </div>
        )}

        <ul className="flex-1 space-y-1 overflow-y-auto">
          {chats.map((c) => (
            <li key={c.chatId}>
              <button
                type="button"
                onClick={() => void openChat(c.otherUser.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-highlight ${
                  activeChat?.otherUser.id === c.otherUser.id
                    ? "bg-surface-highlight"
                    : ""
                }`}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-surface-highlight">
                  {c.otherUser.image ? (
                    <Image
                      src={c.otherUser.image}
                      alt=""
                      fill
                      sizes={COVER_SIZES.thumb}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-accent">
                      {(c.otherUser.name?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.otherUser.username
                      ? `@${c.otherUser.username}`
                      : c.otherUser.name}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {c.lastMessage ?? "Sin mensajes"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="min-h-0 flex-1">
        {loadingChat && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-accent" />
          </div>
        )}
        {!loadingChat && activeChat && (
          <ErrorBoundary
            fallbackTitle="Chat no disponible"
            fallbackMessage="No se pudo cargar la conversación. Reintenta o vuelve más tarde."
          >
            <ChatWindow
              chatId={activeChat.chatId}
              currentUserId={userId}
              initialMessages={activeChat.messages}
              otherUser={activeChat.otherUser}
              canChat={activeChat.canChat}
              showFollowBackBanner={activeChat.showFollowBackBanner}
            />
          </ErrorBoundary>
        )}
        {!loadingChat && !activeChat && (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-text-muted">
            <p>Selecciona un chat o busca un @username</p>
            <Link href="/search" className="mt-2 text-sm text-accent hover:underline">
              Descubrir música
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
