import { PLANET_LEGACY_ROTATION_TICK_HZ } from './planetRotation.constants'

export function saturate(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const denom = edge1 - edge0
  if (denom === 0) {
    return value < edge0 ? 0 : 1
  }
  const unit = saturate((value - edge0) / denom)
  return unit * unit * (3 - 2 * unit)
}

/** Convert legacy preset tick rate → rad/s (see planetRotation.constants). */
export function planetIdleRotationRadiansPerSecond(legacyTickRate: number): number {
  return legacyTickRate * PLANET_LEGACY_ROTATION_TICK_HZ
}

export function applyAngularDrag(omega: number, dampingC: number, deltaSeconds: number): number {
  return omega * Math.exp(-dampingC * deltaSeconds)
}

export function expoSmooth(previous: number, sample: number, lambda: number): number {
  return lambda * sample + (1 - lambda) * previous
}

export function clampMagnitudeRadPerSec(omega: number, maxAbsolute: number): number {
  if (omega > maxAbsolute) return maxAbsolute
  if (omega < -maxAbsolute) return -maxAbsolute
  return omega
}

/** Perceptual severity 0–1 from user angular velocity for emissive lerping. */
export function angularVelocityDangerFactor(
  omegaMagnitudeRadPerS: number,
  criticalRadPerS: number
): number {
  const ratio = criticalRadPerS > 1e-6 ? omegaMagnitudeRadPerS / criticalRadPerS : 0
  /** Ramp up sooner and reach near-full tint before ω hits ω_crit (readable red). */
  return smoothstep(0.26, 0.92, saturate(ratio))
}
