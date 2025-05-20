'use client'

import type React from 'react'
import { useCallback } from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

export function useCursorFillTarget(
  elementRef: React.RefObject<HTMLElement>,
  rawFillColor?: string | null
) {
  const applyActiveStyles = useCallback(
    (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(element)
      const fillColor = getFillColor(element, rawFillColor)

      const cursorStyles: CursorStyleProps = {
        width: rect.width + 8 + 'px',
        height: rect.height + 8 + 'px',
        borderRadius: computedStyle.borderRadius,
        backgroundColor: fillColor
      }

      return cursorStyles
    },
    [rawFillColor]
  )

  return useCursorInteraction(elementRef, {
    applyActiveStyles: applyActiveStyles
  })
}

function getFillColor(element: HTMLElement, rawFillColor?: string | null) {
  const computedStyle = window.getComputedStyle(element)

  if (rawFillColor) {
    return rawFillColor
  } else if (computedStyle.getPropertyValue('--cursor-fill-color')) {
    return computedStyle.getPropertyValue('--cursor-fill-color')
  } else {
    return computedStyle.color
  }
}
