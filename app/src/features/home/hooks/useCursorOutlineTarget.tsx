'use client'

import type React from 'react'
import { useCallback } from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

const CURSOR_PADDING_PX = 12

export function useCursorOutlineTarget(
  elementRef: React.RefObject<HTMLElement | null>,
  rawOutlineColor?: string | null
) {
  const applyActiveStyles = useCallback(
    (element: HTMLElement): CursorStyleProps => {
      const rect = element.getBoundingClientRect()
      const computedStyle = globalThis.getComputedStyle(element)

      return {
        width: `${rect.width + CURSOR_PADDING_PX}px`,
        height: `${rect.height + CURSOR_PADDING_PX}px`,
        borderRadius: computedStyle.borderRadius,
        borderColor: getOutlineColor(element, rawOutlineColor)
      }
    },
    [rawOutlineColor]
  )

  return useCursorInteraction(elementRef, { applyActiveStyles })
}

function getOutlineColor(element: HTMLElement, rawOutlineColor?: string | null) {
  const computedStyle = globalThis.getComputedStyle(element)
  const cssVar = computedStyle.getPropertyValue('--cursor-outline-color')

  if (rawOutlineColor) return rawOutlineColor
  if (cssVar) return cssVar
  return computedStyle.color
}
