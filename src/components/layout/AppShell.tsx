import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PlayerBar } from "@/components/player/PlayerBar";
import { AudioEngine } from "@/components/player/AudioEngine";
import type { Playlist } from "@/types/music";
import type { Session } from "next-auth";

interface AppShellProps {
  children: React.ReactNode;
  session: Session | null;
  playlists: Playlist[];
}

export function AppShell({ children, session, playlists }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <Sidebar session={session} playlists={playlists} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar session={session} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1f1f1f] to-surface pb-[calc(var(--player-height)+var(--mobile-nav-height))] md:pb-[var(--player-height)]">
          {children}
        </main>
      </div>
      <MobileNav />
      <PlayerBar />
      <AudioEngine />
    </div>
  );
}
