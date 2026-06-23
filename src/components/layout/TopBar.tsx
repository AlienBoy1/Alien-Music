"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { Bell, ChevronLeft, ChevronRight, LogIn, Search, Settings } from "lucide-react";
import { useSearchStore } from "@/lib/stores/searchStore";

interface TopBarProps {
  session: Session | null;
}

export function TopBar({ session }: TopBarProps) {
  const router = useRouter();
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center gap-4 bg-surface/80 px-4 backdrop-blur-md">
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-text-muted transition-colors hover:text-white"
          aria-label="Atrás"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => router.forward()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-text-muted transition-colors hover:text-white"
          aria-label="Adelante"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mx-auto w-full max-w-xl">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full bg-surface-highlight py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </form>

      <div className="hidden items-center gap-3 md:flex">
        <button
          type="button"
          className="text-text-muted transition-colors hover:text-white"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
        </button>
        <button
          type="button"
          className="text-text-muted transition-colors hover:text-white"
          aria-label="Configuración"
        >
          <Settings size={20} />
        </button>

        {session ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-full bg-surface-highlight py-1 pl-1 pr-3 transition-colors hover:bg-surface-hover"
          >
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "Usuario"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
                {(session.user?.name?.[0] ?? "U").toUpperCase()}
              </div>
            )}
            <span className="max-w-[100px] truncate text-xs">
              {session.user?.name ?? "Usuario"}
            </span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
          >
            <LogIn size={16} />
            Iniciar sesión
          </Link>
        )}
      </div>
    </header>
  );
}
