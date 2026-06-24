"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCoverPalette } from "@/hooks/useCoverPalette";

interface ImmersiveAuroraBackgroundProps {
  coverUrl: string;
  progress?: number;
}

export function ImmersiveAuroraBackground({
  coverUrl,
  progress = 0,
}: ImmersiveAuroraBackgroundProps) {
  const palette = useCoverPalette(coverUrl);
  const shift = `${Math.min(100, progress * 100)}%`;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={coverUrl}
        alt=""
        fill
        sizes="100vw"
        className="scale-125 object-cover opacity-30 blur-[80px]"
        priority
      />

      <motion.div
        className="immersive-aurora-layer absolute inset-[-20%]"
        style={
          {
            "--aurora-a": palette.primary,
            "--aurora-b": palette.secondary,
            "--aurora-c": palette.accent,
            "--aurora-shift": shift,
          } as React.CSSProperties
        }
        animate={{
          rotate: [0, 3, -2, 0],
          scale: [1, 1.05, 1.02, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-surface/40 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,255,159,0.08),transparent_55%)]" />
    </div>
  );
}
