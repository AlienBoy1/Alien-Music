"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface ImmersiveParticlesProps {
  progress?: number;
  isPlaying?: boolean;
  count?: number;
}

export function ImmersiveParticles({
  progress = 0,
  isPlaying = false,
  count = 24,
}: ImmersiveParticlesProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (i * 17 + 11) % 100,
        y: (i * 23 + 7) % 100,
        size: 2 + (i % 4),
        delay: (i % 8) * 0.4,
        duration: 4 + (i % 5),
      })),
    [count],
  );

  const pulseScale = isPlaying ? 1 + progress * 0.15 : 1;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-accent/30 shadow-[0_0_8px_rgba(0,255,159,0.4)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -12 - progress * 20, 0],
            x: [0, (p.id % 2 === 0 ? 6 : -6), 0],
            opacity: isPlaying ? [0.2, 0.7, 0.2] : [0.1, 0.3, 0.1],
            scale: [1, pulseScale, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
