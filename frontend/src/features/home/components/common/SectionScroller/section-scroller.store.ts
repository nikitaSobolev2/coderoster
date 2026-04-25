import { create } from 'zustand'

export interface SectionDescriptor {
  id: string
  label: string
  nextLabel?: string
}

export interface SectionScrollerStore {
  sections: readonly SectionDescriptor[]
  activeIndex: number
  isAnimating: boolean

  setSections: (sections: readonly SectionDescriptor[]) => void
  setActiveIndex: (index: number) => void
  setAnimating: (animating: boolean) => void
}

export const useSectionScrollerStore = create<SectionScrollerStore>(set => ({
  sections: [],
  activeIndex: 0,
  isAnimating: false,

  setSections: sections => set({ sections }),
  setActiveIndex: index => set({ activeIndex: index }),
  setAnimating: animating => set({ isAnimating: animating })
}))
