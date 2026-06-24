"use client";

import { useEffect, useState } from "react";

/** Page Visibility API — false cuando la pestaña/PWA está en segundo plano */
export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => {
      setVisible(document.visibilityState === "visible");
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}
