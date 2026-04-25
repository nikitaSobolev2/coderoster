'use client'

import type React from 'react'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'
import { readRootCssVarPx } from '~/shared/utils/cssCustomProperties'

const CURSOR_SCALE_DEFAULT_VAR = '--size-cursor-scale-target-default'

export interface ScaleTargetOptions {
  size?: number
  filled?: boolean
}

export function useCursorScaleTarget(
  elementRef: React.RefObject<HTMLElement | null>,
  { size, filled = true }: ScaleTargetOptions = {}
) {
  const applyActiveStyles = () => {
    const px = size ?? readRootCssVarPx(CURSOR_SCALE_DEFAULT_VAR, 100)
    return {
      width: `${px}px`,
      height: `${px}px`,
      borderRadius: '50%',
      backgroundColor: filled ? 'var(--color-text)' : 'transparent',
      borderColor: 'var(--color-text)'
    }
  }

  return useCursorInteraction(elementRef, {
    lockPosition: false,
    applyActiveStyles
  })
}
