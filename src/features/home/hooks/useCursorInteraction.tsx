'use client'

import type React from 'react'
import { useEffect, useCallback } from 'react'
import {
  useCursorStore,
  type CursorStyleProps
} from '~/features/home/components/common/Cursor/cursor.store'

export type GetInteractionStyles = (
  element: HTMLElement,
  computedStyle: CSSStyleDeclaration
) => CursorStyleProps

// Hook to be used by elements that should trigger a cursor effect
export function useCursorInteraction(
  elementRef: React.RefObject<HTMLElement | null>,
  getInteractionStyles: GetInteractionStyles
) {
  const { setStyle, resetStyle, lockAtPosition, setLocked } = useCursorStore(state => ({
    setStyle: state.setStyle,
    resetStyle: state.resetStyle,
    lockAtPosition: state.lockAtPosition,
    setLocked: state.setLocked
  }))

  const handleInteractionStart = useCallback(() => {
    if (elementRef?.current) {
      const element = elementRef.current
      const rect = element.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(element)
      const interactionStyles = getInteractionStyles(element, computedStyle)

      setStyle(interactionStyles)
      lockAtPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }
  }, [elementRef, setStyle, lockAtPosition, getInteractionStyles])

  const handleInteractionEnd = useCallback(() => {
    resetStyle()
    setLocked(false) // Unlock the cursor
  }, [resetStyle, setLocked])

  useEffect(() => {
    if (!elementRef?.current) {
      return
    }

    const node = elementRef.current
    if (node) {
      node.addEventListener('mouseenter', handleInteractionStart)
      node.addEventListener('mouseleave', handleInteractionEnd)
      node.addEventListener('focus', handleInteractionStart)
      node.addEventListener('blur', handleInteractionEnd)
      node.addEventListener('focusin', handleInteractionStart)
      node.addEventListener('focusout', handleInteractionEnd)

      // Track focus of children
      const children = node.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      children.forEach(child => {
        if (child instanceof HTMLElement) {
          child.addEventListener('focus', handleInteractionStart)
          child.addEventListener('blur', handleInteractionEnd)
        }
      })

      return () => {
        node.removeEventListener('mouseenter', handleInteractionStart)
        node.removeEventListener('mouseleave', handleInteractionEnd)
        node.removeEventListener('focus', handleInteractionStart)
        node.removeEventListener('blur', handleInteractionEnd)
        node.removeEventListener('focusin', handleInteractionStart)
        node.removeEventListener('focusout', handleInteractionEnd)

        // Clean up child event listeners
        children.forEach(child => {
          if (child instanceof HTMLElement) {
            child.removeEventListener('focus', handleInteractionStart)
            child.removeEventListener('blur', handleInteractionEnd)
          }
        })
      }
    }
  }, [elementRef, handleInteractionStart, handleInteractionEnd])
}
