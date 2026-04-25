'use client'

import type React from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'

const CURSOR_PADDING_PX = 8

export function useCursorFillTarget(
  elementRef: React.RefObject<HTMLElement | null>,
  rawFillColor?: string | null
) {
  const applyActiveStyles = (element: HTMLElement): CursorStyleProps => {
    const rect = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)

    return {
      width: `${rect.width + CURSOR_PADDING_PX}px`,
      height: `${rect.height + CURSOR_PADDING_PX}px`,
      borderRadius: computedStyle.borderRadius,
      backgroundColor: getFillColor(element, rawFillColor)
    }
  }

  return useCursorInteraction(elementRef, { applyActiveStyles })
}

function getFillColor(element: HTMLElement, rawFillColor?: string | null) {
  const computedStyle = window.getComputedStyle(element)
  const cssVar = computedStyle.getPropertyValue('--cursor-fill-color')

  if (rawFillColor) return rawFillColor
  if (cssVar) return cssVar
  return computedStyle.color
}
