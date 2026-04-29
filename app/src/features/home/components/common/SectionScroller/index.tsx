'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLoadingStore } from '~/features/home/components/common/AppLoader/loading.store'
import { registerSectionScrollToIdHandler } from '~/features/home/components/common/SectionScroller/section-scroll-api'
import { useMatchMedia } from '~/shared/hooks/useMatchMedia'
import { getSectionIndexFromScroll } from './getSectionIndexFromScroll'
import { getDocumentScrollTopPx, getScrollableRoot } from './getDocumentScrollTopPx'
import { LIVECHAT_DOM_ISOLATE_SELECTOR } from '~/shared/constants/livechatDom'
import { getSectionScrollObserverType } from './getSectionScrollObserverType'
import { useSectionScrollerStore, type SectionDescriptor } from './section-scroller.store'
import styles from './styles.module.scss'

gsap.registerPlugin(Observer, ScrollToPlugin, ScrollTrigger)

const SCROLL_DURATION_S = 1
const OBSERVER_TOLERANCE = 12
const MOBILE_MQ = '(max-width: 768px)'
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)'

/** GSAP resolves `ignore` once at Observer.create via `utils.toArray` — matches zero nodes if chat is closed → ignore never updates when chat opens; use `closest` at event time. */
function wheelShouldSkipSectionSnapForLivechatTarget(event: Event): boolean {
  const { target } = event
  if (!(target instanceof Element)) return false
  return target.closest(LIVECHAT_DOM_ISOLATE_SELECTOR) != null
}

export interface Props {
  sections: readonly SectionDescriptor[]
  children: React.ReactNode
}

type IndexRef = React.RefObject<number>
type Navigator = (targetIndex: number) => void

export default function SectionScroller({ sections, children }: Readonly<Props>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isReady = useLoadingStore(state => state.isReady)
  const isMobile = useMatchMedia(MOBILE_MQ)
  const prefersReducedMotion = useMatchMedia(REDUCED_MOTION_MQ)
  const useSnapScroll = !isMobile && !prefersReducedMotion

  const sectionIndexRef = useRef(0)

  const setSections = useSectionScrollerStore(state => state.setSections)
  const setActiveIndex = useSectionScrollerStore(state => state.setActiveIndex)
  const setAnimating = useSectionScrollerStore(state => state.setAnimating)

  useEffect(() => {
    setSections(sections)
  }, [sections, setSections])

  useEffect(() => {
    if (!isReady) return
    if (typeof window === 'undefined') return

    const syncIndexFromWindowScroll = () => {
      const scrollTop = getScrollableRoot().scrollTop
      const next = getSectionIndexFromScroll(sections, scrollTop, window.innerHeight)
      sectionIndexRef.current = next
      setActiveIndex(next)
    }

    syncIndexFromWindowScroll()
    const syncFrame = requestAnimationFrame(() => {
      syncIndexFromWindowScroll()
      requestAnimationFrame(() => ScrollTrigger.refresh())
    })

    const navigateToIndex: Navigator = useSnapScroll
      ? createSnapNavigator({
          sections,
          sectionIndexRef,
          setActiveIndex,
          setAnimating,
          syncIndex: syncIndexFromWindowScroll
        })
      : createNativeNavigator({ sections, sectionIndexRef, setActiveIndex })

    const navigateToSectionId = (id: string) => {
      const target = sections.findIndex(s => s.id === id)
      if (target < 0) return
      navigateToIndex(target)
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) navigateToSectionId(hash)
    }

    const unregisterScroll = registerSectionScrollToIdHandler(navigateToSectionId)
    const cleanups: Array<() => void> = []

    if (useSnapScroll) {
      const observer = Observer.create({
        type: getSectionScrollObserverType(),
        wheelSpeed: -1,
        tolerance: OBSERVER_TOLERANCE,
        preventDefault: true,
        /** Let livechat ScrollArea / inputs keep native wheel; `data-livechat-cursor-isolate` marks floating shell & drawer. */
        ignoreCheck: wheelShouldSkipSectionSnapForLivechatTarget,
        onUp: () => {
          if (useSectionScrollerStore.getState().isAnimating) return
          navigateToIndex(sectionIndexRef.current + 1)
        },
        onDown: () => {
          if (useSectionScrollerStore.getState().isAnimating) return
          navigateToIndex(sectionIndexRef.current - 1)
        }
      })
      cleanups.push(() => observer.kill())
      document.body.classList.add('section-scroller-active')
      cleanups.push(() => document.body.classList.remove('section-scroller-active'))
    } else {
      const triggers = createActiveSectionTriggers(sections, index => {
        sectionIndexRef.current = index
        setActiveIndex(index)
      })
      cleanups.push(() => triggers.forEach(trigger => trigger.kill()))
    }

    window.addEventListener('hashchange', handleHashChange)
    cleanups.push(() => window.removeEventListener('hashchange', handleHashChange))

    return () => {
      cancelAnimationFrame(syncFrame)
      unregisterScroll()
      cleanups.forEach(fn => fn())
    }
  }, [isReady, sections, setActiveIndex, setAnimating, useSnapScroll])

  return (
    <div ref={containerRef} className={styles.scroller}>
      {children}
    </div>
  )
}

function clampIndex(index: number, length: number) {
  if (index < 0) return 0
  if (index > length - 1) return length - 1
  return index
}

interface SnapNavigatorOptions {
  sections: readonly SectionDescriptor[]
  sectionIndexRef: IndexRef
  setActiveIndex: (index: number) => void
  setAnimating: (animating: boolean) => void
  syncIndex: () => void
}

function createSnapNavigator(options: SnapNavigatorOptions): Navigator {
  const { sections, sectionIndexRef, setActiveIndex, setAnimating, syncIndex } = options
  return targetIndex => {
    const target = clampIndex(targetIndex, sections.length)
    if (target === sectionIndexRef.current) return
    const sectionElement = document.getElementById(sections[target]!.id)
    if (!sectionElement) return

    sectionIndexRef.current = target
    setActiveIndex(target)
    setAnimating(true)
    gsap.to(getScrollableRoot(), {
      duration: SCROLL_DURATION_S,
      scrollTo: { y: getDocumentScrollTopPx(sectionElement), autoKill: true },
      ease: 'power2.inOut',
      overwrite: 'auto',
      onComplete: () => {
        setAnimating(false)
        syncIndex()
      }
    })
  }
}

interface NativeNavigatorOptions {
  sections: readonly SectionDescriptor[]
  sectionIndexRef: IndexRef
  setActiveIndex: (index: number) => void
}

function createNativeNavigator(options: NativeNavigatorOptions): Navigator {
  const { sections, sectionIndexRef, setActiveIndex } = options
  return targetIndex => {
    const target = clampIndex(targetIndex, sections.length)
    const sectionElement = document.getElementById(sections[target]!.id)
    if (!sectionElement) return
    sectionIndexRef.current = target
    setActiveIndex(target)
    getScrollableRoot().scrollTo({
      top: getDocumentScrollTopPx(sectionElement),
      behavior: 'smooth'
    })
  }
}

function createActiveSectionTriggers(
  sections: readonly SectionDescriptor[],
  onActivate: (index: number) => void
): ScrollTrigger[] {
  const triggers: ScrollTrigger[] = []
  sections.forEach((section, index) => {
    const element = document.getElementById(section.id)
    if (!element) return
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top 65%',
      end: 'bottom 35%',
      onToggle: self => {
        if (self.isActive) onActivate(index)
      }
    })
    triggers.push(trigger)
  })
  return triggers
}
