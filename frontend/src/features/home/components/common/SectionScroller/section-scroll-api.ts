import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)

const SCROLL_DURATION_S = 1

type ScrollToId = (id: string) => void

let handleScrollToId: ScrollToId | null = null

export function registerSectionScrollToIdHandler(handler: ScrollToId) {
  handleScrollToId = handler
  return () => {
    handleScrollToId = null
  }
}

export function scrollToSectionById(id: string) {
  if (handleScrollToId) {
    handleScrollToId(id)
    return
  }
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  gsap.to(window, {
    duration: SCROLL_DURATION_S,
    scrollTo: { y: el.offsetTop, autoKill: true },
    ease: 'power2.inOut'
  })
}
