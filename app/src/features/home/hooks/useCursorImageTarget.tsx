'use client'

import type React from 'react'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

const BUBBLE_WIDTH_PX = 280
const BUBBLE_HEIGHT_PX = 200

export function useCursorImageTarget(
  elementRef: React.RefObject<HTMLElement | null>,
  imageSrc: string
) {
  const applyActiveStyles = () => ({
    width: `${BUBBLE_WIDTH_PX}px`,
    height: `${BUBBLE_HEIGHT_PX}px`,
    borderRadius: 'var(--border-radius-el)',
    backgroundColor: 'transparent',
    borderColor: 'transparent'
  })

  return useCursorInteraction(elementRef, {
    cursorType: 'image',
    media: { type: 'image', src: imageSrc },
    lockPosition: false,
    applyActiveStyles
  })
}
