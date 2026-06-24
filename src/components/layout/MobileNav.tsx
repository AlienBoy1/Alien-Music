"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search } from "lucide-react";

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/your-library", label: "Biblioteca", icon: Library },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-[var(--player-height)] left-0 right-0 z-40 flex h-[var(--mobile-nav-height)] items-center justify-around border-t border-border bg-surface-elevated/90 backdrop-blur-xl md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || (href !== "/" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-all duration-200 ${
              isActive
                ? "text-accent drop-shadow-[0_0_8px_rgba(0,255,159,0.5)]"
                : "text-text-muted"
            }`}
          >
            <Icon size={20} />
            <span className={isActive ? "font-semibold" : ""}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
