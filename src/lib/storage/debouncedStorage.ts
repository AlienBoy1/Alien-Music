/** localStorage con escrituras debounced para no bloquear el hilo principal */
export function createDebouncedStorage(delayMs = 1500) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { key: string; value: string } | null = null;

  const flush = () => {
    if (!pending || typeof window === "undefined") return;
    localStorage.setItem(pending.key, pending.value);
    pending = null;
  };

  return {
    getItem: (name: string): string | null => {
      if (typeof window === "undefined") return null;
      if (pending?.key === name) return pending.value;
      return localStorage.getItem(name);
    },
    setItem: (name: string, value: string): void => {
      if (typeof window === "undefined") return;
      pending = { key: name, value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        flush();
        timer = null;
      }, delayMs);
    },
    removeItem: (name: string): void => {
      if (typeof window === "undefined") return;
      if (pending?.key === name) pending = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      localStorage.removeItem(name);
    },
    flush,
  };
}

export const debouncedLocalStorage = createDebouncedStorage(1500);
