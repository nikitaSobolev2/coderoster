'use client'

import type React from 'react'
import { type CursorStyleProps } from '~/features/home/components/common/Cursor/cursor.store'
import { useCursorInteraction } from '~/features/home/hooks/useCursorInteraction'
import { readRootCssVarPx } from '~/shared/utils/cssCustomProperties'

const CURSOR_FILL_PADDING_VAR = '--size-cursor-fill-padding'

export function useCursorFillTarget(
  elementRef: React.RefObject<HTMLElement | null>,
  rawFillColor?: string | null
) {
  const applyActiveStyles = (element: HTMLElement): CursorStyleProps => {
    const rect = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)
    const paddingPx = readRootCssVarPx(CURSOR_FILL_PADDING_VAR, 8)

    return {
      width: `${rect.width + paddingPx}px`,
      height: `${rect.height + paddingPx}px`,
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
