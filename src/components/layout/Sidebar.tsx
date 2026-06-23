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
  Rss,
  Search,
} from "lucide-react";
import { NowPlayingPanel } from "@/components/player/NowPlayingPanel";
import { CreatePlaylistModal } from "@/components/playlists/CreatePlaylistModal";
import type { Playlist } from "@/types/music";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/your-library", label: "Your Library", icon: Library, expandable: true },
  { href: "/playlists", label: "Playlists", icon: ListMusic, expandable: true },
  { href: "#", label: "Beta Feed", icon: Rss, expandable: true },
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
      <aside className="hidden h-full w-[var(--sidebar-width)] shrink-0 flex-col gap-4 bg-black p-2 md:flex">
        <div className="flex items-center gap-2 px-3 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-lg">
            👽
          </div>
          <span className="text-lg font-bold">Alien Music</span>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
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
                <Icon size={20} />
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
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-text-muted transition-colors hover:bg-surface-highlight hover:text-white"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                  isActive
                    ? "bg-surface-highlight text-white"
                    : "text-text-muted hover:bg-surface-highlight hover:text-white"
                }`}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {session && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mx-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-highlight hover:text-white"
          >
            <Plus size={18} />
            Crear playlist
          </button>
        )}

        {session && playlists.length > 0 && (
          <div className="mx-2 max-h-32 overflow-y-auto">
            <p className="mb-1 px-3 text-xs font-semibold text-text-muted">
              Tus playlists
            </p>
            {playlists.slice(0, 5).map((pl) => (
              <Link
                key={pl.id}
                href={`/playlists/${pl.id}`}
                className="block truncate rounded px-3 py-1.5 text-xs text-text-muted hover:bg-surface-highlight hover:text-white"
              >
                {pl.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mx-2 mt-2 rounded-lg bg-surface-highlight p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MessageSquare size={16} className="text-accent" />
            Give a Feedback
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
