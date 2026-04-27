import { create } from 'zustand'
import { Vector2 as ThreeVector2, Color as ThreeColor } from 'three'

// Define a fixed base radius for the planet in world units
const BASE_PLANET_RADIUS = 15

export const planetDimensions = {
  planetRadius: BASE_PLANET_RADIUS,
  islandReefRadius: BASE_PLANET_RADIUS * 1.001,
  ruralLightsRadius: BASE_PLANET_RADIUS * 1.002,
  cloudRadius: BASE_PLANET_RADIUS * 1.015,
  atmosphereRadius: BASE_PLANET_RADIUS * 1.025
}

export interface PlanetSettings {
  rotationSpeed: number
  normalScale: ThreeVector2
  bumpScale: number
  emissiveColor: ThreeColor
  emissiveIntensity: number
  atmosphereColor: ThreeColor
  atmosphereIntensity: number
}

interface PlanetStore {
  // Settings
  settings: PlanetSettings

  // Actions
  setRotationSpeed: (speed: number) => void
  setNormalScale: (scale: ThreeVector2) => void
  setBumpScale: (scale: number) => void
  setEmissiveColor: (color: ThreeColor) => void
  setEmissiveIntensity: (intensity: number) => void
  setAtmosphereColor: (color: ThreeColor) => void
  setAtmosphereIntensity: (intensity: number) => void
  /** Merge per-section material tweaks (e.g. from `planetSectionPresets`). */
  applyPlanetSectionVisuals: (patch: Partial<PlanetSettings>) => void
}

export const usePlanetStore = create<PlanetStore>(set => ({
  settings: {
    rotationSpeed: 0.0006,
    normalScale: new ThreeVector2(0.8, 0.8),
    bumpScale: 0.05,
    emissiveColor: new ThreeColor(0x1b1ec8),
    emissiveIntensity: 0.4,
    atmosphereColor: new ThreeColor(0x4682b4),
    atmosphereIntensity: 0.3
  },

  setRotationSpeed: speed =>
    set(state => ({
      settings: { ...state.settings, rotationSpeed: speed }
    })),

  setNormalScale: scale =>
    set(state => ({
      settings: { ...state.settings, normalScale: scale }
    })),

  setBumpScale: scale =>
    set(state => ({
      settings: { ...state.settings, bumpScale: scale }
    })),

  setEmissiveColor: color =>
    set(state => ({
      settings: { ...state.settings, emissiveColor: color }
    })),

  setEmissiveIntensity: intensity =>
    set(state => ({
      settings: { ...state.settings, emissiveIntensity: intensity }
    })),

  setAtmosphereColor: color =>
    set(state => ({
      settings: { ...state.settings, atmosphereColor: color.clone() }
    })),

  setAtmosphereIntensity: intensity =>
    set(state => ({
      settings: { ...state.settings, atmosphereIntensity: intensity }
    })),

  applyPlanetSectionVisuals: patch =>
    set(state => {
      const s = { ...state.settings }
      if (patch.rotationSpeed !== undefined) s.rotationSpeed = patch.rotationSpeed
      if (patch.normalScale !== undefined) s.normalScale = patch.normalScale.clone()
      if (patch.bumpScale !== undefined) s.bumpScale = patch.bumpScale
      if (patch.emissiveColor !== undefined) s.emissiveColor = patch.emissiveColor.clone()
      if (patch.emissiveIntensity !== undefined) s.emissiveIntensity = patch.emissiveIntensity
      if (patch.atmosphereColor !== undefined) s.atmosphereColor = patch.atmosphereColor.clone()
      if (patch.atmosphereIntensity !== undefined) s.atmosphereIntensity = patch.atmosphereIntensity
      return { settings: s }
    })
}))
