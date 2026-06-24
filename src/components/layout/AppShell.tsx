"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PlayerBar } from "@/components/player/PlayerBar";
import { AudioEngine } from "@/components/player/AudioEngine";
import { CosmicBackground } from "@/components/ui/CosmicBackground";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { PlayerPersistProvider } from "@/components/providers/PlayerPersistProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import type { Playlist } from "@/types/music";
import type { Session } from "next-auth";

const ExpandedPlayer = dynamic(
  () =>
    import("@/components/player/ExpandedPlayer").then((m) => ({
      default: m.ExpandedPlayer,
    })),
  { ssr: false },
);

interface AppShellProps {
  children: React.ReactNode;
  session: Session | null;
  playlists: Playlist[];
}

export function AppShell({ children, session, playlists }: AppShellProps) {
  useOfflineMode();

  return (
    <SettingsProvider>
      <PlayerPersistProvider>
        <div className="relative flex h-screen overflow-hidden bg-background">
          <CosmicBackground />
          <Sidebar session={session} playlists={playlists} />
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <OfflineBanner />
            <TopBar session={session} playlists={playlists} />
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-surface-highlight/30 via-surface/50 to-surface pb-[calc(var(--player-height)+var(--mobile-nav-height))] md:pb-[var(--player-height)]">
              {children}
            </main>
          </div>
          <MobileNav />
          <ErrorBoundary
            fallbackTitle="Reproductor no disponible"
            fallbackMessage="Hubo un problema con el motor de audio/video. El resto de la app sigue activo."
          >
            <ExpandedPlayer />
            <PlayerBar />
            <AudioEngine />
          </ErrorBoundary>
        </div>
      </PlayerPersistProvider>
    </SettingsProvider>
  );
}
