'use client'

import type React from 'react'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

const DEFAULT_SCALE_PX = 100

export interface ScaleTargetOptions {
  size?: number
  filled?: boolean
}

export function useCursorScaleTarget(
  elementRef: React.RefObject<HTMLElement | null>,
  { size = DEFAULT_SCALE_PX, filled = true }: ScaleTargetOptions = {}
) {
  const applyActiveStyles = () => ({
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: filled ? 'var(--color-text)' : 'transparent',
    borderColor: 'var(--color-text)'
  })

  return useCursorInteraction(elementRef, {
    lockPosition: false,
    applyActiveStyles
  })
}
