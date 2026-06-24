import dynamic from "next/dynamic";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyChats, getChatWithUser } from "@/app/actions/messages";
import { GridSkeleton } from "@/components/ui/PageSkeleton";

const MessagesPageClient = dynamic(
  () =>
    import("./MessagesPageClient").then((m) => ({
      default: m.MessagesPageClient,
    })),
  { loading: () => <GridSkeleton count={4} /> },
);

interface MessagesPageProps {
  searchParams: Promise<{ with?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/messages");

  const { with: withUser } = await searchParams;
  const chatsResult = await getMyChats();
  const chats = chatsResult.data ?? [];

  let initialChat = null;
  if (withUser) {
    const chatResult = await getChatWithUser(withUser);
    if (chatResult.data) initialChat = chatResult.data;
  }

  return (
    <Suspense fallback={<GridSkeleton count={4} />}>
      <MessagesPageClient
        userId={session.user.id}
        initialChats={chats}
        initialChat={initialChat}
      />
    </Suspense>
  );
}
