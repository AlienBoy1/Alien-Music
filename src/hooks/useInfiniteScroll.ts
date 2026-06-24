import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  rootMargin?: string;
}

/** Dispara onLoadMore cuando el sentinel entra en viewport (una sola vez por ciclo). */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  rootMargin = "240px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(loading);
  const onLoadMoreRef = useRef(onLoadMore);

  loadingRef.current = loading;
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, rootMargin]);

  return sentinelRef;
}
