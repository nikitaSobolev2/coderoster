'use client'

import type React from 'react'
import { useCallback } from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction, type GetInteractionStyles } from './useCursorInteraction'

export function useCursorOutlineTarget(elementRef: React.RefObject<HTMLElement | null>, rawOutlineColor?: string | null) {
  const getOutlineStyles: GetInteractionStyles = useCallback((_element, computedStyle) => {
    let outlineColor = null;
    if (rawOutlineColor) {
      outlineColor = rawOutlineColor;
    } else if (computedStyle.getPropertyValue('--cursor-outline-color')) {
      outlineColor = computedStyle.getPropertyValue('--cursor-outline-color');
    } else {
      outlineColor = computedStyle.color;
    }

    const rect = elementRef.current!.getBoundingClientRect() // Safe to use ! because elementRef.current is checked in useCursorInteraction
    const outlineStyles: CursorStyleProps = {
      width: rect.width + 8 + 'px',
      height: rect.height + 8 + 'px',
      borderRadius: computedStyle.borderRadius,
      borderColor: outlineColor,
    }
    return outlineStyles
  }, [elementRef, rawOutlineColor])

  useCursorInteraction(elementRef, getOutlineStyles)
}
