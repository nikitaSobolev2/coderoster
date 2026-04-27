import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import sectionHeaderStyles from '~/features/home/components/ui/SectionHeader/styles.module.scss'

let pluginRegistered = false

export function ensureScrollTrigger() {
  if (pluginRegistered) return
  gsap.registerPlugin(ScrollTrigger)
  pluginRegistered = true
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const sectionScroll = {
  enterLoose: { start: 'top 80%', toggleActions: 'play none none reverse' as const },
  enterTight: { start: 'top 72%', toggleActions: 'play none none reverse' as const }
}

export function querySectionHeader(root: HTMLElement) {
  return {
    eyebrow: root.querySelector<HTMLElement>(`.${sectionHeaderStyles.sectionHeader__eyebrow}`),
    title: root.querySelector<HTMLElement>(`.${sectionHeaderStyles.sectionHeader__title}`),
    subtitle: root.querySelector<HTMLElement>(`.${sectionHeaderStyles.sectionHeader__subtitle}`)
  }
}

export function refreshScrollTriggersNextFrame() {
  if (typeof window === 'undefined') return
  requestAnimationFrame(() => {
    ScrollTrigger.refresh()
  })
}
