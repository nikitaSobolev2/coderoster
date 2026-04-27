import type { Group } from 'three'
import { create } from 'zustand'

/** Outer `<group>` around scaled planet; used for GSAP rotation burst from outside Canvas. */
interface PlanetGroupRefState {
  group: Group | null
  setGroup: (group: Group | null) => void
}

export const usePlanetGroupRefStore = create<PlanetGroupRefState>(set => ({
  group: null,
  setGroup: group => set({ group })
}))
