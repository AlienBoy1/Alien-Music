"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useSearchStore } from "@/lib/stores/searchStore";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * Input de búsqueda con estado local persistente mientras tiene foco.
 * Evita que re-renders asíncronos o cambios de URL borren el texto al escribir.
 */
export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setStoreQuery = useSearchStore((s) => s.setQuery);
  const storeQuery = useSearchStore((s) => s.query);

  const urlQuery = searchParams.get("q") ?? "";
  const isFocusedRef = useRef(false);
  const lastPushedRef = useRef("");

  const [localQuery, setLocalQuery] = useState(() => urlQuery || storeQuery);
  const debouncedQuery = useDebounce(localQuery, 400);

  useEffect(() => {
    if (isFocusedRef.current) return;
    const external = urlQuery || storeQuery;
    if (external !== localQuery) {
      setLocalQuery(external);
    }
  }, [urlQuery, storeQuery, localQuery]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    setStoreQuery(debouncedQuery);

    if (trimmed === lastPushedRef.current) return;
    lastPushedRef.current = trimmed;

    if (pathname === "/search") {
      if (trimmed) {
        const filter = searchParams.get("filter");
        const suffix = filter && filter !== "all" ? `&filter=${filter}` : "";
        router.replace(
          `/search?q=${encodeURIComponent(trimmed)}${suffix}`,
          { scroll: false },
        );
      } else if (!isFocusedRef.current) {
        router.replace("/search", { scroll: false });
      }
    }
  }, [
    debouncedQuery,
    pathname,
    router,
    searchParams,
    setStoreQuery,
  ]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = localQuery.trim();
      if (trimmed) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [localQuery, router],
  );

  const handleChange = useCallback(
    (value: string) => {
      setLocalQuery(value);
      if (value.trim() && pathname !== "/search") {
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      }
    },
    [pathname, router],
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto min-w-0 flex-1 md:max-w-xl">
      <div className="group relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-accent"
        />
        <input
          type="search"
          placeholder="Buscar en el universo..."
          value={localQuery}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
          }}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-full border border-border bg-surface-highlight/80 py-2 pl-10 pr-3 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:border-accent/40 focus:outline-none focus:shadow-[0_0_20px_rgba(0,255,159,0.12)] md:py-2.5 md:pr-4"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
    </form>
  );
}
