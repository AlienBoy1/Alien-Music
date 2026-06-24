"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Session } from "next-auth";
import {
  ChevronDown,
  Download,
  Home,
  Library,
  ListMusic,
  ListOrdered,
  LogIn,
  MessageSquare,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";
import { AlienLogo } from "@/components/ui/AlienLogo";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { CreatePlaylistModal } from "@/components/playlists/CreatePlaylistModal";
import type { Playlist } from "@/types/music";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/messages", label: "Mensajes", icon: MessageSquare },
  { href: "/queue", label: "Cola", icon: ListOrdered },
  { href: "/your-library", label: "Tu biblioteca", icon: Library },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/settings", label: "Configuración", icon: Settings },
];

const downloadsNav = { href: "/your-library#downloads", label: "Descargas", icon: Download };

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  session: Session | null;
  playlists: Playlist[];
}

export function MobileDrawer({
  open,
  onClose,
  session,
  playlists,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleNav = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            <motion.aside
              className="fixed inset-y-0 left-0 z-[56] flex w-[min(88vw,320px)] flex-col border-r border-border bg-surface/95 backdrop-blur-xl md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
            >
              <div className="relative border-b border-border px-4 py-4">
                {session ? (
                  <Link
                    href={`/user/${session.user?.id}`}
                    onClick={onClose}
                    className="glass-alien flex items-center gap-3 rounded-xl p-3 transition-colors hover:border-accent/40"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt=""
                        width={48}
                        height={48}
                        className="rounded-full ring-2 ring-accent/40"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-alien-cyan text-sm font-bold text-black">
                        {(session.user?.name?.[0] ?? "U").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-alien-gradient">
                        {session.user?.name ?? "Usuario"}
                      </p>
                      <p className="text-xs text-text-muted">Ver perfil · Ajustes completos</p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlienLogo size={28} animated />
                      <span className="font-display text-base font-bold text-alien-gradient">
                        Alien Music
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full p-2 text-text-muted hover:bg-surface-highlight hover:text-white"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-3">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href ||
                    (href !== "/" && pathname.startsWith(href));

                  return (
                    <button
                      key={href}
                      type="button"
                      onClick={() => handleNav(href)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                        isActive
                          ? "bg-surface-highlight text-accent"
                          : "text-text-muted hover:bg-surface-highlight hover:text-white"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-semibold">{label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleNav(downloadsNav.href)}
                  className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-text-muted transition-colors hover:bg-surface-highlight hover:text-accent"
                >
                  <Download size={20} />
                  <span className="text-sm font-semibold">{downloadsNav.label}</span>
                </button>

                <div className="my-3 border-t border-border pt-3">
                  <InstallAppButton className="w-full" />
                </div>

                {session && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(true);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-highlight hover:text-accent"
                  >
                    <Plus size={18} />
                    Crear playlist
                  </button>
                )}

                {session && playlists.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 flex items-center gap-1 px-3 text-xs font-semibold uppercase tracking-wider text-alien-cyan/70">
                      Tus playlists
                      <ChevronDown size={12} />
                    </p>
                    {playlists.slice(0, 6).map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => handleNav(`/playlists/${pl.id}`)}
                        className="block w-full truncate rounded-lg px-3 py-2 text-left text-xs text-text-muted hover:bg-surface-highlight hover:text-accent"
                      >
                        {pl.name}
                      </button>
                    ))}
                  </div>
                )}
              </nav>

              <div className="border-t border-border p-4">
                {session ? (
                  <Link
                    href={`/user/${session.user?.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-accent/30"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                        {(session.user?.name?.[0] ?? "U").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {session.user?.name ?? "Usuario"}
                      </p>
                      <p className="text-xs text-text-muted">Ver perfil</p>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="alien-btn-primary flex items-center justify-center gap-2 rounded-full py-2.5 text-sm"
                  >
                    <LogIn size={16} />
                    Iniciar sesión
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CreatePlaylistModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
