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
  wordmark: string
  intro: string
  brand: string
  form: string
  bottom: string
}

export function useFooterEntrance(sectionRef: RefObject<HTMLElement | null>, classes: ClassNames) {
  const isReady = useLoadingStore(state => state.isReady)

  useEffect(() => {
    const root = sectionRef.current
    if (!root || !isReady || prefersReducedMotion()) return
    ensureScrollTrigger()

    const intro = root.querySelector<HTMLElement>(`.${classes.intro}`)
    if (!intro) return
    const { eyebrow, title, subtitle } = querySectionHeader(intro)
    const wordmark = root.querySelector<HTMLElement>(`.${classes.wordmark}`)
    const brand = root.querySelector<HTMLElement>(`.${classes.brand}`)
    const form = root.querySelector<HTMLElement>(`.${classes.form}`)
    const bottom = root.querySelector<HTMLElement>(`.${classes.bottom}`)
    const brandChildren = brand ? (Array.from(brand.children) as HTMLElement[]) : []
    if (!eyebrow || !title) return

    const ctx = gsap.context(() => {
      const st = { trigger: root, ...sectionScroll.enterTight, end: 'bottom top' }

      if (wordmark) {
        gsap.from(wordmark, {
          scale: 1.12,
          opacity: 0,
          y: 40,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { ...st, start: 'top 85%' }
        })
      }

      const footTl = gsap.timeline({ scrollTrigger: st })
      footTl.from(eyebrow, { opacity: 0, y: 16, x: 30, duration: 0.7, ease: 'power2.out' }).from(
        title,
        {
          opacity: 0,
          y: 50,
          scale: 0.96,
          transformOrigin: '0% 50%',
          duration: 0.95,
          ease: 'power3.out',
          clearProps: 'scale'
        },
        '-=0.4'
      )
      if (subtitle) {
        footTl.from(subtitle, { opacity: 0, y: 28, duration: 0.7, ease: 'sine.out' }, '-=0.5')
      }

      if (brandChildren.length) {
        gsap.from(brandChildren, {
          x: -28,
          opacity: 0,
          stagger: 0.12,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 70%',
            end: 'bottom top',
            toggleActions: 'play none none reverse'
          }
        })
      }

      if (form) {
        gsap.from(form, {
          x: 64,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 70%',
            end: 'bottom top',
            toggleActions: 'play none none reverse'
          }
        })
      }

      if (bottom) {
        const spanChildren = Array.from(bottom.querySelectorAll('span')) as HTMLElement[]
        if (spanChildren.length) {
          gsap.from(spanChildren, {
            y: 12,
            opacity: 0,
            stagger: 0.15,
            duration: 0.55,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: bottom,
              start: 'top 96%',
              end: 'bottom top',
              toggleActions: 'play none none reverse'
            }
          })
        }
      }
    }, root)

    return () => ctx.revert()
  }, [
    isReady,
    sectionRef,
    classes.brand,
    classes.bottom,
    classes.form,
    classes.intro,
    classes.wordmark
  ])
}
