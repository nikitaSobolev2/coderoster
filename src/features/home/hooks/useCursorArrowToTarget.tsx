'use client'

import { useCallback } from 'react'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

export function useCursorArrowToTarget(elementRef: React.RefObject<HTMLElement>) {
  const onInteraction = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)
  }, [])

  return useCursorInteraction(elementRef, {
    cursorType: 'arrow',
    onInteraction: onInteraction
  })
}
