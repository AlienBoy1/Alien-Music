/** Fondo cósmico CSS-only — sin canvas, optimizado con contain */
export function CosmicBackground() {
  return (
    <div className="cosmic-bg" aria-hidden>
      <div className="cosmic-nebula" />
      <div className="cosmic-stars" />
      <div className="scan-line-overlay" />
    </div>
  );
}
