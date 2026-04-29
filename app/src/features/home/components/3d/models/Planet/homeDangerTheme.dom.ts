import { Color, MathUtils } from 'three'

import { DANGER_RED_EMISSIVE_HEX } from './planetRotation.constants'

/** Matches directional / orbit cool side */
const ORBIT_COOL = new Color(0x1b1ec8)
const ORBIT_HOT = new Color(DANGER_RED_EMISSIVE_HEX)

let orbitGlowHost: HTMLElement | null = null
let homeShellHost: HTMLElement | null = null

/** PlanetScene `.container`: drives `::before` orbit halo. */
export function registerPlanetOrbitGlowHost(element: HTMLElement | null) {
  orbitGlowHost = element
  if (!element) return
  element.style.removeProperty('--planet-orbit-glow')
}

/** Home `(home)` shell: drives `--globe-threat` for page-wide blue→warm shift. */
export function registerHomeThreatShellHost(element: HTMLElement | null) {
  homeShellHost = element
  if (!element) return
  element.style.removeProperty('--globe-threat')
}

/**
 * `--planet-orbit-glow`: blue soft halo → coral; heat≈0 removes override (falls back to `--color-primary`).
 */
export function setPlanetOrbitGlowFromHeat(heat01: number) {
  if (!orbitGlowHost) return
  const t = MathUtils.clamp(heat01, 0, 1)
  if (t < 0.002) {
    orbitGlowHost.style.removeProperty('--planet-orbit-glow')
    return
  }
  const blended = new Color().lerpColors(ORBIT_COOL, ORBIT_HOT, t)
  const alpha = MathUtils.lerp(0.25, 0.46, t)
  const r = Math.round(blended.r * 255)
  const g = Math.round(blended.g * 255)
  const b = Math.round(blended.b * 255)
  orbitGlowHost.style.setProperty('--planet-orbit-glow', `rgba(${r},${g},${b},${alpha})`)
}

/** `--globe-threat` on `.homeShell` (numeric 0–1, no unit). */
export function syncHomeThreatGlobe01(threat01: number) {
  if (!homeShellHost) return
  const t = MathUtils.clamp(threat01, 0, 1)
  if (t < 0.001) {
    homeShellHost.style.removeProperty('--globe-threat')
    return
  }
  homeShellHost.style.setProperty('--globe-threat', String(t))
}
