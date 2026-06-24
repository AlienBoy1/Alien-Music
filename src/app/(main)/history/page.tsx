import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPlayHistory } from "@/lib/db/history";
import { getWritablePlaylists } from "@/lib/db/playlists";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

const HistoryPageClient = dynamic(
  () =>
    import("./HistoryPageClient").then((m) => ({
      default: m.HistoryPageClient,
    })),
  { loading: () => <PageSkeleton rows={14} /> },
);

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/history");

  const [entries, playlists] = await Promise.all([
    getPlayHistory(session.user.id, "today"),
    getWritablePlaylists(session.user.id).catch(() => []),
  ]);

  return (
    <HistoryPageClient
      initialEntries={entries}
      initialFilter="today"
      playlists={playlists}
      isAuthenticated
    />
  );
}
