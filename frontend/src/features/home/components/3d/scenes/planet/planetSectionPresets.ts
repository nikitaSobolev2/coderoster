import { Color as ThreeColor } from 'three'
import type { PlanetSettings } from '~/features/home/components/3d/models/Planet/planet.store'

const BASE = {
  warmIntensity: 2.2,
  directionalIntensity: 2.5
}

export type PlanetSectionLighting = {
  warmIntensity: number
  directionalIntensity: number
  /** Optional override; else PlanetScene uses CSS var fallbacks */
  warmColor?: string
  directionalColor?: string
}

export interface PlanetSectionPlacement {
  /**
   * GSAP `x`/`y` in px. Model: viewport center of globe at rest ≈ (W/2, H/2);
   * translate moves that center: x = targetCx - W/2, y = targetCy - H/2.
   */
  getTranslate: (ctx: { innerWidth: number; innerHeight: number }) => { x: number; y: number }
  /** Multiplier on section-0 “visual” size; drives `setPlanetScale` only. */
  targetScale: number
}

export interface PlanetSectionPreset extends PlanetSectionPlacement {
  lighting: PlanetSectionLighting
  /**
   * Partial override of `Planet` material behavior (merged into `usePlanetStore`).
   * Use `emissive` / `atmosphere` via numeric fields; colors stay default unless new setters.
   */
  getPlanetSettingsPatch: () => Partial<
    Pick<
      PlanetSettings,
      | 'rotationSpeed'
      | 'bumpScale'
      | 'emissiveIntensity'
      | 'atmosphereIntensity'
      | 'emissiveColor'
      | 'atmosphereColor'
    >
  >
  /** When true, transition into this section animates y from off-screen top (footer only). */
  enterFromTop?: boolean
  /** Mobile-only override of placement; lighting/material stays shared. */
  mobile?: PlanetSectionPlacement
}

const homeTranslate = () => ({ x: 0, y: 0 })

/** Section 0 — hero: explicit baseline: no extra translate, scale 1. */
const hero: PlanetSectionPreset = {
  getTranslate: homeTranslate,
  targetScale: 1,
  lighting: { ...BASE },
  getPlanetSettingsPatch: () => ({
    rotationSpeed: 0.0006,
    bumpScale: 0.05,
    emissiveIntensity: 0.4,
    atmosphereIntensity: 0.3
  }),
  mobile: {
    getTranslate: ({ innerHeight }) => ({ x: 0, y: -innerHeight / 2 }),
    targetScale: 1
  }
}

/** Section 1 — center of right 50vw. */
const bitterTruth: PlanetSectionPreset = {
  getTranslate: ({ innerWidth, innerHeight }) => {
    const targetCx = 0.75 * innerWidth
    const targetCy = 0
    return { x: targetCx - innerWidth / 2, y: targetCy - innerHeight / 2 }
  },
  targetScale: 0.75,
  lighting: { warmIntensity: 2.4, directionalIntensity: 2.2 },
  getPlanetSettingsPatch: () => ({
    rotationSpeed: 0.0008,
    emissiveIntensity: 0.45,
    atmosphereIntensity: 0.35
  }),
  mobile: {
    getTranslate: ({ innerWidth, innerHeight }) => {
      const targetCx = innerWidth * 0.9
      const targetCy = 0.35 * innerHeight
      return { x: targetCx - innerWidth / 2, y: targetCy - innerHeight / 2 }
    },
    targetScale: 1.15
  }
}

/** Section 2 — left half, slightly past left edge. */
const whatToDo: PlanetSectionPreset = {
  getTranslate: ({ innerWidth, innerHeight }) => {
    const overhang = innerWidth * 0.3
    const targetCx = 0.25 * innerWidth - overhang
    const targetCy = 0
    return { x: targetCx - innerWidth / 2, y: targetCy - innerHeight / 2 }
  },
  targetScale: 1.35,
  lighting: { warmIntensity: 2, directionalIntensity: 2.7 },
  getPlanetSettingsPatch: () => ({
    rotationSpeed: 0.0005,
    bumpScale: 0.07,
    emissiveIntensity: 0.5,
    atmosphereIntensity: 0.4
  }),
  mobile: {
    getTranslate: ({ innerWidth, innerHeight }) => {
      const targetCx = -0.05 * innerWidth
      const targetCy = 0.25 * innerHeight
      return { x: targetCx - innerWidth / 2, y: targetCy - innerHeight / 2 }
    },
    targetScale: 1.4
  }
}

/** Section 3 — bottom-right; mostly off-screen, top-left quarter visible. */
const howToStart: PlanetSectionPreset = {
  getTranslate: ({ innerWidth, innerHeight }) => {
    const targetCx = 0.88 * innerWidth
    const targetCy = 0.5 * innerHeight
    return { x: targetCx - innerWidth / 2, y: targetCy - innerHeight / 2 }
  },
  targetScale: 1,
  lighting: { warmIntensity: 1.8, directionalIntensity: 2.6 },
  getPlanetSettingsPatch: () => ({
    rotationSpeed: 0.0007,
    emissiveIntensity: 0.35,
    atmosphereIntensity: 0.25
  }),
  mobile: {
    getTranslate: ({ innerWidth, innerHeight }) => {
      const targetCx = 0.55 * innerWidth
      const targetCy = -0.65 * innerHeight
      return { x: targetCx - innerWidth / 2, y: targetCy - innerHeight / 2 }
    },
    targetScale: 2
  }
}

/** Section 4 — viewport center, large. */
const features: PlanetSectionPreset = {
  getTranslate: ({ innerHeight }) => {
    const targetCx = 0
    const targetCy = -innerHeight * 1.45
    return { x: targetCx, y: targetCy }
  },
  targetScale: 1.6,
  lighting: { warmIntensity: 2.5, directionalIntensity: 2.4 },
  getPlanetSettingsPatch: () => ({
    rotationSpeed: 0.0004,
    bumpScale: 0.04,
    emissiveIntensity: 0.55,
    atmosphereIntensity: 0.45
  }),
  mobile: {
    getTranslate: ({ innerHeight }) => {
      const targetCx = 0
      const targetCy = 0.2 * innerHeight
      return { x: targetCx - innerWidth / 2, y: targetCy - innerHeight / 2 }
    },
    targetScale: 1.6
  }
}

/** Section 5 — same position as hero; enter-from-top handled in PlanetScene. */
const footer: PlanetSectionPreset = {
  getTranslate: homeTranslate,
  targetScale: 1,
  lighting: { ...BASE },
  getPlanetSettingsPatch: () => ({
    rotationSpeed: 0.0006,
    emissiveColor: new ThreeColor(0x4a4ec4),
    atmosphereColor: new ThreeColor(0x5a8fc4),
    emissiveIntensity: 0.42,
    atmosphereIntensity: 0.32
  })
}

/**
 * Order must match `SECTIONS` in `src/app/(home)/page.tsx`:
 * hero, bitter-truth, what-to-do, how-to-start, features, contact-us.
 */
export const PLANET_SECTION_PRESETS: readonly PlanetSectionPreset[] = [
  hero,
  bitterTruth,
  whatToDo,
  howToStart,
  features,
  footer
] as const

const HERO_PRESET: PlanetSectionPreset = hero

export function getPlanetPresetForIndex(index: number): PlanetSectionPreset {
  const n = Math.max(0, Math.min(PLANET_SECTION_PRESETS.length - 1, index))
  return PLANET_SECTION_PRESETS[n] ?? HERO_PRESET
}

export function getPlanetPlacementForIndex(
  index: number,
  isMobile: boolean
): PlanetSectionPlacement {
  const preset = getPlanetPresetForIndex(index)
  if (isMobile && preset.mobile) return preset.mobile
  return { getTranslate: preset.getTranslate, targetScale: preset.targetScale }
}
