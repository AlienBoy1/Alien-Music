interface AudioVisualizerProps {
  active?: boolean;
  bars?: number;
  className?: string;
}

/** Visualizador CSS puro — sin Web Audio API, bajo costo de render */
export function AudioVisualizer({
  active = false,
  bars = 5,
  className = "",
}: AudioVisualizerProps) {
  return (
    <div
      className={`flex items-end gap-[3px] ${className}`}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full bg-gradient-to-t from-accent to-alien-cyan ${
            active ? "visualizer-bar h-4" : "h-1 opacity-40"
          }`}
          style={active ? undefined : { height: `${6 + (i % 3) * 3}px` }}
        />
      ))}
    </div>
  );
}
