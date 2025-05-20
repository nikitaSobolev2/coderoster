'use client'

import type React from 'react'
import { useCallback } from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

export function useCursorOutlineTarget(
  elementRef: React.RefObject<HTMLElement>,
  rawOutlineColor?: string | null
) {
  const applyActiveStyles = useCallback(
    (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(element)
      const outlineColor = getOutlineColor(element, rawOutlineColor)

      const cursorStyles: CursorStyleProps = {
        width: rect.width + 8 + 'px',
        height: rect.height + 8 + 'px',
        borderRadius: computedStyle.borderRadius,
        borderColor: outlineColor
      }

      return cursorStyles
    },
    [rawOutlineColor]
  )

  return useCursorInteraction(elementRef, {
    applyActiveStyles: applyActiveStyles
  })
}

function getOutlineColor(element: HTMLElement, rawFillColor?: string | null) {
  const computedStyle = window.getComputedStyle(element)

  if (rawFillColor) {
    return rawFillColor
  } else if (computedStyle.getPropertyValue('--cursor-outline-color')) {
    return computedStyle.getPropertyValue('--cursor-outline-color')
  } else {
    return computedStyle.color
  }
}
