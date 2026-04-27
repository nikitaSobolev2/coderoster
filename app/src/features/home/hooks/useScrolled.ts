'use client'

import { useEffect, useState } from 'react'

const DEFAULT_THRESHOLD_PX = 100

export function useScrolled(threshold: number = DEFAULT_THRESHOLD_PX): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
