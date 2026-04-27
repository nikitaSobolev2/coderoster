'use client'

import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { useLoadingStore } from '~/features/home/components/common/AppLoader/loading.store'
import {
  ensureScrollTrigger,
  prefersReducedMotion
} from '~/features/home/animation/sectionEntrance/shared'

type ClassNames = {
  title: string
  description: string
  button: string
}

function clearGsapInlineStyles(nodes: HTMLElement[]) {
  if (!nodes.length) return
  gsap.set(nodes, { clearProps: 'all' })
}

export function useHeroEntrance(sectionRef: RefObject<HTMLElement | null>, classes: ClassNames) {
  const isReady = useLoadingStore(state => state.isReady)

  useEffect(() => {
    const root = sectionRef.current
    if (!root || !isReady || prefersReducedMotion()) return
    ensureScrollTrigger()

    const title = root.querySelector<HTMLElement>(`.${classes.title}`)
    const description = root.querySelector<HTMLElement>(`.${classes.description}`)
    const button =
      root.querySelector<HTMLElement>(`.${classes.button}`) ??
      root.querySelector<HTMLElement>('a[href]')
    if (!title) return

    const heroNodes = [title, description, button].filter(Boolean) as HTMLElement[]

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => clearGsapInlineStyles(heroNodes)
      })
      tl.from(title, { y: 48, autoAlpha: 0, duration: 1.05, ease: 'power4.out' })
      if (description) {
        tl.from(description, { y: 28, autoAlpha: 0, duration: 0.85 }, '-=0.45')
      }
      if (button) {
        tl.from(
          button,
          { y: 22, autoAlpha: 0, scale: 0.9, duration: 0.7, ease: 'back.out(1.2)' },
          '-=0.4'
        )
      }
    }, root)

    return () => {
      clearGsapInlineStyles(heroNodes)
      ctx.revert()
    }
  }, [isReady, sectionRef, classes.title, classes.description, classes.button])
}
