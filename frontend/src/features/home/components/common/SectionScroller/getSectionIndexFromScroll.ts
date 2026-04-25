import type { SectionDescriptor } from './section-scroller.store'

/**
 * Which section is "active" for wheel navigation, given the current scroll position
 * (used after full reload / bfcache when scrollY does not start at 0).
 */
export function getSectionIndexFromScroll(
  sections: SectionDescriptor[],
  scrollY: number,
  viewportHeight: number
): number {
  const y = scrollY + viewportHeight * 0.35
  let best = 0
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i]!.id)
    if (el && el.offsetTop <= y) {
      best = i
    }
  }
  return best
}
