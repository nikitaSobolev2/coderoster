'use client'

import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { useLoadingStore } from '~/features/home/components/common/AppLoader/loading.store'
import {
  ensureScrollTrigger,
  prefersReducedMotion,
  querySectionHeader,
  sectionScroll
} from '~/features/home/animation/sectionEntrance/shared'

type ClassNames = { solution: string }

export function useWhatToDoEntrance(
  sectionRef: RefObject<HTMLElement | null>,
  classes: ClassNames
) {
  const isReady = useLoadingStore(state => state.isReady)

  useEffect(() => {
    const root = sectionRef.current
    if (!root || !isReady || prefersReducedMotion()) return
    ensureScrollTrigger()

    const { eyebrow, title, subtitle } = querySectionHeader(root)
    const items = root.querySelectorAll<HTMLElement>(`.${classes.solution}`)
    if (!eyebrow || !title) return

    const ctx = gsap.context(() => {
      const st = { trigger: root, ...sectionScroll.enterTight, end: 'bottom top' }

      const whatTl = gsap.timeline({ scrollTrigger: st })
      whatTl
        .from(eyebrow, {
          scale: 0.86,
          opacity: 0,
          transformOrigin: '0% 50%',
          duration: 0.7,
          ease: 'back.out(1.35)'
        })
        .from(
          title,
          {
            y: 64,
            opacity: 0,
            rotation: -1.2,
            duration: 1,
            ease: 'power4.out'
          },
          '-=0.35'
        )
      if (subtitle) {
        whatTl.from(
          subtitle,
          {
            y: 28,
            opacity: 0,
            x: -16,
            duration: 0.8,
            ease: 'power3.out'
          },
          '-=0.6'
        )
      }

      if (items.length) {
        gsap.from(items, {
          x: (i: number) => (i % 2 === 0 ? -110 : 110),
          opacity: 0,
          stagger: 0.2,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 70%',
            end: 'bottom top',
            toggleActions: 'play none none reverse'
          }
        })
      }
    }, root)

    return () => ctx.revert()
  }, [isReady, sectionRef, classes.solution])
}
