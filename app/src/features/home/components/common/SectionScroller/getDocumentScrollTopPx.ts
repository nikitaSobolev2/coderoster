/**
 * Root element used for viewport scroll (`<html>` in standards mode). Prefer over
 * `window` for GSAP ScrollToPlugin — `body.section-scroller-active { overflow: hidden }`
 * leaves `document.documentElement` as scroll container; tweening `window` may not move the page.
 */
export function getScrollableRoot(): HTMLElement {
  return (document.scrollingElement ?? document.documentElement) as HTMLElement
}

/**
 * Document-space Y coordinate for aligning scroll with a section root. Prefer over
 * `HTMLElement.offsetTop` (offset-parent relative).
 */
export function getDocumentScrollTopPx(element: HTMLElement): number {
  if (typeof window === 'undefined') return element.offsetTop
  const scrollTop = getScrollableRoot().scrollTop
  return Math.round(element.getBoundingClientRect().top + scrollTop)
}
