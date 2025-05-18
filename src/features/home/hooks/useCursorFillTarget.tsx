'use client'

import type React from 'react'
import { useCallback } from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction, type GetInteractionStyles } from './useCursorInteraction'

export function useCursorFillTarget(elementRef: React.RefObject<HTMLElement | null>) {
  const getFillStyles: GetInteractionStyles = useCallback((_element, computedStyle) => {
    const rect = elementRef.current!.getBoundingClientRect() // Safe to use ! because elementRef.current is checked in useCursorInteraction
    const fillStyles: CursorStyleProps = {
      width: rect.width + 8 + 'px',
      height: rect.height + 8 + 'px',
      borderRadius: computedStyle.borderRadius,
      backgroundColor: computedStyle.color,
    }
    return fillStyles
  }, [elementRef])

  useCursorInteraction(elementRef, getFillStyles)
}
