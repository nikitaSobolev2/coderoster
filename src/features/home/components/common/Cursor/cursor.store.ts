import { create } from 'zustand'

export interface CursorStyleProps {
  width?: string | null
  height?: string | null
  borderRadius?: string | null
  backgroundColor?: string | null
}

export interface CursorState {
  isLocked: boolean
  x: number
  y: number
  styleProps: CursorStyleProps

  // Actions
  setLocked: (locked: boolean) => void
  setPosition: (pos: { x: number; y: number }) => void
  setStyle: (style: Partial<CursorStyleProps>) => void
  resetStyle: () => void
  lockAtCurrentPosition: () => void
  lockAtPosition: (pos: { x: number; y: number }) => void
}

export const defaultCursorStyle: CursorStyleProps = {
  width: null,
  height: null,
  borderRadius: null,
  backgroundColor: null,
}

export const useCursorStore = create<CursorState>((set, get) => ({
  isLocked: false,
  x: 0,
  y: 0,
  styleProps: { ...defaultCursorStyle },

  setLocked: (locked) => set({ isLocked: locked }),

  setPosition: ({ x, y }) => {
    set({ x, y })
  },

  setStyle: (newStyles) =>
    set((state) => ({
      styleProps: { ...state.styleProps, ...newStyles },
    })),

  resetStyle: () =>
    set({ styleProps: { ...defaultCursorStyle } }),

  lockAtCurrentPosition: () => {
    const { x, y } = get()
    set({ isLocked: true, x, y })
  },

  lockAtPosition: ({ x, y }) => {
    set({ isLocked: true, x, y })
  },
}))

export const initialCursorState = useCursorStore.getState();
