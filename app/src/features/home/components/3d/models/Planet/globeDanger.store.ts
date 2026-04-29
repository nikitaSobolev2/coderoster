import { create } from 'zustand'

/** Smoothed 0–1 globe threat; writers: `Planet` `useFrame` only. Consumers: R3F lights, subscribers. */
export interface GlobeDangerDisplayState {
  displayThreat01: number
  setDisplayThreat01: (value01: number) => void
}

export const useGlobeDangerDisplayStore = create<GlobeDangerDisplayState>(set => ({
  displayThreat01: 0,
  setDisplayThreat01: displayThreat01 => set({ displayThreat01 })
}))
