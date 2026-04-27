'use client'

import type React from 'react'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

const ARROW_CURSOR_SIZE_PX = 140

export function useCursorArrowToTarget(elementRef: React.RefObject<HTMLElement | null>) {
  const applyActiveStyles = () => ({
    width: `${ARROW_CURSOR_SIZE_PX}px`,
    height: `${ARROW_CURSOR_SIZE_PX}px`,
    borderRadius: '50%',
    backgroundColor: 'white',
    borderColor: 'transparent'
  })

  return useCursorInteraction(elementRef, {
    cursorType: 'arrow',
    lockPosition: false,
    applyActiveStyles
  })
}
