'use client'

import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { useLoadingStore } from '~/features/home/components/common/AppLoader/loading.store'
import stepCardStyles from '~/features/home/components/ui/StepCard/styles.module.scss'
import {
  ensureScrollTrigger,
  prefersReducedMotion,
  querySectionHeader,
  sectionScroll
} from '~/features/home/animation/sectionEntrance/shared'

export function useHowToStartEntrance(sectionRef: RefObject<HTMLElement | null>) {
  const isReady = useLoadingStore(state => state.isReady)

  useEffect(() => {
    const root = sectionRef.current
    if (!root || !isReady || prefersReducedMotion()) return
    ensureScrollTrigger()

    const { eyebrow, title, subtitle } = querySectionHeader(root)
    const stepEls = Array.from(
      root.querySelectorAll<HTMLElement>(`.${stepCardStyles.step as string}`)
    )
    if (!eyebrow || !title) return

    const ctx = gsap.context(() => {
      const st = { trigger: root, ...sectionScroll.enterLoose, end: 'bottom top' }

      const tl = gsap.timeline({ scrollTrigger: st })

      tl.from(eyebrow, {
        y: 28,
        autoAlpha: 0,
        duration: 0.65,
        ease: 'power2.inOut'
      }).from(
        title,
        {
          scale: 0.91,
          autoAlpha: 0,
          y: 48,
          transformOrigin: '50% 100%',
          duration: 0.9,
          ease: 'power3.inOut'
        },
        '-=0.3'
      )

      if (subtitle) {
        tl.from(
          subtitle,
          {
            x: 48,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power3.out'
          },
          '-=0.45'
        )
      }

      if (stepEls.length > 0) {
        const first = stepEls[0]!
        const rest = stepEls.slice(1)
        tl.from(first, { y: -72, autoAlpha: 0, duration: 0.78, ease: 'power3.out' }, '>-0.12')
        rest.forEach(el => {
          tl.from(el, { y: 100, autoAlpha: 0, duration: 0.72, ease: 'power2.out' }, '>-0.14')
        })
      }
    }, root)

    return () => ctx.revert()
  }, [isReady, sectionRef])
}
