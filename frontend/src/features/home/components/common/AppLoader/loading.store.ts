import { create } from 'zustand'

export interface LoadingStore {
  progress: number
  isReady: boolean
  setProgress: (progress: number) => void
  markReady: () => void
}

export const useLoadingStore = create<LoadingStore>(set => ({
  progress: 0,
  isReady: false,

  setProgress: progress => set({ progress: Math.min(1, Math.max(0, progress)) }),

  markReady: () => set({ isReady: true, progress: 1 })
}))
