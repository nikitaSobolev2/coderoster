'use client'

import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getPlanetPlacementForIndex } from '~/features/home/components/3d/scenes/planet/planetSectionPresets'
import { useSectionScrollerStore } from '~/features/home/components/common/SectionScroller/section-scroller.store'

gsap.registerPlugin(ScrollTrigger)

interface ViewportSize {
  innerWidth: number
  innerHeight: number
}

interface Options {
  enabled: boolean
  containerRef: RefObject<HTMLDivElement | null>
  setPlanetScale: (scale: number) => void
}

interface Segment {
  fromIndex: number
  toIndex: number
  progress: number
}

interface ApplyOptions {
  elements: readonly HTMLElement[]
  container: HTMLDivElement
  setPlanetScale: (scale: number) => void
}

/**
 * Mobile driver: one master `ScrollTrigger` covers full document scroll;
 * segment + progress derived from `scrollY` vs section `offsetTop`s, so
 * boundaries are disjoint and never fight (fixes jump bug when sections
 * are shorter than viewport). Lighting/material patches stay stepwise via
 * `activeIndex` (handled in `PlanetScene`).
 */
export function useMobilePlanetScrollTimeline(options: Options): void {
  const { enabled, containerRef, setPlanetScale } = options

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const container = containerRef.current
    if (!container) return

    const elements = collectSectionElements()
    if (elements.length < 2) return

    const apply = () => applyScrollPlacement({ elements, container, setPlanetScale })

    apply()
    const masterTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: 'max',
      scrub: true,
      onUpdate: apply
    })

    const handleResize = () => {
      ScrollTrigger.refresh()
      apply()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      masterTrigger.kill()
      window.removeEventListener('resize', handleResize)
    }
  }, [enabled, containerRef, setPlanetScale])
}

function collectSectionElements(): readonly HTMLElement[] {
  const sections = useSectionScrollerStore.getState().sections
  const elements: HTMLElement[] = []
  for (const section of sections) {
    const element = document.getElementById(section.id)
    if (element) elements.push(element)
  }
  return elements
}

function applyScrollPlacement(options: ApplyOptions): void {
  const { elements, container, setPlanetScale } = options
  const segment = findCurrentSegment(elements, window.scrollY)
  const viewport = getViewportSize()
  const fromPlacement = getPlanetPlacementForIndex(segment.fromIndex, true)
  const toPlacement = getPlanetPlacementForIndex(segment.toIndex, true)
  const fromTranslate = fromPlacement.getTranslate(viewport)
  const toTranslate = toPlacement.getTranslate(viewport)

  gsap.set(container, {
    x: gsap.utils.interpolate(fromTranslate.x, toTranslate.x, segment.progress),
    y: gsap.utils.interpolate(fromTranslate.y, toTranslate.y, segment.progress),
    overwrite: 'auto'
  })
  setPlanetScale(
    gsap.utils.interpolate(fromPlacement.targetScale, toPlacement.targetScale, segment.progress)
  )
}

function findCurrentSegment(elements: readonly HTMLElement[], scrollY: number): Segment {
  for (let index = 0; index < elements.length - 1; index++) {
    const fromElement = elements[index]
    const toElement = elements[index + 1]
    if (!fromElement || !toElement) continue
    const fromTop = fromElement.offsetTop
    const toTop = toElement.offsetTop
    if (scrollY < toTop) {
      const span = Math.max(1, toTop - fromTop)
      const raw = (scrollY - fromTop) / span
      return {
        fromIndex: index,
        toIndex: index + 1,
        progress: clampProgress(raw)
      }
    }
  }
  const lastIndex = elements.length - 1
  return { fromIndex: lastIndex, toIndex: lastIndex, progress: 0 }
}

function clampProgress(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function getViewportSize(): ViewportSize {
  return { innerWidth: window.innerWidth, innerHeight: window.innerHeight }
}
