import { create } from 'zustand'

export interface CursorStyleProps {
  width?: string | null
  height?: string | null
  borderRadius?: string | null
  backgroundColor?: string | null
  borderColor?: string | null
  rotate?: number | null
}

export type CursorMediaType = 'image' | 'video'

export interface CursorMedia {
  type: CursorMediaType
  src: string
}

export type CursorType = 'default' | 'arrow' | 'globeHorizontal' | 'image' | 'video'

export interface CursorStore {
  /**
   * While true (e.g. pointer over livechat on HOME): hide custom cursor and tear down its listeners/rAF.
   * Globe hover glyph sync reads this too.
   */
  homeCursorSuspended: boolean

  isLocked: boolean
  /** Viewport X/Y for the custom cursor lerp target (may stay fixed while locked). */
  x: number
  y: number
  /** Last real pointer position, always updated on mousemove; use for hit-testing (e.g. after scroll). */
  pointerX: number
  pointerY: number
  styleProps: CursorStyleProps
  type: CursorType
  media: CursorMedia | null

  setLocked: (locked: boolean) => void
  setHomeCursorSuspended: (next: boolean) => void
  setPosition: (pos: { x: number; y: number }) => void
  setStyle: (style: Partial<CursorStyleProps>) => void
  resetStyle: () => void
  lockAtCurrentPosition: () => void
  lockAtPosition: (pos: { x: number; y: number }) => void
  setType: (type: CursorType) => void
  resetType: () => void
  setMedia: (media: CursorMedia | null) => void
  resetMedia: () => void
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
  homeCursorSuspended: false,

  isLocked: false,
  x: 0,
  y: 0,
  pointerX: 0,
  pointerY: 0,
  type: 'default',
  styleProps: { ...defaultCursorStyle },
  media: null,

  setLocked: locked => set({ isLocked: locked }),

  setHomeCursorSuspended: next => set({ homeCursorSuspended: next }),

  setPosition: ({ x, y }) => {
    set({ pointerX: x, pointerY: y })
    if (get().homeCursorSuspended) return
    if (!get().isLocked) {
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

  resetType: () => set({ type: 'default' }),

  setMedia: media => set({ media }),

  resetMedia: () => set({ media: null })
}))

export const initialCursorState = useCursorStore.getState()
