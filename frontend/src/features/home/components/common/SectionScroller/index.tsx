'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLoadingStore } from '~/features/home/components/common/AppLoader/loading.store'
import { registerSectionScrollToIdHandler } from '~/features/home/components/common/SectionScroller/section-scroll-api'
import { getSectionIndexFromScroll } from './getSectionIndexFromScroll'
import { getSectionScrollObserverType } from './getSectionScrollObserverType'
import { useSectionScrollerStore, type SectionDescriptor } from './section-scroller.store'
import styles from './styles.module.scss'

gsap.registerPlugin(Observer, ScrollToPlugin, ScrollTrigger)

const SCROLL_DURATION_S = 1
const OBSERVER_TOLERANCE = 12

export interface Props {
  sections: readonly SectionDescriptor[]
  children: React.ReactNode
}

export default function SectionScroller({ sections, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isReady = useLoadingStore(state => state.isReady)
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
      const next = getSectionIndexFromScroll(sections, window.scrollY, window.innerHeight)
      sectionIndexRef.current = next
      setActiveIndex(next)
    }

    syncIndexFromWindowScroll()
    const syncFrame1 = requestAnimationFrame(() => {
      syncIndexFromWindowScroll()
      requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })
    })

    const runScrollToIndex = (targetIndex: number) => {
      const target = clampIndex(targetIndex, sections.length)
      if (target === sectionIndexRef.current) return

      const sectionElement = document.getElementById(sections[target]!.id)
      if (!sectionElement) return

      sectionIndexRef.current = target
      setActiveIndex(target)
      setAnimating(true)
      gsap.to(window, {
        duration: SCROLL_DURATION_S,
        scrollTo: { y: sectionElement.offsetTop, autoKill: true },
        ease: 'power2.inOut',
        overwrite: 'auto',
        onComplete: () => {
          setAnimating(false)
          syncIndexFromWindowScroll()
        }
      })
    }

    const navigateToSectionId = (id: string) => {
      const targetIndex = sections.findIndex(s => s.id === id)
      if (targetIndex < 0) return
      runScrollToIndex(targetIndex)
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) navigateToSectionId(hash)
    }

    const unregisterScroll = registerSectionScrollToIdHandler(navigateToSectionId)

    const wheelOff = prefersReducedMotion()
    const observer = !wheelOff
      ? Observer.create({
          type: getSectionScrollObserverType(),
          wheelSpeed: -1,
          tolerance: OBSERVER_TOLERANCE,
          preventDefault: true,
          onUp: () => {
            if (useSectionScrollerStore.getState().isAnimating) return
            runScrollToIndex(sectionIndexRef.current + 1)
          },
          onDown: () => {
            if (useSectionScrollerStore.getState().isAnimating) return
            runScrollToIndex(sectionIndexRef.current - 1)
          }
        })
      : null

    window.addEventListener('hashchange', handleHashChange)
    document.body.classList.add('section-scroller-active')

    return () => {
      cancelAnimationFrame(syncFrame1)
      unregisterScroll()
      observer?.kill()
      window.removeEventListener('hashchange', handleHashChange)
      document.body.classList.remove('section-scroller-active')
    }
  }, [isReady, sections, setActiveIndex, setAnimating])

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

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
