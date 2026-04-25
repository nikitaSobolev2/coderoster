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

type ClassNames = { item: string }

export function useBitterTruthEntrance(
  sectionRef: RefObject<HTMLElement | null>,
  classes: ClassNames
) {
  const isReady = useLoadingStore(state => state.isReady)

  useEffect(() => {
    const root = sectionRef.current
    if (!root || !isReady || prefersReducedMotion()) return
    ensureScrollTrigger()

    const { eyebrow, title, subtitle } = querySectionHeader(root)
    const items = root.querySelectorAll<HTMLElement>(`.${classes.item}`)
    if (!eyebrow || !title) return

    const ctx = gsap.context(() => {
      const trigger = { trigger: root, ...sectionScroll.enterTight }

      const tl = gsap.timeline({ scrollTrigger: { ...trigger, end: 'bottom top' } })
      tl.from(eyebrow, {
        x: -64,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out'
      }).from(
        title,
        {
          y: 40,
          opacity: 0,
          skewX: -4,
          transformOrigin: '0% 50%',
          duration: 0.95,
          ease: 'power4.out'
        },
        '-=0.5'
      )

      if (subtitle) {
        tl.from(
          subtitle,
          {
            y: 32,
            opacity: 0,
            duration: 0.75,
            ease: 'power2.out'
          },
          '-=0.55'
        )
      }

      if (items.length) {
        gsap.from(items, {
          y: 72,
          opacity: 0,
          scale: 0.97,
          rotationZ: -1.2,
          stagger: 0.15,
          duration: 0.95,
          ease: 'expo.out',
          scrollTrigger: { ...trigger, start: 'top 74%' }
        })
      }
    }, root)

    return () => ctx.revert()
  }, [isReady, sectionRef, classes.item])
}
