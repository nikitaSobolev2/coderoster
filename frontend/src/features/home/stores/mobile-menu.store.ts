import { create } from 'zustand'

export const MOBILE_HOME_MENU_PANEL_ID = 'mobile-home-menu-panel'

export interface MobileMenuStore {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useMobileMenuStore = create<MobileMenuStore>(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(s => ({ isOpen: !s.isOpen }))
}))
