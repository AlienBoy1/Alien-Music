/** Versión empaquetada de la app (sincronizar con package.json) */
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ?? "1.1.0";

/**
 * Compara semver simple (major.minor.patch).
 * @returns negativo si a < b, 0 si igual, positivo si a > b
 */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .trim()
      .replace(/^v/i, "")
      .split(".")
      .slice(0, 3)
      .map((n) => parseInt(n, 10) || 0);

  const pa = parse(a);
  const pb = parse(b);

  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** true si la versión local es estrictamente menor que la mínima requerida */
export function isVersionOutdated(
  localVersion: string,
  minRequiredVersion: string,
): boolean {
  return compareSemver(localVersion, minRequiredVersion) < 0;
}
