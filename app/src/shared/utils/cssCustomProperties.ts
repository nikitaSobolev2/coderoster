/**
 * Reads a root CSS custom property. Used when TS needs same value as SCSS (e.g. padding in px).
 * Raw fallback only for SSR/edge; keep in sync with :root in variables.scss.
 */
export function readRootCssVarPx(name: string, fallbackPx: number): number {
  if (typeof document === 'undefined') {
    return fallbackPx
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw) {
    return fallbackPx
  }
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallbackPx
}

/**
 * Solid color string for WebGL/Three (e.g. directionalLight), sourced from :root.
 */
export function readRootCssColorVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') {
    return fallback
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
