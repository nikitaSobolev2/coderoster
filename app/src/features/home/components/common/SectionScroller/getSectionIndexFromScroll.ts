import type { SectionDescriptor } from './section-scroller.store'

/**
 * Which section is "active" for wheel navigation, given the current scroll position
 * (used after full reload / bfcache when scroll position does not start at 0).
 */
export function getSectionIndexFromScroll(
  sections: readonly SectionDescriptor[],
  scrollTop: number,
  viewportHeight: number
): number {
  const y = scrollTop + viewportHeight * 0.35
  let best = 0
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i]!.id)
    if (!el) continue
    const sectionTop = Math.round(el.getBoundingClientRect().top + scrollTop)
    if (sectionTop <= y) best = i
  }
  return best
}
