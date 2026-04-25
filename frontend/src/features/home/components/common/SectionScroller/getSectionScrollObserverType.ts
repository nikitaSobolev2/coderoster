/**
 * GSAP Observer `type` for section-by-section scroll.
 * Fine pointer (mouse / typical desktop): exclude `pointer` so click-drag
 * does not act like a vertical swipe. Wheel and touch unchanged.
 * Coarse / touch-primary: keep `pointer` for hybrid devices that rely on it.
 */
export function getSectionScrollObserverType(): 'wheel,touch' | 'wheel,touch,pointer' {
  if (typeof window === 'undefined') {
    return 'wheel,touch,pointer'
  }
  if (window.matchMedia('(pointer: fine)').matches) {
    return 'wheel,touch'
  }
  return 'wheel,touch,pointer'
}
