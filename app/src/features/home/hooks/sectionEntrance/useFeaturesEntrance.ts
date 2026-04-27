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

type ClassNames = {
  cta: string
  ctaTitle: string
  card: string
}

export function useFeaturesEntrance(
  sectionRef: RefObject<HTMLElement | null>,
  classes: ClassNames
) {
  const isReady = useLoadingStore(state => state.isReady)

  useEffect(() => {
    const root = sectionRef.current
    if (!root || !isReady || prefersReducedMotion()) return
    ensureScrollTrigger()

    const { eyebrow, title, subtitle } = querySectionHeader(root)
    const cards = root.querySelectorAll<HTMLElement>(`.${classes.card}`)
    const cta = root.querySelector<HTMLElement>(`.${classes.cta}`)
    const ctaTitle = cta?.querySelector<HTMLElement>(`.${classes.ctaTitle}`)
    const ctaButton = cta?.querySelector<HTMLElement>('a, button')
    if (!eyebrow || !title) return

    const ctx = gsap.context(() => {
      const st = { trigger: root, ...sectionScroll.enterTight, end: 'bottom top' }

      const featTl = gsap.timeline({ scrollTrigger: st })
      featTl
        .from(eyebrow, {
          opacity: 0,
          y: -24,
          duration: 0.55,
          ease: 'sine.inOut'
        })
        .from(
          title,
          {
            opacity: 0,
            y: 80,
            scale: 0.94,
            filter: 'blur(12px)',
            duration: 1.05,
            ease: 'power3.out',
            clearProps: 'filter'
          },
          '-=0.2'
        )
      if (subtitle) {
        featTl.from(
          subtitle,
          {
            opacity: 0,
            y: 36,
            duration: 0.75,
            ease: 'power2.out'
          },
          '-=0.6'
        )
      }

      if (cards.length) {
        gsap.from(cards, {
          y: 88,
          opacity: 0,
          scale: 0.9,
          rotationZ: (i: number) => (i % 2 === 0 ? -0.6 : 0.6),
          stagger: { each: 0.1, from: 'random' as const },
          duration: 0.85,
          ease: 'back.out(1.15)',
          scrollTrigger: {
            trigger: root,
            start: 'top 72%',
            end: 'bottom top',
            toggleActions: 'play none none reverse'
          }
        })
      }

      if (cta && ctaTitle) {
        const ctaNodes = [ctaTitle, ctaButton].filter(Boolean) as HTMLElement[]
        const ctaTl = gsap.timeline({
          scrollTrigger: {
            trigger: cta,
            start: 'top 95%',
            end: 'bottom top',
            toggleActions: 'play none none reverse'
          },
          onComplete: () => {
            gsap.set(ctaNodes, { clearProps: 'all' })
          }
        })
        ctaTl.from(ctaTitle, {
          opacity: 0,
          y: 20,
          scale: 0.92,
          duration: 0.55,
          ease: 'power2.out',
          immediateRender: false
        })
        if (ctaButton) {
          ctaTl.from(
            ctaButton,
            {
              y: 40,
              autoAlpha: 0,
              duration: 0.65,
              ease: 'power3.out',
              immediateRender: false
            },
            '-=0.35'
          )
        }
      }
    }, root)

    return () => ctx.revert()
  }, [isReady, sectionRef, classes.card, classes.cta, classes.ctaTitle])
}
