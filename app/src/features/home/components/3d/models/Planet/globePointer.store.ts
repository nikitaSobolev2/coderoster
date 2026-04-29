import { create } from 'zustand'

interface GlobePointerState {
  /** True while pointer intersects invisible globe hit sphere (desktop cursor hint). */
  pointerOverGlobe: boolean
  setPointerOverGlobe: (next: boolean) => void
}

export const useGlobePointerStore = create<GlobePointerState>(set => ({
  pointerOverGlobe: false,
  setPointerOverGlobe: next => set({ pointerOverGlobe: next })
}))
