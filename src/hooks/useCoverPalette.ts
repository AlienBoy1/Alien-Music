"use client";

import { useEffect, useState } from "react";

export interface CoverPalette {
  primary: string;
  secondary: string;
  accent: string;
}

const DEFAULT_PALETTE: CoverPalette = {
  primary: "#00ff9f",
  secondary: "#a855f7",
  accent: "#00e5ff",
};

/** Extrae colores dominantes de una carátula para el fondo inmersivo */
export function useCoverPalette(coverUrl: string | undefined): CoverPalette {
  const [palette, setPalette] = useState<CoverPalette>(DEFAULT_PALETTE);

  useEffect(() => {
    if (!coverUrl) {
      setPalette(DEFAULT_PALETTE);
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let r2 = 0;
        let g2 = 0;
        let b2 = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const brightness = (pr + pg + pb) / 3;
          if (brightness < 25 || brightness > 235) continue;

          r += pr;
          g += pg;
          b += pb;
          r2 += pr * pr;
          g2 += pg * pg;
          b2 += pb * pb;
          count++;
        }

        if (count === 0) {
          setPalette(DEFAULT_PALETTE);
          return;
        }

        const avg = (channel: number) =>
          Math.round(Math.min(255, Math.max(40, channel / count)));

        const primary = `rgb(${avg(r)}, ${avg(g)}, ${avg(b)})`;
        const secondary = `rgb(${avg(r2 / count)}, ${avg(g2 / count)}, ${avg(b2 / count)})`;
        const accent = `rgb(${avg(g)}, ${avg(r)}, ${avg(b + 40)})`;

        setPalette({ primary, secondary, accent });
      } catch {
        setPalette(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => {
      if (!cancelled) setPalette(DEFAULT_PALETTE);
    };

    img.src = coverUrl;

    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  return palette;
}
