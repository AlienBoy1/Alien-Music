"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  ChevronDown,
  Home,
  Library,
  ListMusic,
  MessageSquare,
  Plus,
  Search,
  ListOrdered,
} from "lucide-react";
import { NowPlayingPanel } from "@/components/player/NowPlayingPanel";
import { CreatePlaylistModal } from "@/components/playlists/CreatePlaylistModal";
import { AlienLogo } from "@/components/ui/AlienLogo";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import type { Playlist } from "@/types/music";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/messages", label: "Mensajes", icon: MessageSquare },
  { href: "/queue", label: "Cola", icon: ListOrdered },
  { href: "/your-library", label: "Your Library", icon: Library, expandable: true },
  { href: "/playlists", label: "Playlists", icon: ListMusic, expandable: true },
];

interface SidebarProps {
  session: Session | null;
  playlists: Playlist[];
}

export function Sidebar({ session, playlists }: SidebarProps) {
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <aside className="relative z-20 hidden h-full w-[var(--sidebar-width)] shrink-0 flex-col gap-4 border-r border-border bg-surface/80 p-2 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2 px-3 py-4">
          <div className="alien-glow-sm flex h-9 w-9 items-center justify-center rounded-full bg-surface-highlight">
            <AlienLogo size={28} animated />
          </div>
          <span className="font-display text-lg font-bold tracking-wide text-alien-gradient">
            Alien Music
          </span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent alien-glow-text">
            Beta
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, label, icon: Icon, expandable }) => {
            const isActive =
              href !== "#" &&
              (pathname === href ||
                (href !== "/" && pathname.startsWith(href)));

            const content = (
              <>
                <Icon
                  size={20}
                  className={isActive ? "text-accent drop-shadow-[0_0_6px_rgba(0,255,159,0.5)]" : ""}
                />
                <span className="flex-1 text-left text-sm font-semibold">
                  {label}
                </span>
                {expandable && (
                  <ChevronDown size={16} className="text-text-muted" />
                )}
              </>
            );

            if (href === "#") {
              return (
                <button
                  key={label}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-text-muted transition-all duration-200 hover:bg-surface-highlight hover:text-white hover:shadow-[inset_0_0_12px_rgba(0,255,159,0.05)]"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? "bg-surface-highlight text-white alien-border-glow shadow-[inset_0_0_20px_rgba(0,255,159,0.06)]"
                    : "text-text-muted hover:bg-surface-highlight hover:text-white"
                }`}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <InstallAppButton />

        {session && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mx-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-muted transition-all duration-200 hover:bg-surface-highlight hover:text-accent hover:shadow-[0_0_12px_rgba(0,255,159,0.1)]"
          >
            <Plus size={18} />
            Crear playlist
          </button>
        )}

        {session && playlists.length > 0 && (
          <div className="mx-2 max-h-32 overflow-y-auto">
            <p className="mb-1 px-3 font-display text-xs font-semibold tracking-wider text-alien-cyan/70 uppercase">
              Tus playlists
            </p>
            {playlists.slice(0, 5).map((pl) => (
              <Link
                key={pl.id}
                href={`/playlists/${pl.id}`}
                className="block truncate rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-highlight hover:text-accent"
              >
                {pl.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mx-2 mt-2 alien-card rounded-xl p-4 animate-hologram">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MessageSquare size={16} className="text-accent drop-shadow-[0_0_6px_rgba(0,255,159,0.5)]" />
            <span className="font-display tracking-wide">Give a Feedback</span>
          </div>
          <p className="text-xs text-text-muted">
            Ayúdanos a mejorar Alien Music Beta
          </p>
        </div>

        <div className="flex-1" />

        <div className="px-2 pb-2">
          <NowPlayingPanel />
        </div>
      </aside>

      <CreatePlaylistModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
