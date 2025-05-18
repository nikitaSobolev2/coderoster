import { create } from 'zustand'

interface PlanetScaleState {
  planetScale: number
  setPlanetScale: (scale: number) => void
}

export const usePlanetScaleStore = create<PlanetScaleState>(set => ({
  planetScale: 1.0,
  setPlanetScale: scale => set({ planetScale: scale })
}))
