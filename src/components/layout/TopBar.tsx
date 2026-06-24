"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "next-auth";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Menu,
  MessageSquare,
  Settings,
} from "lucide-react";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { SearchInput } from "@/components/search/SearchInput";
import type { Playlist } from "@/types/music";

interface TopBarProps {
  session: Session | null;
  playlists?: Playlist[];
}

export function TopBar({ session, playlists = [] }: TopBarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        session={session}
        playlists={playlists}
      />

      <header className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center gap-2 border-b border-border bg-surface/60 px-3 backdrop-blur-xl md:gap-4 md:px-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-highlight/80 text-text-muted transition-colors hover:border-accent/30 hover:text-accent md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-highlight/80 text-text-muted transition-all duration-200 hover:border-accent/30 hover:text-accent hover:shadow-[0_0_12px_rgba(0,255,159,0.15)]"
            aria-label="Atrás"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => window.history.forward()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-highlight/80 text-text-muted transition-all duration-200 hover:border-accent/30 hover:text-accent hover:shadow-[0_0_12px_rgba(0,255,159,0.15)]"
            aria-label="Adelante"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <Suspense
          fallback={
            <div className="mx-auto min-w-0 flex-1 md:max-w-xl">
              <div className="h-9 rounded-full bg-surface-highlight/60 md:h-10" />
            </div>
          }
        >
          <SearchInput />
        </Suspense>

        <div className="flex shrink-0 items-center gap-1 md:hidden">
          {session ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 max-w-[120px] items-center gap-1.5 rounded-full border border-border bg-surface-highlight/80 py-0.5 pl-0.5 pr-2 transition-colors hover:border-accent/30"
              aria-label="Abrir menú y perfil"
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full ring-2 ring-accent/30"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-alien-cyan text-xs font-bold text-black">
                  {(session.user?.name?.[0] ?? "U").toUpperCase()}
                </div>
              )}
              <span className="truncate text-[11px] font-medium">
                {session.user?.name?.split(" ")[0] ?? "Perfil"}
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 text-accent"
              aria-label="Iniciar sesión"
            >
              <LogIn size={18} />
            </Link>
          )}
          <Link
            href="/messages"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              pathname.startsWith("/messages")
                ? "text-accent"
                : "text-text-muted hover:text-accent"
            }`}
            aria-label="Mensajes"
          >
            <MessageSquare size={20} />
          </Link>
          <Link
            href="/settings"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              pathname.startsWith("/settings")
                ? "text-accent"
                : "text-text-muted hover:text-accent"
            }`}
            aria-label="Configuración"
          >
            <Settings size={20} />
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <InstallAppButton variant="topbar" />
          <button
            type="button"
            className="text-text-muted transition-colors duration-200 hover:text-accent hover:drop-shadow-[0_0_6px_rgba(0,255,159,0.5)]"
            aria-label="Notificaciones"
          >
            <Bell size={20} />
          </button>
          <Link
            href="/settings"
            className="text-text-muted transition-colors duration-200 hover:text-accent hover:drop-shadow-[0_0_6px_rgba(0,255,159,0.5)]"
            aria-label="Configuración"
          >
            <Settings size={20} />
          </Link>

          {session ? (
            <Link
              href={`/user/${session.user?.id}`}
              className="flex items-center gap-2 rounded-full border border-border bg-surface-highlight/80 py-1 pl-1 pr-3 transition-all duration-200 hover:border-accent/30 hover:shadow-[0_0_12px_rgba(0,255,159,0.1)]"
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "Usuario"}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-accent/30"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-alien-cyan text-xs font-bold text-black">
                  {(session.user?.name?.[0] ?? "U").toUpperCase()}
                </div>
              )}
              <span className="max-w-[100px] truncate text-xs">
                {session.user?.name ?? "Usuario"}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="alien-btn-primary flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
            >
              <LogIn size={16} />
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>
    </>
  );
}
