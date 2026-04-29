import { Color, MathUtils } from 'three'

import { DANGER_RED_EMISSIVE_HEX } from './planetRotation.constants'

/** Matches `--color-r3f-directional` / cool side of orbit glow */
const ORBIT_COOL = new Color(0x1b1ec8)
const ORBIT_HOT = new Color(DANGER_RED_EMISSIVE_HEX)

let host: HTMLElement | null = null

/** Binds `.container` that owns `::before` orbit glow (PlanetScene). */
export function registerPlanetOrbitGlowHost(element: HTMLElement | null) {
  host = element
  if (!element) return
  element.style.removeProperty('--planet-orbit-glow')
}

/**
 * Drives `--planet-orbit-glow` on the registered host: blue soft halo → red as heat → 1.
 * When heat ≈ 0, property is removed so CSS falls back to `var(--color-primary)`.
 */
export function setPlanetOrbitGlowFromHeat(heat01: number) {
  if (!host) return
  const t = MathUtils.clamp(heat01, 0, 1)
  if (t < 0.002) {
    host.style.removeProperty('--planet-orbit-glow')
    return
  }
  const blended = new Color().lerpColors(ORBIT_COOL, ORBIT_HOT, t)
  const alpha = MathUtils.lerp(0.25, 0.46, t)
  const r = Math.round(blended.r * 255)
  const g = Math.round(blended.g * 255)
  const b = Math.round(blended.b * 255)
  host.style.setProperty('--planet-orbit-glow', `rgba(${r},${g},${b},${alpha})`)
}
