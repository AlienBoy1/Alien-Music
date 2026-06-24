"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search } from "lucide-react";

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/your-library", label: "Biblioteca", icon: Library },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-[var(--player-height)] left-0 right-0 z-40 border-t border-border/80 bg-surface/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex h-[var(--mobile-nav-height)] max-w-lg items-stretch justify-around px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1 transition-all duration-200 ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={
                  isActive
                    ? "drop-shadow-[0_0_8px_rgba(0,255,159,0.55)]"
                    : undefined
                }
              />
              <span
                className={`max-w-full truncate text-[10px] leading-tight ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
