import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  rootMargin?: string;
}

/** Dispara onLoadMore cuando el sentinel entra en viewport */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, rootMargin]);

  return sentinelRef;
}
