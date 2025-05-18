'use client'

import type React from 'react'
import { useCallback } from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction, type GetInteractionStyles } from './useCursorInteraction'

export function useCursorOutlineTarget(elementRef: React.RefObject<HTMLElement | null>) {
  const getOutlineStyles: GetInteractionStyles = useCallback((_element, computedStyle) => {
    const rect = elementRef.current!.getBoundingClientRect() // Safe to use ! because elementRef.current is checked in useCursorInteraction
    const outlineStyles: CursorStyleProps = {
      width: rect.width + 8 + 'px',
      height: rect.height + 8 + 'px',
      borderRadius: computedStyle.borderRadius,
      borderColor: computedStyle.color,
    }
    return outlineStyles
  }, [elementRef])

  useCursorInteraction(elementRef, getOutlineStyles)
}
