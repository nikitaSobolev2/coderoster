import { create } from 'zustand'

export interface CursorStyleProps {
  width?: string | null
  height?: string | null
  borderRadius?: string | null
  backgroundColor?: string | null
  borderColor?: string | null
  rotate?: number | null
}

export type CursorType = 'default' | 'arrow'

export interface CursorStore {
  isLocked: boolean
  x: number
  y: number
  styleProps: CursorStyleProps
  type: CursorType

  // Actions
  setLocked: (locked: boolean) => void
  setPosition: (pos: { x: number; y: number }) => void
  setStyle: (style: Partial<CursorStyleProps>) => void
  resetStyle: () => void
  lockAtCurrentPosition: () => void
  lockAtPosition: (pos: { x: number; y: number }) => void
  setType: (type: CursorType) => void
  resetType: () => void
}

export const defaultCursorStyle: CursorStyleProps = {
  width: null,
  height: null,
  borderRadius: null,
  backgroundColor: null,
  borderColor: null,
  rotate: null
}

export const useCursorStore = create<CursorStore>((set, get) => ({
  isLocked: false,
  x: 0,
  y: 0,
  type: 'default',
  styleProps: { ...defaultCursorStyle },

  setLocked: locked => set({ isLocked: locked }),

  setPosition: ({ x, y }) => {
    const { isLocked } = get()
    if (!isLocked) {
      set({ x, y })
    }
  },

  setStyle: newStyles =>
    set(state => ({
      styleProps: { ...state.styleProps, ...newStyles }
    })),

  resetStyle: () => set({ styleProps: { ...defaultCursorStyle } }),

  lockAtCurrentPosition: () => {
    const { x, y } = get()
    set({ isLocked: true, x, y })
  },

  lockAtPosition: ({ x, y }) => {
    set({ isLocked: true, x, y })
  },

  setType: type => set({ type }),

  resetType: () => set({ type: 'default' })
}))

export const initialCursorState = useCursorStore.getState()
